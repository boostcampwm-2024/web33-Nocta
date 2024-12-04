import { Node, Char, Block } from "./Node";
import { NodeId, BlockId, CharId } from "./NodeId";
import { ReorderNodesProps } from "./Interfaces";

export abstract class LinkedList<T extends Node<NodeId>> {
  head: T["id"] | null;
  nodeMap: { [key: string]: T };

  constructor(initialStructure?: LinkedList<T>) {
    if (initialStructure) {
      this.head = initialStructure.head;
      this.nodeMap = { ...initialStructure.nodeMap };
    } else {
      this.head = null;
      this.nodeMap = {};
    }
  }

  setNode(id: T["id"], node: T): void {
    this.nodeMap[JSON.stringify(id)] = node;
  }

  getNode(id: T["id"] | null): T {
    if (!id) {
      throw new Error(`Invalid node id: ${id}`);
    }
    const node = this.nodeMap[JSON.stringify(id)];
    if (!node) {
      throw new Error(`Node not found: ${JSON.stringify(id)}`);
    }
    return node;
  }

  deleteNode(id: T["id"]): void {
    const nodeToDelete = this.getNode(id);

    if (this.head && id.equals(this.head)) {
      this.head = nodeToDelete.next;
      if (nodeToDelete.next) {
        const nextNode = this.getNode(nodeToDelete.next);
        nextNode.prev = null;
      }
    } else {
      if (nodeToDelete.prev) {
        const prevNode = this.getNode(nodeToDelete.prev);
        prevNode.next = nodeToDelete.next;
      }
      if (nodeToDelete.next) {
        const nextNode = this.getNode(nodeToDelete.next);
        nextNode.prev = nodeToDelete.prev;
      }
    }

    delete this.nodeMap[JSON.stringify(id)];
  }

  updateAllOrderedListIndices() {}

  reorderNodes({ targetId, beforeId, afterId }: ReorderNodesProps): void {}

  findByIndex(index: number): T {
    if (index < 0) {
      throw new Error(`Invalid negative index: ${index}`);
    }

    let currentNodeId = this.head;
    let currentIndex = 0;

    const visitedNodes = new Set<string>();

    while (currentNodeId !== null && currentIndex <= index) {
      if (visitedNodes.has(JSON.stringify(currentNodeId))) {
        throw new Error("Circular reference detected.");
      }
      visitedNodes.add(JSON.stringify(currentNodeId));

      const currentNode = this.getNode(currentNodeId);
      if (currentIndex === index) {
        return currentNode;
      }
      currentNodeId = currentNode.next;
      currentIndex += 1;
    }

    throw new Error(`Index out of bounds: ${index}`);
  }

  insertAtIndex(index: number, value: string, id: T["id"]) {
    if (index < 0) {
      throw new Error(`Invalid negative index: ${index}`);
    }

    const node = this.createNode(value, id);
    this.setNode(id, node);

    if (!this.head || index <= 0) {
      node.next = this.head;
      node.prev = null;
      if (this.head) {
        const oldHead = this.getNode(this.head);
        oldHead.prev = id;
      }

      this.head = id;
      return { node };
    }

    const prevNode = this.findByIndex(index - 1);
    node.next = prevNode.next;
    node.prev = prevNode.id;
    prevNode.next = id;

    if (node.next) {
      const nextNode = this.getNode(node.next);
      nextNode.prev = id;
    }

    return { node };
  }

  insertById(node: T): void {
    if (this.nodeMap[JSON.stringify(node.id)]) return;

    if (node.prev) {
      const prevNode = this.getNode(node.prev);
      node.next = prevNode.next;
      prevNode.next = node.id;

      if (node.next) {
        const nextNode = this.getNode(node.next);
        nextNode.prev = node.id;
      }
    } else {
      node.next = this.head;
      node.prev = null;
      if (this.head) {
        const oldHead = this.getNode(this.head);
        oldHead.prev = node.id;
      }
      this.head = node.id;
    }

    this.setNode(node.id, node);
  }

  getNodesBetween(startIndex: number, endIndex: number): T[] {
    if (startIndex < 0 || endIndex < startIndex) {
      throw new Error(`Invalid indices: startIndex=${startIndex}, endIndex=${endIndex}`);
    }

    const result: T[] = [];
    let currentNodeId = this.head;
    let currentIndex = 0;

    const visitedNodes = new Set<string>();

    // 시작 인덱스까지 이동
    while (currentNodeId !== null && currentIndex < endIndex) {
      if (visitedNodes.has(JSON.stringify(currentNodeId))) {
        throw new Error("Circular reference detected.");
      }
      visitedNodes.add(JSON.stringify(currentNodeId));

      const currentNode = this.getNode(currentNodeId);
      if (currentIndex >= startIndex) {
        result.push(currentNode);
      }
      currentNodeId = currentNode.next;
      currentIndex += 1;
    }

    if (currentIndex < endIndex) {
      throw new Error(`End index out of bounds: ${endIndex}`);
    }

    return result;
  }

  stringify(): string {
    let currentNodeId = this.head;
    let result = "";

    const visitedNodes = new Set<string>();

    while (currentNodeId !== null) {
      if (visitedNodes.has(JSON.stringify(currentNodeId))) {
        throw new Error("Circular reference detected.");
      }
      visitedNodes.add(JSON.stringify(currentNodeId));

      const currentNode = this.getNode(currentNodeId);
      result += currentNode.value;
      currentNodeId = currentNode.next;
    }

    return result;
  }

