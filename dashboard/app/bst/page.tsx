'use client';
import { useWS } from '@/context/WebSocketContext';
import { GitBranch, Search, Plus, Trash2, Clock, Zap, RotateCcw, Target } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

interface BSTNodeData {
  id: number;
  ts: number;
  drop: number;
  severity: string;
  confidence: number;
}

interface TreeNode {
  data: BSTNodeData;
  left: TreeNode | null;
  right: TreeNode | null;
}

function insertNode(root: TreeNode | null, data: BSTNodeData): TreeNode {
  if (!root) return { data, left: null, right: null };
  if (data.ts < root.data.ts) root.left = insertNode(root.left, data);
  else if (data.ts > root.data.ts) root.right = insertNode(root.right, data);
  // Avoid duplicate keys by replacing payload
  else root.data = data;
  return root;
}

function inorder(node: TreeNode | null): BSTNodeData[] {
  if (!node) return [];
  return [...inorder(node.left), node.data, ...inorder(node.right)];
}

function preorder(node: TreeNode | null): BSTNodeData[] {
  if (!node) return [];
  return [node.data, ...preorder(node.left), ...preorder(node.right)];
}

function postorder(node: TreeNode | null): BSTNodeData[] {
  if (!node) return [];
  return [...postorder(node.left), ...postorder(node.right), node.data];
}

function treeHeight(node: TreeNode | null): number {
  if (!node) return -1;
  return 1 + Math.max(treeHeight(node.left), treeHeight(node.right));
}

function searchNode(node: TreeNode | null, ts: number): BSTNodeData | null {
  if (!node) return null;
  if (Math.abs(ts - node.data.ts) < 0.05) return node.data;
  if (ts < node.data.ts) return searchNode(node.left, ts);
  return searchNode(node.right, ts);
}

// Layout computation for arbitrary binary search trees
interface LayoutNode {
  data: BSTNodeData;
  x: number;
  y: number;
  depth: number;
  isMatch: boolean;
  isRoot: boolean;
}

interface LayoutEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: 'left' | 'right';
}

function computeTreeLayout(root: TreeNode | null, matchTs: number | null) {
  if (!root) return { nodes: [] as LayoutNode[], edges: [] as LayoutEdge[], width: 480, height: 260 };

  // In-order traversal assigns x-coordinate ordering so lines NEVER cross in a BST
  let inOrderIndex = 0;
  const inOrderMap = new Map<TreeNode, number>();

  function traverseInOrder(n: TreeNode | null) {
    if (!n) return;
    traverseInOrder(n.left);
    inOrderMap.set(n, inOrderIndex++);
    traverseInOrder(n.right);
  }
  traverseInOrder(root);

  const total = inOrderIndex;
  const xSpacing = total <= 5 ? 80 : total <= 9 ? 70 : 60;
  const ySpacing = 72;
  const paddingX = 45;
  const paddingY = 48;

  let maxDepth = 0;
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  function layoutSubtree(node: TreeNode, depth: number, isRoot: boolean): { x: number; y: number } {
    if (depth > maxDepth) maxDepth = depth;
    const x = paddingX + (inOrderMap.get(node) ?? 0) * xSpacing;
    const y = paddingY + depth * ySpacing;
    const isMatch = matchTs !== null && Math.abs(node.data.ts - matchTs) < 0.05;

    nodes.push({ data: node.data, x, y, depth, isMatch, isRoot });

    if (node.left) {
      const child = layoutSubtree(node.left, depth + 1, false);
      edges.push({ x1: x, y1: y, x2: child.x, y2: child.y, type: 'left' });
    }
    if (node.right) {
      const child = layoutSubtree(node.right, depth + 1, false);
      edges.push({ x1: x, y1: y, x2: child.x, y2: child.y, type: 'right' });
    }

    return { x, y };
  }

  layoutSubtree(root, 0, true);

  const calculatedWidth = Math.max(520, paddingX * 2 + (total - 1) * xSpacing);
  const calculatedHeight = Math.max(260, paddingY * 2 + maxDepth * ySpacing + 20);

  // Center nodes if tree is narrower than container
  const offsetX = calculatedWidth > 520 ? 0 : Math.max(0, (520 - (paddingX * 2 + (total - 1) * xSpacing)) / 2);

  const centeredNodes = nodes.map(n => ({ ...n, x: n.x + offsetX }));
  const centeredEdges = edges.map(e => ({ ...e, x1: e.x1 + offsetX, x2: e.x2 + offsetX }));

  return {
    nodes: centeredNodes,
    edges: centeredEdges,
    width: Math.max(520, calculatedWidth),
    height: calculatedHeight
  };
}

