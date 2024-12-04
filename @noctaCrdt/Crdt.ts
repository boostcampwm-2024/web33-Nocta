import { LinkedList, BlockLinkedList, TextLinkedList } from "./LinkedList";
import { CharId, BlockId, NodeId } from "./NodeId";
import { Node, Char, Block } from "./Node";
import {
  RemoteBlockDeleteOperation,
  RemoteCharDeleteOperation,
  RemoteBlockInsertOperation,
  RemoteCharInsertOperation,
  CRDTSerializedProps,
  RemoteBlockReorderOperation,
  RemoteBlockUpdateOperation,
  serializedEditorDataProps,
  RemoteCharUpdateOperation,
  TextColorType,
  BackgroundColorType,
} from "./Interfaces";

// 트랜잭션 관리를 위한 인터페이스
interface OperationState<T extends Node<NodeId>> {
  previousState: {
    clock: number;
    linkedList: LinkedList<T>;
  };
}

export class CRDT<T extends Node<NodeId>> {
  clock: number;
  client: number;
  LinkedList: LinkedList<T>;
  private operationState: OperationState<T> | null = null;

  constructor(client: number, LinkedListClass: new () => LinkedList<T>) {
    this.clock = 0;
    this.client = client;
    this.LinkedList = new LinkedListClass();
  }

  // 트랜잭션 시작
  private beginOperation(): void {
    this.operationState = {
      previousState: {
        clock: this.clock,
        linkedList: new (this.LinkedList.constructor as any)(this.LinkedList),
      },
    };
  }

  // 트랜잭션 롤백
  private rollback(): void {
    if (this.operationState) {
      this.clock = this.operationState.previousState.clock;
      this.LinkedList = this.operationState.previousState.linkedList;
      this.operationState = null;
    }
  }

  // 트랜잭션 커밋
  private commit(): void {
    this.operationState = null;
  }

  // 연산 실행 래퍼 함수
  protected executeOperation<R>(operation: () => R): R {
    this.beginOperation();
    try {
      const result = operation();
      this.commit();
      return result;
    } catch (error) {
      this.rollback();
      throw error;
    }
  }

