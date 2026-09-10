// ============================================================
//  DetectionBST.h
//  BINARY SEARCH TREE: Index detection events by timestamp
//  DSA Concepts: BST, Recursive Traversal, Pointers, Trees
// ============================================================
#ifndef DETECTION_BST_H
#define DETECTION_BST_H

#include "MicroplasticEvent.h"

// ---- BST Node ----
struct BSTNode {
    MicroplasticEvent data;
    BSTNode* left;      // POINTER to left subtree (earlier timestamps)
    BSTNode* right;     // POINTER to right subtree (later timestamps)

    BSTNode(MicroplasticEvent event)
        : data(event), left(nullptr), right(nullptr) {}
};

// ---- Class: DetectionBST (Binary Search Tree) ----
// Events are indexed by timestamp for fast O(log n) lookup
// Left subtree = earlier events, Right subtree = later events
class DetectionBST {
private:
    BSTNode* root;      // POINTER to root of the tree
    int size;

    // ---- Private recursive helper: Insert ----
    BSTNode* insertHelper(BSTNode* node, MicroplasticEvent event) {
        if (node == nullptr) {
            return new BSTNode(event);
        }

        if (event.getTimestamp() < node->data.getTimestamp()) {
            node->left = insertHelper(node->left, event);   // Go left
        } else {
            node->right = insertHelper(node->right, event);  // Go right
        }
        return node;
    }

    // ---- Private recursive helper: Inorder Traversal ----
    // Left → Root → Right = Chronological order (sorted by timestamp)
    void inorderHelper(BSTNode* node) const {
        if (node == nullptr) return;

        inorderHelper(node->left);      // Visit left subtree
        node->data.display();           // Visit root
        inorderHelper(node->right);     // Visit right subtree
    }

    // ---- Private recursive helper: Preorder Traversal ----
    // Root → Left → Right
    void preorderHelper(BSTNode* node) const {
        if (node == nullptr) return;

        node->data.display();
        preorderHelper(node->left);
        preorderHelper(node->right);
    }

    // ---- Private recursive helper: Postorder Traversal ----
    // Left → Right → Root
    void postorderHelper(BSTNode* node) const {
        if (node == nullptr) return;

        postorderHelper(node->left);
        postorderHelper(node->right);
        node->data.display();
    }

    // ---- Private: Search by timestamp ----
    BSTNode* searchHelper(BSTNode* node, double timestamp) const {
        if (node == nullptr) return nullptr;

        if (timestamp == node->data.getTimestamp())
            return node;
        else if (timestamp < node->data.getTimestamp())
            return searchHelper(node->left, timestamp);
        else
            return searchHelper(node->right, timestamp);
    }

    // ---- Private: Find minimum node (leftmost) ----
    BSTNode* findMin(BSTNode* node) const {
        while (node->left != nullptr)
            node = node->left;
        return node;
    }

    // ---- Private recursive helper: Delete by timestamp ----
    BSTNode* deleteHelper(BSTNode* node, double timestamp) {
        if (node == nullptr) return nullptr;

        if (timestamp < node->data.getTimestamp()) {
            node->left = deleteHelper(node->left, timestamp);
        } else if (timestamp > node->data.getTimestamp()) {
            node->right = deleteHelper(node->right, timestamp);
        } else {
            // Found the node to delete

            // Case 1: Leaf node (no children)
            if (node->left == nullptr && node->right == nullptr) {
                delete node;
                size--;
                return nullptr;
            }
            // Case 2: One child
            else if (node->left == nullptr) {
                BSTNode* temp = node->right;
                delete node;
                size--;
                return temp;
            } else if (node->right == nullptr) {
                BSTNode* temp = node->left;
                delete node;
                size--;
                return temp;
            }
            // Case 3: Two children — replace with inorder successor
            else {
                BSTNode* successor = findMin(node->right);
                node->data = successor->data;
                node->right = deleteHelper(node->right, successor->data.getTimestamp());
            }
        }
        return node;
    }

    // ---- Private: Range search (find events between two timestamps) ----
    void rangeSearchHelper(BSTNode* node, double start, double end, int& count) const {
        if (node == nullptr) return;

        if (node->data.getTimestamp() > start)
            rangeSearchHelper(node->left, start, end, count);

        if (node->data.getTimestamp() >= start && node->data.getTimestamp() <= end) {
            node->data.display();
            count++;
        }

        if (node->data.getTimestamp() < end)
            rangeSearchHelper(node->right, start, end, count);
    }

    // ---- Private: Calculate tree height ----
    int heightHelper(BSTNode* node) const {
        if (node == nullptr) return -1;
        int leftHeight = heightHelper(node->left);
        int rightHeight = heightHelper(node->right);
        return 1 + max(leftHeight, rightHeight);
    }

    // ---- Private: Destroy tree (for destructor) ----
    void destroyTree(BSTNode* node) {
        if (node == nullptr) return;
        destroyTree(node->left);
        destroyTree(node->right);
        delete node;
    }

public:
    // Constructor
    DetectionBST() : root(nullptr), size(0) {}

    // Destructor
    ~DetectionBST() {
        destroyTree(root);
    }

    // ---- Insert Event — O(log n) average ----
    void insert(MicroplasticEvent event) {
        root = insertHelper(root, event);
        size++;
    }

    // ---- Search by Timestamp — O(log n) average ----
    bool search(double timestamp) const {
        BSTNode* result = searchHelper(root, timestamp);
        if (result != nullptr) {
            cout << "  Found event at timestamp " << timestamp << "s:" << endl;
            result->data.display();
            return true;
        }
        cout << "  No event found at timestamp " << timestamp << "s" << endl;
        return false;
    }

    // ---- Delete by Timestamp — O(log n) average ----
    void deleteEvent(double timestamp) {
        root = deleteHelper(root, timestamp);
    }

    // ---- Inorder Traversal (Chronological) ----
    void displayInorder() const {
        if (root == nullptr) {
            cout << "  [BST is empty]" << endl;
            return;
        }
        cout << "\n  ====== BST INORDER (Chronological Order) ======" << endl;
        cout << "  Total Events: " << size << " | Tree Height: " << heightHelper(root) << endl;
        cout << "  ------------------------------------------------" << endl;
        inorderHelper(root);
        cout << "  ================================================\n" << endl;
    }

    // ---- Preorder Traversal ----
    void displayPreorder() const {
        if (root == nullptr) {
            cout << "  [BST is empty]" << endl;
            return;
        }
        cout << "\n  ====== BST PREORDER Traversal ======" << endl;
        preorderHelper(root);
        cout << "  ====================================\n" << endl;
    }

    // ---- Postorder Traversal ----
    void displayPostorder() const {
        if (root == nullptr) {
            cout << "  [BST is empty]" << endl;
            return;
        }
        cout << "\n  ====== BST POSTORDER Traversal ======" << endl;
        postorderHelper(root);
        cout << "  =====================================\n" << endl;
    }

    // ---- Range Search — Find all events between two timestamps ----
    void rangeSearch(double startTime, double endTime) const {
        cout << "\n  ====== RANGE SEARCH [" << startTime << "s — " << endTime << "s] ======" << endl;
        int count = 0;
        rangeSearchHelper(root, startTime, endTime, count);
        cout << "  Found " << count << " events in range." << endl;
        cout << "  =============================================\n" << endl;
    }

    // ---- Getters ----
    int getSize() const { return size; }
    int getHeight() const { return heightHelper(root); }
    bool isEmpty() const { return root == nullptr; }
};

#endif // DETECTION_BST_H
