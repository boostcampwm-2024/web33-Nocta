import { NodeId, BlockId, CharId } from "./NodeId";
import { Block, Char } from "./Node";
import { Page } from "./Page";
import { EditorCRDT } from "./Crdt";

export type ElementType =
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "ul"
  | "ol"
  | "li"
  | "checkbox"
  | "blockquote"
  | "hr";

export type AnimationType = "none" | "highlight" | "gradation";

export type TextStyleType = "bold" | "italic" | "underline" | "strikethrough";

export type BackgroundColorType =
  | "black"
  | "red"
  | "green"
  | "blue"
  | "white"
  | "yellow"
  | "purple"
  | "brown"
  | "transparent";

export type PageIconType =
  // 기본 문서 타입
  | "Docs" // 일반 문서
  | "Note" // 필기/메모
  | "Wiki" // 지식 베이스/위키

  // 업무 관련
  | "Project" // 프로젝트 관련
  | "Meeting" // 회의록
  | "Task" // 할일/작업

  // 개인 활동
  | "Diary" // 일기/저널
  | "Blog" // 블로그 포스트
  | "Entertain" // 유튜브, 넷플릭스 등

  // 학습 관련
  | "Study" // 학습 자료
  | "Research" // 연구/조사
  | "Book" // 독서 노트

  // 협업 관련
  | "Team" // 팀 문서
  | "Shared" // 공유 문서
  | "Feedback"; // 피드백/리뷰

export type TextColorType = Exclude<BackgroundColorType, "transparent">;

export interface InsertOperation {
  type: "insert";
  node: Block | Char;
}

export interface DeleteOperation {
  type: "delete";
  targetId: BlockId | CharId;
  clock: number;
}

export interface RemotePageCreateOperation {
  type: "pageCreate";
  clientId: number;
  workspaceId: string;
  page?: Page;
}

export interface RemotePageDeleteOperation {
  type: "pageDelete";
  clientId: number;
  workspaceId: string;
  pageId: string;
}

export interface RemoteBlockUpdateOperation {
  type: "blockUpdate";
  node: Block;
  pageId: string;
}

export interface RemoteBlockInsertOperation {
  type: "blockInsert";
  node: Block;
  pageId: string;
}

export interface RemoteCharInsertOperation {
  type: "charInsert";
  node: Char;
  blockId: BlockId;
  pageId: string;
  style?: string[];
  color?: TextColorType;
  backgroundColor?: BackgroundColorType;
}

export interface RemoteBlockDeleteOperation {
  type: "blockDelete";
  targetId: BlockId;
  clock: number;
  pageId: string;
}

export interface RemoteCharDeleteOperation {
  type: "charDelete";
  targetId: CharId;
  clock: number;
  blockId?: BlockId;
  pageId: string;
}

export interface RemoteCharUpdateOperation {
  type: "charUpdate";
  node: Char;
  blockId: BlockId;
  pageId: string;
}

export interface CursorPosition {
  type: "cursor";
  clientId: number;
  position: number;
}

export interface CRDTSerializedProps<T> {
  clock: number;
  client: number;
  LinkedList: {
    head: NodeId | null;
    nodeMap: { [key: string]: T };
  };
  currentBlock?: Block | null;
  currentCaret?: number | null;
}

export interface serializedEditorDataProps {
  clock: number;
  client: number;
  LinkedList: {
    head: NodeId | null;
    nodeMap: { [key: string]: Block };
  };
  currentBlock: Block | null;
}

export interface serializedPageProps {
  id: string;
  title: string;
  icon: string;
  crdt: EditorCRDT;
}

export interface ReorderNodesProps {
  targetId: BlockId;
  beforeId: BlockId | null;
  afterId: BlockId | null;
}

export interface RemotePageUpdateOperation {
  type: "pageUpdate";
  workspaceId: string;
  pageId: string;
  clientId: number;
  title?: string;
  icon?: PageIconType;
}
export interface WorkSpaceSerializedProps {
  id: string;
  pageList: Page[];
  authUser: Map<string, string>;
}
export interface RemoteBlockReorderOperation {
  type: "blockReorder";
  targetId: BlockId;
  beforeId: BlockId | null;
  afterId: BlockId | null;
  clock: number;
  client: number;
  pageId: string;
}