  localInsert(index: number, value: string, blockId?: BlockId, pageId?: string): any {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  localDelete(index: number, blockId?: BlockId, pageId?: string): any {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  remoteInsert(operation: any): void {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  remoteDelete(operation: any): void {
    // 기본 CRDT에서는 구현하지 않고, 하위 클래스에서 구현
    throw new Error("Method not implemented.");
  }

  read(): string {
    return this.LinkedList.stringify();
  }

  spread(): T[] {
    return this.LinkedList.spread();
  }

  serialize(): CRDTSerializedProps<T> {
    return {
      clock: this.clock,
      client: this.client,
      LinkedList: this.LinkedList.serialize(),
    };
  }

  deserialize(data: any): void {
    this.executeOperation(() => {
      this.clock = data.clock;
      this.client = data.client;
      this.LinkedList.deserialize(data.LinkedList);
    });
  }
}

// EditorCRDT 클래스: 블록을 관리
export class EditorCRDT extends CRDT<Block> {
  currentBlock: Block | null;

  constructor(client: number) {
    super(client, BlockLinkedList);
    this.currentBlock = null;
  }

  localInsert(index: number, value: string): RemoteBlockInsertOperation {
    return this.executeOperation(() => {
      const id = new BlockId(this.clock + 1, this.client);
      const remoteInsertion = this.LinkedList.insertAtIndex(index, value, id);
      this.clock += 1;
      return { node: remoteInsertion.node } as RemoteBlockInsertOperation;
    });
  }

  localDelete(index: number, blockId: undefined, pageId: string): RemoteBlockDeleteOperation {
    return this.executeOperation(() => {
      const nodeToDelete = this.LinkedList.findByIndex(index);
      const operation: RemoteBlockDeleteOperation = {
        type: "blockDelete",
        targetId: nodeToDelete.id,
        clock: this.clock,
        pageId,
      };

      this.LinkedList.deleteNode(nodeToDelete.id);
      this.clock += 1;

      return operation;
    });
  }

  localUpdate(block: Block, pageId: string): RemoteBlockUpdateOperation {
    const updatedBlock = this.LinkedList.nodeMap[JSON.stringify(block.id)];
    updatedBlock.animation = block.animation;
    updatedBlock.icon = block.icon;
    updatedBlock.indent = block.indent;
    updatedBlock.style = block.style;
    updatedBlock.type = block.type;
    updatedBlock.listIndex = block.listIndex || undefined;
    return { type: "blockUpdate", node: updatedBlock, pageId };
  }

  remoteInsert(operation: RemoteBlockInsertOperation): void {
    this.executeOperation(() => {
      const newNodeId = new BlockId(operation.node.id.clock, operation.node.id.client);
      const newNode = new Block(operation.node.value, newNodeId);

      newNode.next = operation.node.next;
      newNode.prev = operation.node.prev;
      newNode.indent = operation.node.indent;
      newNode.listIndex = operation.node.listIndex || undefined;

      this.LinkedList.insertById(newNode);
      this.clock = Math.max(this.clock, operation.node.id.clock) + 1;
    });
  }

  remoteDelete(operation: RemoteBlockDeleteOperation): void {
    this.executeOperation(() => {
      const { clock } = operation;
      const targetNodeId = new BlockId(operation.targetId.clock, operation.targetId.client);
      this.LinkedList.deleteNode(targetNodeId);
      this.clock = Math.max(this.clock, clock) + 1;
    });
  }

  remoteUpdate(block: Block, pageId: string): void {
    this.executeOperation(() => {
      const updatedBlock = this.LinkedList.nodeMap[JSON.stringify(block.id)];
      updatedBlock.animation = block.animation;
      updatedBlock.icon = block.icon;
      updatedBlock.indent = block.indent;
      updatedBlock.style = block.style;
      updatedBlock.type = block.type;
      updatedBlock.listIndex = block.listIndex || undefined;
      return { type: "blockUpdate", node: updatedBlock, pageId };
    });
  }

  localReorder(params: {
    targetId: BlockId;
    beforeId: BlockId | null;
    afterId: BlockId | null;
    pageId: string;
  }): RemoteBlockReorderOperation {
    return this.executeOperation(() => {
      const operation: RemoteBlockReorderOperation = {
        ...params,
        type: "blockReorder",
        clock: this.clock,
        client: this.client,
      };

      this.LinkedList.reorderNodes({
        targetId: params.targetId,
        beforeId: params.beforeId,
        afterId: params.afterId,
      });
      this.clock += 1;

      return operation;
    });
  }

  remoteReorder(operation: RemoteBlockReorderOperation): void {
    const { targetId, beforeId, afterId, clock } = operation;

    this.LinkedList.reorderNodes({
      targetId,
      beforeId,
      afterId,
    });

    this.clock = Math.max(this.clock, clock) + 1;
  }

  serialize(): serializedEditorDataProps {
    return {
      ...super.serialize(),
      currentBlock: this.currentBlock ? this.currentBlock.serialize() : null,
    };
  }

  deserialize(data: any): void {
    this.executeOperation(() => {
      super.deserialize(data);
      this.currentBlock = data.currentBlock ? Block.deserialize(data.currentBlock) : null;
    });
  }
}

// BlockCRDT 클래스: 문자(Char)를 관리
export class BlockCRDT extends CRDT<Char> {
  currentCaret: number;

  constructor(client: number) {
    super(client, TextLinkedList);
    this.currentCaret = 0;
  }

  localInsert(
    index: number,
    value: string,
    blockId: BlockId,
    pageId: string,
    style?: string[],
    color?: TextColorType,
    backgroundColor?: BackgroundColorType,
  ): RemoteCharInsertOperation {
    return this.executeOperation(() => {
      const id = new CharId(this.clock + 1, this.client);
      const { node } = this.LinkedList.insertAtIndex(index, value, id) as { node: Char };

      if (style && style.length > 0) {
        node.style = style;
      }
      if (color) {
        node.color = color;
      }
      if (backgroundColor) {
        node.backgroundColor = backgroundColor;
      }

      this.clock += 1;

      return {
        type: "charInsert",
        node,
        blockId,
        pageId,
        style: node.style || [],
        color: node.color,
        backgroundColor: node.backgroundColor,
      };
    });
  }

  localDelete(index: number, blockId: BlockId, pageId: string): RemoteCharDeleteOperation {
    return this.executeOperation(() => {
      const nodeToDelete = this.LinkedList.findByIndex(index);
      const operation: RemoteCharDeleteOperation = {
        type: "charDelete",
        targetId: nodeToDelete.id,
        clock: this.clock,
        blockId,
        pageId,
      };

      this.LinkedList.deleteNode(nodeToDelete.id);
      this.clock += 1;

      return operation;
    });
  }

  localUpdate(node: Char, blockId: BlockId, pageId: string): RemoteCharUpdateOperation {
    return this.executeOperation(() => {
      const updatedChar = this.LinkedList.nodeMap[JSON.stringify(node.id)];
      if (node.style && node.style.length > 0) {
        updatedChar.style = [...node.style];
      }
      if (node.color) {
        updatedChar.color = node.color;
      }
      if (node.backgroundColor !== updatedChar.backgroundColor) {
        updatedChar.backgroundColor = node.backgroundColor;
      }

      return { type: "charUpdate", node: updatedChar, blockId, pageId };
    });
  }

  remoteInsert(operation: RemoteCharInsertOperation): void {
    this.executeOperation(() => {
      const newNodeId = new CharId(operation.node.id.clock, operation.node.id.client);
      const newNode = new Char(operation.node.value, newNodeId);

      newNode.next = operation.node.next;
      newNode.prev = operation.node.prev;

      if (operation.style && operation.style.length > 0) {
        operation.style.forEach((style) => {
          newNode.style.push(style);
        });
      }

      if (operation.color) {
        newNode.color = operation.color;
      }

      if (operation.backgroundColor) {
        newNode.backgroundColor = operation.backgroundColor;
      }

      this.LinkedList.insertById(newNode);
      this.clock = Math.max(this.clock, newNode.id.clock) + 1;
    });
  }

  remoteDelete(operation: RemoteCharDeleteOperation): void {
    this.executeOperation(() => {
      const { clock } = operation;
      const targetNodeId = new CharId(operation.targetId.clock, operation.targetId.client);
      this.LinkedList.deleteNode(targetNodeId);
      this.clock = Math.max(this.clock, clock) + 1;
    });
  }

  remoteUpdate(operation: RemoteCharUpdateOperation): void {
    this.executeOperation(() => {
      const updatedChar = this.LinkedList.nodeMap[JSON.stringify(operation.node.id)];
      if (operation.node.style?.length > 0) {
        updatedChar.style = [...operation.node.style];
      }
      if (operation.node.color) {
        updatedChar.color = operation.node.color;
      }
      if (operation.node.backgroundColor) {
        updatedChar.backgroundColor = operation.node.backgroundColor;
      }
    });
  }

  serialize(): CRDTSerializedProps<Char> {
    return {
      ...super.serialize(),
      currentCaret: this.currentCaret,
    };
  }

  static deserialize(data: any): BlockCRDT {
    const crdt = new BlockCRDT(data.client);
    crdt.clock = data.clock;
    crdt.LinkedList.deserialize(data.LinkedList);
    crdt.currentCaret = data.currentCaret;
    return crdt;
  }

  deserialize(data: any): void {
    this.executeOperation(() => {
      super.deserialize(data);
      this.currentCaret = data.currentCaret ?? 0;
    });
  }
}
