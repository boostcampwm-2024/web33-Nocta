// Node.ts
import { NodeId, BlockId, CharId } from "./NodeId";
import { AnimationType, ElementType, TextColorType, BackgroundColorType } from "./Interfaces";
import { BlockCRDT } from "./Crdt";

export abstract class Node<T extends NodeId> {
  id: T;
  value: string;
  next: T | null;
  prev: T | null;
  style: string[];

  constructor(value: string, id: T) {
    this.id = id;
    this.value = value;
    this.next = null;
    this.prev = null;
    this.style = [];
  }

  precedes(node: Node<T>): boolean {
    if (!this.prev || !node.prev) return false;
    if (!this.prev.equals(node.prev)) return false;

    if (this.id.clock < node.id.clock) return true;
    if (this.id.clock === node.id.clock && this.id.client < node.id.client) return true;

    return false;
  }

  serialize(): any {
    return {
      id: this.id.serialize(),
      value: this.value,
      next: this.next ? this.next.serialize() : null,
      prev: this.prev ? this.prev.serialize() : null,
      style: this.style,
    };
  }

  static deserialize(data: any): Node<NodeId> {
    throw new Error("Deserialize method should be implemented by subclasses");
  }
}

export class Block extends Node<BlockId> {
  type: ElementType;
  indent: number;
  animation: AnimationType;
  style: string[];
  icon: string;
  crdt: BlockCRDT;
  listIndex?: number;

  constructor(value: string, id: BlockId) {
    super(value, id);
    this.type = "p";
    this.indent = 0;
    this.animation = "none";
    this.style = [];
    this.icon = "";
    this.crdt = new BlockCRDT(id.client);
  }

  serialize(): any {
    return {
      ...super.serialize(),
      type: this.type,
      indent: this.indent,
      animation: this.animation,
      style: this.style,
      icon: this.icon,
      crdt: this.crdt.serialize(),
      listIndex: this.listIndex ? this.listIndex : null,
    };
  }

  static deserialize(data: any): Block {
    const id = BlockId.deserialize(data.id);
    const block = new Block(data.value, id);
    block.next = data.next ? BlockId.deserialize(data.next) : null;
    block.prev = data.prev ? BlockId.deserialize(data.prev) : null;
    block.type = data.type;
    block.indent = data.indent;
    block.animation = data.animation;
    block.style = data.style;
    block.icon = data.icon;
    block.crdt = BlockCRDT.deserialize(data.crdt);
    block.listIndex = data.listIndex ? data.listIndex : null;
    return block;
  }
}

export class Char extends Node<CharId> {
  style: string[];
  color: TextColorType;
  backgroundColor: BackgroundColorType;

  constructor(value: string, id: CharId) {
    super(value, id);
    this.style = [];
    this.color = "black";
    this.backgroundColor = "transparent";
  }

  serialize(): any {
    return {
      ...super.serialize(),
      color: this.color,
      backgroundColor: this.backgroundColor,
    };
  }

  static deserialize(data: any): Char {
    const id = CharId.deserialize(data.id);
    const char = new Char(data.value, id);
    char.next = data.next ? CharId.deserialize(data.next) : null;
    char.prev = data.prev ? CharId.deserialize(data.prev) : null;
    char.style = data.style ? data.style : [];
    char.color = data.color ? data.color : "black";
    char.backgroundColor = data.backgroundColor ? data.backgroundColor : "transparent";
    return char;
  }
}
