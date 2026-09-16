// ============================================================
//  DetectionBST.h (Arduino/ESP32 Version)
//  BINARY SEARCH TREE: Index events by timestamp
//  DSA Concepts: BST, Recursion, Tree Traversals, Pointers
// ============================================================
#ifndef DETECTION_BST_H
#define DETECTION_BST_H

#include "MicroplasticEvent.h"

struct BSTNode {
    MicroplasticEvent data;
    BSTNode* left;
    BSTNode* right;
    BSTNode(MicroplasticEvent event) : data(event), left(nullptr), right(nullptr) {}
};

// ---- Class: DetectionBST ----
class DetectionBST {
private:
    BSTNode* root;
    int size;

    BSTNode* insertHelper(BSTNode* node, MicroplasticEvent event) {
        if (node == nullptr) return new BSTNode(event);
        if (event.getTimestamp() < node->data.getTimestamp())
            node->left = insertHelper(node->left, event);
        else
            node->right = insertHelper(node->right, event);
        return node;
    }

    void inorderHelper(BSTNode* node) const {
        if (node == nullptr) return;
        inorderHelper(node->left);
        node->data.display();
        inorderHelper(node->right);
    }

    void preorderHelper(BSTNode* node) const {
        if (node == nullptr) return;
        node->data.display();
        preorderHelper(node->left);
        preorderHelper(node->right);
    }

    void postorderHelper(BSTNode* node) const {
        if (node == nullptr) return;
        postorderHelper(node->left);
        postorderHelper(node->right);
        node->data.display();
    }

    BSTNode* searchHelper(BSTNode* node, float timestamp) const {
        if (node == nullptr) return nullptr;
        if (timestamp == node->data.getTimestamp()) return node;
        else if (timestamp < node->data.getTimestamp())
            return searchHelper(node->left, timestamp);
        else
            return searchHelper(node->right, timestamp);
    }

    BSTNode* findMin(BSTNode* node) const {
        while (node->left != nullptr) node = node->left;
        return node;
    }

    BSTNode* deleteHelper(BSTNode* node, float timestamp) {
        if (node == nullptr) return nullptr;
        if (timestamp < node->data.getTimestamp())
            node->left = deleteHelper(node->left, timestamp);
        else if (timestamp > node->data.getTimestamp())
            node->right = deleteHelper(node->right, timestamp);
        else {
            if (node->left == nullptr && node->right == nullptr) {
                delete node; size--; return nullptr;
            } else if (node->left == nullptr) {
                BSTNode* temp = node->right; delete node; size--; return temp;
            } else if (node->right == nullptr) {
                BSTNode* temp = node->left; delete node; size--; return temp;
            } else {
                BSTNode* successor = findMin(node->right);
                node->data = successor->data;
                node->right = deleteHelper(node->right, successor->data.getTimestamp());
            }
        }
        return node;
    }

    void rangeSearchHelper(BSTNode* node, float start, float end, int& count) const {
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

    int heightHelper(BSTNode* node) const {
        if (node == nullptr) return -1;
        int l = heightHelper(node->left);
        int r = heightHelper(node->right);
        return 1 + (l > r ? l : r);
    }

    void destroyTree(BSTNode* node) {
        if (node == nullptr) return;
        destroyTree(node->left);
        destroyTree(node->right);
        delete node;
    }

public:
    DetectionBST() : root(nullptr), size(0) {}
    ~DetectionBST() { destroyTree(root); }

    void insert(MicroplasticEvent event) {
        root = insertHelper(root, event);
        size++;
    }

    bool search(float timestamp) const {
        BSTNode* result = searchHelper(root, timestamp);
        if (result != nullptr) {
            Serial.print("  Found at "); Serial.print(timestamp, 2); Serial.println("s:");
            result->data.display();
            return true;
        }
        Serial.print("  Not found at "); Serial.print(timestamp, 2); Serial.println("s");
        return false;
    }

    void deleteEvent(float timestamp) { root = deleteHelper(root, timestamp); }

    void displayInorder() const {
        if (root == nullptr) { Serial.println("  [BST empty]"); return; }
        Serial.println("\n  ====== BST INORDER (Chronological) ======");
        Serial.print("  Events: "); Serial.print(size);
        Serial.print(" | Height: "); Serial.println(heightHelper(root));
        inorderHelper(root);
        Serial.println("  =========================================\n");
    }

    void displayPreorder() const {
        if (root == nullptr) { Serial.println("  [BST empty]"); return; }
        Serial.println("\n  ====== BST PREORDER ======");
        preorderHelper(root);
        Serial.println("  =========================\n");
    }

    void displayPostorder() const {
        if (root == nullptr) { Serial.println("  [BST empty]"); return; }
        Serial.println("\n  ====== BST POSTORDER ======");
        postorderHelper(root);
        Serial.println("  ==========================\n");
    }

    void rangeSearch(float startTime, float endTime) const {
        Serial.print("\n  ====== RANGE [");
        Serial.print(startTime, 1); Serial.print("s - ");
        Serial.print(endTime, 1); Serial.println("s] ======");
        int count = 0;
        rangeSearchHelper(root, startTime, endTime, count);
        Serial.print("  Found "); Serial.print(count); Serial.println(" events.");
        Serial.println("  ==============================\n");
    }

    int getSize() const { return size; }
    int getHeight() const { return heightHelper(root); }
    bool isEmpty() const { return root == nullptr; }
};

#endif
