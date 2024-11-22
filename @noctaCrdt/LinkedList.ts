import { Node, Char, Block } from "./Node";
import { NodeId, BlockId, CharId } from "./NodeId";
import { InsertOperation, ReorderNodesProps } from "./Interfaces";

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

  getNode(id: T["id"] | null): T | null {
    if (!id) return null;
    return this.nodeMap[JSON.stringify(id)] || null;
  }

  deleteNode(id: T["id"]): void {
    const nodeToDelete = this.getNode(id);
    if (!nodeToDelete) return;

    if (this.head && id.equals(this.head)) {
      this.head = nodeToDelete.next;
      if (nodeToDelete.next) {
        const nextNode = this.getNode(nodeToDelete.next);
        if (nextNode) {
          nextNode.prev = null;
        }
      }
    } else {
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

  reorderNodes({ targetId, beforeId, afterId }: ReorderNodesProps): void {
    const targetNode = this.getNode(targetId);
    if (!targetNode) return;

    // 1. 기존 연결 해제
    if (targetNode.prev) {
      const prevNode = this.getNode(targetNode.prev);
      if (prevNode) {
        prevNode.next = targetNode.next;
      }
    } else {
      this.head = targetNode.next;
    }

    if (targetNode.next) {
      const nextNode = this.getNode(targetNode.next);
      if (nextNode) {
        nextNode.prev = targetNode.prev;
      }
    }

    // 2. 새로운 위치에 연결
    if (!beforeId) {
      // 맨 앞으로 이동
      const oldHead = this.head;
      this.head = targetId;
      targetNode.prev = null;
      targetNode.next = oldHead;

      if (oldHead) {
        const headNode = this.getNode(oldHead);
        if (headNode) {
          headNode.prev = targetId;
        }
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
  }

  findByIndex(index: number): T {
    if (index < 0) {
      throw new Error(`Invalid negative index: ${index}`);
    }

    let currentNodeId = this.head;
    let currentIndex = 0;

    while (currentNodeId !== null && currentIndex < index) {
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) {
        throw new Error(`Node not found at index ${currentIndex}`);
      }
      currentNodeId = currentNode.next;
      currentIndex += 1;
    }

    if (currentNodeId === null) {
      throw new Error(`LinkedList is empty at index ${index}`);
    }

    const node = this.getNode(currentNodeId);
    if (!node) {
      throw new Error(`Node not found at index ${index}`);
    }

    return node;
  }

  insertAtIndex(index: number, value: string, id: T["id"]): InsertOperation {
    try {
      const node = this.createNode(value, id);
      this.setNode(id, node);

      if (!this.head || index <= 0) {
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
    } catch (e) {
      throw new Error(`InsertAtIndex failed: ${e}`);
    }
  }

  insertById(node: T): void {
    if (this.getNode(node.id)) return;

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
      throw new Error(`Previous node not found: ${JSON.stringify(node.prev)}`);
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

  stringify(): string {
    let currentNodeId = this.head;
    let result = "";

    while (currentNodeId !== null) {
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) break;
      result += currentNode.value;
      currentNodeId = currentNode.next;
    }

    return result;
  }

  spread(): T[] {
    let currentNodeId = this.head;
    const result: T[] = [];
    while (currentNodeId !== null) {
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) break;
      result.push(currentNode!);
      currentNodeId = currentNode.next;
    }
    return result;
  }

  /*
  spread(): T[] {
    const visited = new Set<string>();
    let currentNodeId = this.head;
    const result: T[] = [];
    
    while (currentNodeId !== null) {
      const nodeKey = JSON.stringify(currentNodeId);
      if (visited.has(nodeKey)) break; // 순환 감지
      
      visited.add(nodeKey);
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) break;
      
      result.push(currentNode);
      currentNodeId = currentNode.next;
    }
    return result;
}
  */

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
