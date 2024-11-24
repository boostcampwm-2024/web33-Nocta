import { Page } from "./Page";
import { WorkSpaceSerializedProps } from "./Interfaces";
import { EditorCRDT } from "./Crdt";

export class WorkSpace {
  id: string;
  pageList: Page[];
  authUser: Map<string, string>;

  constructor(id: string, pageList: Page[]) {
    this.id = id;
    this.pageList = pageList;
    this.authUser = new Map();
  }

  serialize(): WorkSpaceSerializedProps {
    return {
      id: this.id,
      pageList: this.pageList,
      authUser: this.authUser,
    };
  }

  deserialize(data: WorkSpaceSerializedProps): void {
    this.id = data.id;
    this.pageList = data.pageList.map((pageData) => {
      const page = new Page();
      page.deserialize(pageData);
      return page;
    });
    this.authUser = new Map(Object.entries(data.authUser));
  }

  remotePageCreate(operation: { page: Page; workspaceId: string; clientId: number }): Page {
    const { page } = operation;
    const newEditorCRDT = new EditorCRDT(operation.clientId);
    const newPage = new Page(page.id, page.title, page.icon, newEditorCRDT);

    this.pageList.push(newPage);
    return newPage;
  }
  remotePageDelete(operation: { pageId: string; workspaceId: string; clientId: number }): void {
    const { pageId } = operation;

    // pageList에서 해당 페이지의 인덱스 찾기
    const pageIndex = this.pageList.findIndex((page) => page.id === pageId);

    // 페이지가 존재하면 삭제
    if (pageIndex !== -1) {
      this.pageList.splice(pageIndex, 1);
    }
  }
  getPage(data: string) {
    const page = this.pageList.find((page) => page.id === data);
    return page;
  }
}
