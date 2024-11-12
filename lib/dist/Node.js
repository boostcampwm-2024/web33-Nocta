"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Node = exports.NodeId = void 0;
class NodeId {
    constructor(clock, client) {
        this.clock = clock;
        this.client = client;
    }
    equals(other) {
        return this.clock === other.clock && this.client === other.client;
    }
}
exports.NodeId = NodeId;
class Node {
    constructor(value, id) {
        this.id = id;
        this.value = value;
        this.next = null;
        this.prev = null;
    }
    precedes(node) {
        if (!this.prev || !node.prev)
            return false;
        if (!this.prev.equals(node.prev))
            return false;
        if (this.id.clock < node.id.clock)
            return true;
        if (this.id.clock === node.id.clock && this.id.client < node.id.client)
            return true;
        return false;
    }
}
exports.Node = Node;
//# sourceMappingURL=Node.js.map