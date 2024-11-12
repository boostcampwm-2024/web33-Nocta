import { NodeId, Node } from "./Node";

export interface RemoteInsertOperation {
  node: Node;
}

export interface RemoteDeleteOperation {
  targetId: NodeId | null;
  clock: number;
}

export interface CursorPosition {
  clientId: number;
  position: number;
}
