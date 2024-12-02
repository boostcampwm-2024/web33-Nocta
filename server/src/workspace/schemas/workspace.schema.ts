/*
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

// Main Workspace Document Schema
@Schema({ minimize: false })
export class Workspace {
  @Prop({ required: true })
  id: string;

  @Prop({ type: String, default: [] })
  pageList: string[];

  @Prop({ type: Map, of: Object })
  authUser: Map<string, string>;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type WorkspaceDocument = Document & Workspace;
export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
*/

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

// CharId Schema
@Schema({ _id: false })
export class CharId {
  @Prop({ required: true })
  clock: number;

  @Prop({ required: true })
  client: number;
}

// BlockId Schema
@Schema({ _id: false })
export class BlockId {
  @Prop({ required: true })
  clock: number;

  @Prop({ required: true })
  client: number;
}

// Char Schema
@Schema({ _id: false })
export class Char {
  @Prop({ type: CharId, required: true })
  id: CharId;

  @Prop({ required: true })
  value: string;

  @Prop({
    type: {
      id: Object,
      content: String,
    },
  })
  next?: any;

  @Prop({
    type: {
      id: Object,
      content: String,
    },
  })
  prev?: any;
}

// TextLinkedList Schema
@Schema({ _id: false })
export class TextLinkedList {
  @Prop({ type: CharId, default: null })
  head: CharId | null;

  @Prop({ type: Object, of: Char })
  nodeMap: Record<string, Char>;
}

// BlockCRDT Schema
@Schema({ _id: false })
export class BlockCRDT {
  @Prop({ required: true })
  clock: number;

  @Prop({ required: true })
  client: number;

  @Prop({ required: true })
  currentCaret: number;

  @Prop({ type: TextLinkedList, required: true })
  LinkedList: TextLinkedList;
}

// Block Schema
@Schema({ _id: false })
export class Block {
  @Prop({ type: BlockCRDT, required: true })
  crdt: BlockCRDT;

  @Prop({ type: BlockId, required: true })
  id: BlockId;

  @Prop({
    type: String,
    enum: ["checkBox", "list"],
    required: true,
  })
  icon: string;

  @Prop({
    type: String,
    enum: ["h1", "h2"],
    required: true,
  })
  type: string;

  @Prop({ required: true })
  indent: number;

  @Prop({
    type: {
      crdt: Object,
      id: Object,
      icon: String,
      type: String,
      indent: Number,
      animation: String,
      style: [String],
    },
  })
  next?: any;

  @Prop({
    type: {
      crdt: Object,
      id: Object,
      icon: String,
      type: String,
      indent: Number,
      animation: String,
      style: [String],
    },
  })
  prev?: any;

  @Prop({
    type: String,
    enum: ["wave", "fill"],
    required: true,
  })
  animation: string;

  @Prop({ type: [String], default: [] })
  style: string[];
}

// BlockLinkedList Schema
@Schema({ minimize: false, _id: false })
export class BlockLinkedList {
  @Prop({ type: BlockId, default: null })
  head: BlockId | null;

  @Prop({ type: Object, of: Block, default: {} })
  nodeMap: Record<string, Block>;
}

// EditorCRDT Schema
@Schema({ _id: false })
export class EditorCRDT {
  @Prop({ required: true })
  clock: number;

  @Prop({ required: true })
  client: number;

  @Prop({ type: Block })
  currentBlock: Block;

  @Prop({ type: BlockLinkedList, required: true })
  LinkedList: BlockLinkedList;
}

// Page Schema
@Schema({ _id: false })
export class Page {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ type: EditorCRDT, required: true })
  crdt: EditorCRDT;
}

// Main Workspace Document Schema
@Schema({ minimize: false })
export class Workspace {
  @Prop({ required: true, default: () => crypto.randomUUID() })
  id: string;

  @Prop({ type: String, default: "Untitled" })
  name: string;

  @Prop({ type: [Page], default: [] })
  pageList: Page[];

  @Prop({ type: Map, default: new Map() })
  authUser: Map<string, string>;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type WorkspaceDocument = Document & Workspace;
export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
