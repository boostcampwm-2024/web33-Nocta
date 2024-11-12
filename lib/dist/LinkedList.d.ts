import { NodeId, Node } from "./Node";
interface InsertOperation {
    node: Node;
}
export declare class LinkedList {
    head: NodeId | null;
    nodeMap: {
        [key: string]: Node;
    };
    constructor(initialStructure?: LinkedList);
    setNode(id: NodeId, node: Node): void;
    getNode(id: NodeId | null): Node | null;
    deleteNode(id: NodeId): void;
    findByIndex(index: number): Node;
    insertAtIndex(index: number, value: string, id: NodeId): InsertOperation;
    insertById(node: Node): void;
    stringify(): string;
    spread(): string[];
}
export {};
//# sourceMappingURL=LinkedList.d.ts.map