export default function BSTPage() {
  const { bstData, sendCommand, connected, mode, demoBSTInsert, demoBSTClear } = useWS();
  const [root, setRoot] = useState<TreeNode | null>(null);

  // Search state
  const [searchTs, setSearchTs] = useState('');
  const [activeMatchTs, setActiveMatchTs] = useState<number | null>(null);
  const [foundNode, setFoundNode] = useState<BSTNodeData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Insert form state
  const [newTs, setNewTs] = useState('');
  const [newDrop, setNewDrop] = useState('');

  // Traversal state
  const [traversal, setTraversal] = useState<'inorder' | 'preorder' | 'postorder'>('inorder');

  // Synchronize from context on mount or update using preorder to preserve true tree balance
  useEffect(() => {
    const list = bstData.preorder && bstData.preorder.length > 0
      ? bstData.preorder
      : (bstData.inorder && bstData.inorder.length > 0 ? bstData.inorder : null);

    if (list && list.length > 0) {
      let r: TreeNode | null = null;
      list.forEach((d) => {
        r = insertNode(r, {
          id: d.id,
          ts: d.timestamp,
          drop: d.voltageDrop,
          severity: d.severity,
          confidence: d.confidence,
        });
      });
      setRoot(r);
    }
  }, [bstData]);

  const traversalList = useMemo(() => {
    if (!root) return [];
    if (traversal === 'inorder') return inorder(root);
    if (traversal === 'preorder') return preorder(root);
    return postorder(root);
  }, [root, traversal]);

  const height = useMemo(() => treeHeight(root), [root]);
  const nodeCount = traversalList.length;

  const handleSearch = (overrideVal?: number) => {
    const val = overrideVal !== undefined ? overrideVal : parseFloat(searchTs);
    if (isNaN(val)) return;
    setHasSearched(true);
    const res = searchNode(root, val);
    setFoundNode(res);
    if (res) {
      setActiveMatchTs(res.ts);
      setSearchTs(res.ts.toFixed(1));
    } else {
      setActiveMatchTs(null);
    }
  };

  const handleInsert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const ts = newTs ? parseFloat(newTs) : +(Math.random() * 9 + 1).toFixed(1);
    const drop = newDrop ? parseFloat(newDrop) : +(Math.random() * 0.5 + 0.25).toFixed(2);
    if (isNaN(ts)) return;

    if (mode === 'real' && connected) {
      sendCommand({ cmd: 'bst', action: 'insert', ts, drop });
    } else if (mode === 'demo') {
      demoBSTInsert(ts, drop);
    } else {
      const newNode: BSTNodeData = {
        id: nodeCount + 1,
        ts,
        drop,
        severity: drop > 0.5 ? 'HIGH' : 'MEDIUM',
        confidence: 85,
      };
      setRoot((r) => insertNode(r, newNode));
    }

    setNewTs('');
    setNewDrop('');
  };

  const fillBalancedDemo = () => {
    // Populate balanced sample tree: root = 5.0s, left = 2.5s, right = 7.5s, etc.
    const sampleNodes: [number, number][] = [
      [5.0, 0.45],
      [2.5, 0.32],
      [7.5, 0.58],
      [1.2, 0.28],
      [3.8, 0.40],
      [6.2, 0.52],
      [8.9, 0.65]
    ];

    if (mode === 'demo') {
      demoBSTClear();
      sampleNodes.forEach(([ts, drop]) => {
        demoBSTInsert(ts, drop);
      });
    } else {
      let r: TreeNode | null = null;
      sampleNodes.forEach(([ts, drop], idx) => {
        r = insertNode(r, {
          id: idx + 1,
          ts,
          drop,
          severity: drop > 0.5 ? 'HIGH' : 'MEDIUM',
          confidence: 80 + idx * 2,
        });
      });
      setRoot(r);
    }
    setActiveMatchTs(null);
    setHasSearched(false);
  };

  const handleClearTree = () => {
    if (mode === 'demo') {
      demoBSTClear();
    }
    setRoot(null);
    setFoundNode(null);
    setActiveMatchTs(null);
    setHasSearched(false);
  };

  // Compute dynamic SVG layout for current tree
  const treeLayout = useMemo(() => {
    return computeTreeLayout(root, activeMatchTs);
  }, [root, activeMatchTs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          Detection Index (Binary Search Tree)
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Timestamp-keyed binary search tree indexing microplastic detection events for logarithmic O(log n) lookups
        </p>
      </div>

      {/* Operations & Interactive Insert / Search Bar */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Tree Operations & Node Insertion</div>
            <div className="card-subtitle">Add custom detection events with explicit timestamps or search in O(log n) time</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px' }} onClick={fillBalancedDemo}>
              <Zap size={13} style={{ color: 'var(--accent-amber)' }} /> Populate Balanced Tree
            </button>
            <button className="btn btn-secondary" style={{ fontSize: 11, padding: '4px 10px', color: '#f87171' }} onClick={handleClearTree}>
              <Trash2 size={13} /> Clear Tree
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {/* Form 1: Insert Node */}
          <form onSubmit={handleInsert} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', whiteSpace: 'nowrap' }}>INSERT:</span>
            <input
              className="input"
              style={{ width: 110, fontSize: 11, padding: '5px 8px' }}
              value={newTs}
              onChange={(e) => setNewTs(e.target.value)}
              placeholder="Timestamp (s)"
            />
            <input
              className="input"
              style={{ width: 100, fontSize: 11, padding: '5px 8px' }}
              value={newDrop}
              onChange={(e) => setNewDrop(e.target.value)}
              placeholder="Drop (V)"
            />
            <button type="submit" className="btn btn-primary" style={{ fontSize: 11, padding: '5px 10px', whiteSpace: 'nowrap' }}>
              <Plus size={13} /> Add Node
            </button>
          </form>

          {/* Form 2: Search Node */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', whiteSpace: 'nowrap' }}>SEARCH:</span>
            <input
              className="input"
              style={{ flex: 1, minWidth: 100, fontSize: 11, padding: '5px 8px' }}
              value={searchTs}
              onChange={(e) => {
                setSearchTs(e.target.value);
                setHasSearched(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="Target timestamp (e.g. 5.0)"
            />
            <button className="btn btn-success" style={{ fontSize: 11, padding: '5px 10px', whiteSpace: 'nowrap' }} onClick={() => handleSearch()}>
              <Search size={13} /> Search O(log n)
            </button>
          </div>
        </div>

        {/* Search Result Banner */}
        {hasSearched && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              background: foundNode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${foundNode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            {foundNode ? (
              <span style={{ color: '#34d399' }}>
                ✓ <strong>Node Found at {foundNode.ts.toFixed(1)}s:</strong> Event #{foundNode.id} • Voltage Drop: <strong>-{foundNode.drop.toFixed(2)}V</strong> • Severity: <strong>{foundNode.severity}</strong> • Highlighted with green halo in tree visualizer below.
              </span>
            ) : (
              <span style={{ color: '#f87171' }}>
                ✕ <strong>No Event Found at {searchTs}s:</strong> Evaluated in logarithmic O(log n) tree comparisons. Node is not present in the current BST index.
              </span>
            )}
            <button
              className="btn btn-secondary"
              style={{ fontSize: 10, padding: '2px 8px' }}
              onClick={() => {
                setHasSearched(false);
                setActiveMatchTs(null);
              }}
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Total BST Nodes</span>
            <GitBranch size={15} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="metric-val">{nodeCount}</div>
          <span className="metric-badge cyan">Index Size</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Tree Height</span>
            <Clock size={15} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="metric-val">{height >= 0 ? height : 0} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>levels</span></div>
          <span className="metric-badge cyan">O(log n) Depth</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Root Key</span>
            <Zap size={15} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div className="metric-val">{root ? `${root.data.ts.toFixed(1)}s` : '--'}</div>
          <span className="metric-badge green">Partition Value</span>
        </div>

        <div className="metric-card">
          <div className="metric-top">
            <span className="metric-label">Search Complexity</span>
            <Search size={15} style={{ color: 'var(--accent-emerald)' }} />
          </div>
          <div className="metric-val" style={{ fontSize: 18 }}>O(log n)</div>
          <span className="metric-badge green">Logarithmic</span>
        </div>
      </div>

      {/* 2-Column Section: Tree Visualizer + Traversal Table */}
      <div className="dashboard-columns">
        {/* Left: Dynamic SVG Tree View */}
        <div className="card" style={{ minHeight: 380, display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Hierarchical Tree Structure</div>
              <div className="card-subtitle">
                Left subtree (ts &lt; parent) • Right subtree (ts &gt; parent) • Click any node to search
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="badge badge-blue">h = {height >= 0 ? height : 0}</span>
              <span className="badge badge-cyan">{nodeCount} nodes</span>
            </div>
          </div>

          {!root || treeLayout.nodes.length === 0 ? (
            <div className="empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 16px' }}>
              <GitBranch size={36} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.5 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Binary Search Tree is Empty</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 360, textAlign: 'center', marginBottom: 16 }}>
                Insert detection events using the form above, or click below to populate a balanced 7-node reference tree.
              </div>
              <button className="btn btn-primary" onClick={fillBalancedDemo}>
                <Zap size={13} /> Populate Balanced Sample Tree
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'auto', padding: '10px 0' }}>
              {/* Dynamic SVG with automatic bounds and connection lines */}
              <svg
                width={treeLayout.width}
                height={treeLayout.height}
                viewBox={`0 0 ${treeLayout.width} ${treeLayout.height}`}
                style={{ margin: '0 auto', display: 'block', minWidth: treeLayout.width }}
              >
                <defs>
                  {/* Glowing filter for matched node */}
                  <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Connecting Edges */}
                {treeLayout.edges.map((edge, idx) => (
                  <line
                    key={`edge-${idx}`}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={edge.type === 'left' ? 'rgba(6, 182, 212, 0.45)' : 'rgba(139, 92, 246, 0.45)'}
                    strokeWidth="2"
                    strokeDasharray={edge.type === 'left' ? '4 3' : '3 3'}
                  />
                ))}

                {/* Tree Nodes */}
                {treeLayout.nodes.map((node, idx) => {
                  const isMatch = node.isMatch;
                  const isRoot = node.isRoot;

                  return (
                    <g
                      key={`node-${node.data.id}-${node.data.ts}-${idx}`}
                      transform={`translate(${node.x}, ${node.y})`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSearch(node.data.ts)}
                    >
                      {/* Halo ring for match */}
                      {isMatch && (
                        <circle
                          r="32"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          opacity="0.8"
                          filter="url(#glow-emerald)"
                        />
                      )}

                      {/* Node Circle */}
                      <circle
                        r={isRoot ? 26 : 23}
                        fill={isMatch ? '#064e3b' : '#0f172a'}
                        stroke={
                          isMatch
                            ? '#10b981'
                            : isRoot
                            ? 'var(--accent-cyan)'
                            : node.data.drop > 0.5
                            ? 'var(--accent-rose)'
                            : 'rgba(6, 182, 212, 0.6)'
                        }
                        strokeWidth={isMatch ? 3 : isRoot ? 2.5 : 2}
                      />

                      {/* Timestamp Text (Key) */}
                      <text
                        textAnchor="middle"
                        y="-2"
                        fill="#fff"
                        fontSize={isRoot ? 11 : 10}
                        fontWeight="700"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {node.data.ts.toFixed(1)}s
                      </text>

                      {/* Voltage Drop Text */}
                      <text
                        textAnchor="middle"
                        y="11"
                        fill={isMatch ? '#6ee7b7' : 'var(--accent-rose)'}
                        fontSize={isRoot ? 9 : 8}
                        fontWeight="600"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        -{node.data.drop.toFixed(2)}V
                      </text>

                      {/* Root / Match Badge */}
                      {isMatch && (
                        <text textAnchor="middle" y="-36" fill="#10b981" fontSize="9" fontWeight="800">
                          MATCH
                        </text>
                      )}
                      {isRoot && !isMatch && (
                        <text textAnchor="middle" y="-30" fill="var(--accent-cyan)" fontSize="8" fontWeight="700">
                          ROOT
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Visual Legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, fontSize: 11, color: 'var(--text-muted)', marginTop: 12, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)' }} /> Left Subtree (&lt; Key)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-purple)' }} /> Right Subtree (&gt; Key)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Search Match
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Traversal Table */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Tree Traversal Records</div>
              <div className="card-subtitle">Select traversal algorithm order</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className={`btn ${traversal === 'inorder' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 10, padding: '3px 7px' }}
                onClick={() => setTraversal('inorder')}
              >
                In-Order (Sorted)
              </button>
              <button
                className={`btn ${traversal === 'preorder' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 10, padding: '3px 7px' }}
                onClick={() => setTraversal('preorder')}
              >
                Pre-Order
              </button>
              <button
                className={`btn ${traversal === 'postorder' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 10, padding: '3px 7px' }}
                onClick={() => setTraversal('postorder')}
              >
                Post-Order
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 380 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>Timestamp (Key)</th>
                  <th>Voltage Drop</th>
                  <th>Severity</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {traversalList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px 12px', color: 'var(--text-muted)' }}>
                      Tree is empty. Add nodes to view traversal sequences.
                    </td>
                  </tr>
                ) : (
                  traversalList.map((n, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: activeMatchTs !== null && Math.abs(n.ts - activeMatchTs) < 0.05 ? 'rgba(16, 185, 129, 0.12)' : undefined,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleSearch(n.ts)}
                    >
                      <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{idx + 1}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{Number(n.ts).toFixed(1)} s</td>
                      <td style={{ color: 'var(--accent-rose)', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                        -{Number(n.drop).toFixed(2)} V
                      </td>
                      <td>
                        <span className={`badge ${n.severity === 'HIGH' ? 'badge-red' : 'badge-yellow'}`}>
                          {n.severity}
                        </span>
                      </td>
                      <td style={{ fontFamily: "'JetBrains Mono', monospace" }}>{Number(n.confidence).toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Embedded C++ BST Architecture Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Binary Search Tree Microcontroller Architecture</div>
            <div className="card-subtitle">Logarithmic time indexing mechanics in embedded sensor networks</div>
          </div>
          <span className="badge badge-purple">O(log n) Index</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6 }}>C++ BST NODE STRUCT</div>
            <pre style={{ margin: 0, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-secondary)', lineHeight: 1.4 }}>
{`struct BSTNode {
  double timestamp;   // Search Key
  double voltageDrop; // Payload
  uint8_t severity;
  BSTNode* left;      // 4 bytes
  BSTNode* right;     // 4 bytes
};`}
            </pre>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: 6 }}>SEARCH EFFICIENCY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Average Search:</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(log n)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Insertion:</span>
                <strong style={{ display: 'block', color: 'var(--accent-emerald)', fontFamily: "'JetBrains Mono', monospace" }}>O(log n)</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>In-Order Traversal:</span>
                <strong style={{ display: 'block', color: 'var(--accent-cyan)', fontFamily: "'JetBrains Mono', monospace" }}>O(n) Sorted</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Max Comparisons:</span>
                <strong style={{ display: 'block', color: 'var(--accent-purple)', fontFamily: "'JetBrains Mono', monospace" }}>h = ⌈log₂ n⌉</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-amber)', marginBottom: 6 }}>WHY BST OVER LINEAR LOG</div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              While the Singly Linked List logs raw sensor readings linearly in O(n), the BST indexes only confirmed microplastic events by timestamp key. When querying whether an anomaly occurred at t = 5.0s, the binary search resolves in only ~3 comparisons instead of scanning 1,000 readings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
