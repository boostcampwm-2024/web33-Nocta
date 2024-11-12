import { LinkedList } from "./LinkedList";
import { RemoteInsertOperation, RemoteDeleteOperation } from "./interfaces/Crdt";
export declare class CRDT {
    clock: number;
    client: number;
    textLinkedList: LinkedList;
    constructor(client: number);
    localInsert(index: number, value: string): RemoteInsertOperation;
    remoteInsert(operation: RemoteInsertOperation): void;
    remoteDelete(operation: RemoteDeleteOperation): void;
    read(): string;
    spread(): string[];
    localDelete(index: number): RemoteDeleteOperation;
    getTextLinkedList(): LinkedList;
    serialize(): any;
}
//# sourceMappingURL=Crdt.d.ts.map