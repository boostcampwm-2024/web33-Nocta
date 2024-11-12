"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRDT = void 0;
const LinkedList_1 = require("./LinkedList");
const Node_1 = require("./Node");
class CRDT {
    constructor(client) {
        this.clock = 0;
        this.client = client;
        this.textLinkedList = new LinkedList_1.LinkedList();
    }
    localInsert(index, value) {
        const id = new Node_1.NodeId((this.clock += 1), this.client);
        const remoteInsertion = this.textLinkedList.insertAtIndex(index, value, id);
        return { node: remoteInsertion.node };
    }
    remoteInsert(operation) {
        const newNodeId = new Node_1.NodeId(operation.node.id.clock, operation.node.id.client);
        const newNode = new Node_1.Node(operation.node.value, newNodeId);
        newNode.next = operation.node.next;
        newNode.prev = operation.node.prev;
        this.textLinkedList.insertById(newNode);
        if (this.clock <= newNode.id.clock) {
            this.clock = newNode.id.clock + 1;
        }
    }
    remoteDelete(operation) {
        const { targetId, clock } = operation;
        if (targetId) {
            this.textLinkedList.deleteNode(targetId);
        }
        if (this.clock <= clock) {
            this.clock = clock + 1;
        }
    }
    read() {
        return this.textLinkedList.stringify();
    }
    spread() {
        return this.textLinkedList.spread();
    }
    localDelete(index) {
        if (index < 0 || index >= this.textLinkedList.spread().length) {
            throw new Error(`유효하지 않은 인덱스입니다: ${index}`);
        }
        const nodeToDelete = this.textLinkedList.findByIndex(index);
        if (!nodeToDelete) {
            throw new Error(`삭제할 노드를 찾을 수 없습니다. 인덱스: ${index}`);
        }
        const operation = {
            targetId: nodeToDelete.id,
            clock: this.clock + 1,
        };
        this.textLinkedList.deleteNode(nodeToDelete.id);
        this.clock += 1;
        return operation;
    }
    getTextLinkedList() {
        return this.textLinkedList;
    }
    serialize() {
        return {
            clock: this.clock,
            client: this.client,
            textLinkedList: {
                head: this.textLinkedList.head,
                nodeMap: this.textLinkedList.nodeMap,
            },
        };
    }
}
exports.CRDT = CRDT;
//# sourceMappingURL=Crdt.js.map