  spread(): T[] {
    let currentNodeId = this.head;
    const result: T[] = [];

    const visitedNodes = new Set<string>();

    while (currentNodeId !== null) {
      if (visitedNodes.has(JSON.stringify(currentNodeId))) {
        throw new Error("Circular reference detected.");
      }
      visitedNodes.add(JSON.stringify(currentNodeId));

      const currentNode = this.getNode(currentNodeId);
      result.push(currentNode);
      currentNodeId = currentNode.next;
    }
    return result;
  }

  serialize(): any {
    return {
      head: this.head ? this.head.serialize() : null,
      nodeMap: Object.fromEntries(
        Object.entries(this.nodeMap).map(([key, value]) => [key, value.serialize()]),
      ),
    };
  }

  deserialize(data: any): void {
    this.head = data.head ? this.deserializeNodeId(data.head) : null;
    this.nodeMap = {};
    for (const key in data.nodeMap) {
      this.nodeMap[key] = this.deserializeNode(data.nodeMap[key]);
    }
  }

  abstract deserializeNodeId(data: any): T["id"];

  abstract deserializeNode(data: any): T;

  abstract createNode(value: string, id: T["id"]): T;
}

export class BlockLinkedList extends LinkedList<Block> {
  updateAllOrderedListIndices() {
    let currentNodeId = this.head;
    let currentIndex = 1;

    const visitedNodes = new Set<string>();

    while (currentNodeId) {
      if (visitedNodes.has(JSON.stringify(currentNodeId))) {
        throw new Error("Circular reference detected.");
      }
      visitedNodes.add(JSON.stringify(currentNodeId));

      const currentNode = this.getNode(currentNodeId);
      if (currentNode.type === "ol") {
        const prevNode = currentNode.prev ? this.getNode(currentNode.prev) : null;

        if (!prevNode || prevNode.type !== "ol") {
          // 이전 노드가 없거나 ol이 아닌 경우 1부터 시작
          currentIndex = 1;
        } else if (prevNode.indent !== currentNode.indent) {
          // indent가 다른 경우
          if (currentNode.indent > prevNode.indent) {
            // indent가 증가한 경우 1부터 시작
            currentIndex = 1;
          } else {
            // indent가 감소한 경우 같은 indent를 가진 이전 ol의 번호 다음부터 시작
            let prevSameIndentNode = prevNode;
            while (
              prevSameIndentNode &&
              (prevSameIndentNode.indent !== currentNode.indent || prevSameIndentNode.type !== "ol")
            ) {
              if (prevSameIndentNode.prev) {
                prevSameIndentNode = this.getNode(prevSameIndentNode.prev)!;
              } else {
                break;
              }
            }

            if (prevSameIndentNode && prevSameIndentNode.type === "ol") {
              currentIndex = (prevSameIndentNode.listIndex || 0) + 1;
            } else {
              currentIndex = 1;
            }
          }
        } else {
          currentIndex = (prevNode.listIndex || 0) + 1;
        }

        currentNode.listIndex = currentIndex;
      }

      currentNodeId = currentNode.next;
    }
  }

  reorderNodes({ targetId, beforeId, afterId }: ReorderNodesProps) {
    const targetNode = this.getNode(targetId);

    // 1. 현재 위치에서 노드 제거
    if (targetNode.prev) {
      const prevNode = this.getNode(targetNode.prev);
      prevNode.next = targetNode.next;
    } else {
      this.head = targetNode.next;
    }

    if (targetNode.next) {
      const nextNode = this.getNode(targetNode.next);
      nextNode.prev = targetNode.prev;
    }

    if (this.head === targetId) {
      this.head = targetNode.next;
    }

    // 2. 새로운 위치에 노드 삽입
    if (!beforeId && !afterId) {
      throw new Error("Either beforeId or afterId must be provided.");
    }

    if (!beforeId) {
      // 맨 앞으로 이동
      const oldHead = this.head;
      this.head = targetId;
      targetNode.prev = null;
      targetNode.next = oldHead;

      if (oldHead) {
        const headNode = this.getNode(oldHead);
        headNode.prev = targetId;
      }
    } else if (!afterId) {
      // 맨 끝으로 이동
      const beforeNode = this.getNode(beforeId);
      if (beforeNode) {
        beforeNode.next = targetId;
        targetNode.prev = beforeId;
        targetNode.next = null;
      }
    } else {
      // 중간으로 이동
      const beforeNode = this.getNode(beforeId);
      const afterNode = this.getNode(afterId);

      if (beforeNode && afterNode) {
        targetNode.prev = beforeId;
        targetNode.next = afterId;
        beforeNode.next = targetId;
        afterNode.prev = targetId;
      }
    }

    // 노드맵 갱신
    this.setNode(targetId, targetNode);

    // ordered list가 포함된 경우 전체 인덱스 재계산
    if (targetNode.type === "ol") {
      this.updateAllOrderedListIndices();
    }
  }

  deserializeNodeId(data: any): BlockId {
    return BlockId.deserialize(data);
  }

  deserializeNode(data: any): Block {
    return Block.deserialize(data);
  }

  createNode(value: string, id: BlockId): Block {
    return new Block(value, id);
  }
}

export class TextLinkedList extends LinkedList<Char> {
  deserializeNodeId(data: any): CharId {
    return CharId.deserialize(data);
  }

  deserializeNode(data: any): Char {
    return Char.deserialize(data);
  }

  createNode(value: string, id: CharId): Char {
    return new Char(value, id);
  }
}
