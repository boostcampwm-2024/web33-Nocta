// node.ts
export class NodeId {
  clock: number;
  client: number;

  constructor(clock: number, client: number) {
    this.clock = clock;
    this.client = client;
  }

  equals(other: NodeId): boolean {
    return this.clock === other.clock && this.client === other.client;
  }
}

export class Node {
  id: NodeId;
  value: string;
  next: NodeId | null;
  prev: NodeId | null;

  constructor(value: string, id: NodeId) {
    this.id = id;
    this.value = value;
    this.next = null;
    this.prev = null;
  }

  /**
   * 두 노드의 순서를 비교하여, 이 노드가 다른 노드보다 먼저 와야 하는지 여부를 반환합니다.
   * @param node 비교할 노드
   * @returns 순서 결정 결과
   */
  precedes(node: Node): boolean {
    // prev가 다르면 비교 불가
    if (!this.prev || !node.prev) return false;
    if (!this.prev.equals(node.prev)) return false;

    if (this.id.clock < node.id.clock) return true;
    if (this.id.clock === node.id.clock && this.id.client < node.id.client) return true;

    return false;
  }
}
