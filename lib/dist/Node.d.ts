export declare class NodeId {
    clock: number;
    client: number;
    constructor(clock: number, client: number);
    equals(other: NodeId): boolean;
}
export declare class Node {
    id: NodeId;
    value: string;
    next: NodeId | null;
    prev: NodeId | null;
    constructor(value: string, id: NodeId);
    precedes(node: Node): boolean;
}
//# sourceMappingURL=Node.d.ts.map