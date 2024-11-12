"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkedList = void 0;
const Node_1 = require("./Node");
class LinkedList {
    constructor(initialStructure) {
        if (initialStructure) {
            this.head = initialStructure.head;
            this.nodeMap = { ...initialStructure.nodeMap };
        }
        else {
            this.head = null;
            this.nodeMap = {};
        }
    }
    setNode(id, node) {
        this.nodeMap[JSON.stringify(id)] = node;
    }
    getNode(id) {
        if (!id)
            return null;
        return this.nodeMap[JSON.stringify(id)] || null;
    }
    deleteNode(id) {
        const nodeToDelete = this.getNode(id);
        if (!nodeToDelete)
            return;
        if (this.head && this.head.equals(id)) {
            this.head = nodeToDelete.next;
            if (nodeToDelete.next) {
                const nextNode = this.getNode(nodeToDelete.next);
                if (nextNode) {
                    nextNode.prev = null;
                }
            }
        }
        else {
            if (nodeToDelete.prev) {
                const prevNode = this.getNode(nodeToDelete.prev);
                if (prevNode) {
                    prevNode.next = nodeToDelete.next;
                    if (nodeToDelete.next) {
                        const nextNode = this.getNode(nodeToDelete.next);
                        if (nextNode) {
                            nextNode.prev = nodeToDelete.prev;
                        }
                    }
                }
            }
        }
        delete this.nodeMap[JSON.stringify(id)];
    }
    findByIndex(index) {
        if (index < 0) {
            throw new Error(`링크드 리스트에서 특정 인덱스${index}가 음수가 입력되었습니다.`);
        }
        let currentNodeId = this.head;
        let currentIndex = 0;
        while (currentNodeId !== null && currentIndex < index) {
            const currentNode = this.getNode(currentNodeId);
            if (!currentNode) {
                throw new Error(`링크드 리스트에서 특정 인덱스에 해당하는 노드를 찾다가 에러가 발생했습니다. ${currentIndex}`);
            }
            currentNodeId = currentNode.next;
            currentIndex += 1;
        }
        if (currentNodeId === null) {
            throw new Error(`링크드 리스트에서 ${index}를 조회했지만 링크드 리스트가 비어있습니다.  `);
        }
        const node = this.getNode(currentNodeId);
        if (!node) {
            throw new Error(`링크드 리스트에서 인덱스 ${index}에서 노드를 가져오지 못했습니다. `);
        }
        return node;
    }
    insertAtIndex(index, value, id) {
        try {
            const node = new Node_1.Node(value, id);
            this.setNode(id, node);
            if (!this.head || index === -1) {
                node.next = this.head;
                node.prev = null;
                if (this.head) {
                    const oldHead = this.getNode(this.head);
                    if (oldHead) {
                        oldHead.prev = id;
                    }
                }
                this.head = id;
                return { node };
            }
            const prevNode = this.findByIndex(index - 1);
            node.next = prevNode.next;
            prevNode.next = id;
            node.prev = prevNode.id;
            if (node.next) {
                const nextNode = this.getNode(node.next);
                if (nextNode) {
                    nextNode.prev = id;
                }
            }
            return { node };
        }
        catch (e) {
            throw new Error(`링크드 리스트 내에서 insertAtIndex 실패\n${e}`);
        }
    }
    insertById(node) {
        if (this.getNode(node.id)) {
            return;
        }
        if (!node.prev) {
            node.next = this.head;
            node.prev = null;
            if (this.head) {
                const oldHead = this.getNode(this.head);
                if (oldHead) {
                    oldHead.prev = node.id;
                }
            }
            this.head = node.id;
            this.setNode(node.id, node);
            return;
        }
        const prevNode = this.getNode(node.prev);
        if (!prevNode) {
            throw new Error(`원격 삽입 시, 이전 노드를 찾을 수 없습니다. prevId: ${JSON.stringify(node.prev)}`);
        }
        node.next = prevNode.next;
        node.prev = prevNode.id;
        prevNode.next = node.id;
        if (node.next) {
            const nextNode = this.getNode(node.next);
            if (nextNode) {
                nextNode.prev = node.id;
            }
        }
        this.setNode(node.id, node);
    }
    stringify() {
        let currentNodeId = this.head;
        let result = "";
        while (currentNodeId !== null) {
            const currentNode = this.getNode(currentNodeId);
            if (!currentNode)
                break;
            result += currentNode.value;
            currentNodeId = currentNode.next;
        }
        return result;
    }
    spread() {
        let currentNodeId = this.head;
        const result = [];
        while (currentNodeId !== null) {
            const currentNode = this.getNode(currentNodeId);
            if (!currentNode)
                break;
            result.push(currentNode.value);
            currentNodeId = currentNode.next;
        }
        return result;
    }
}
exports.LinkedList = LinkedList;
//# sourceMappingURL=LinkedList.js.map