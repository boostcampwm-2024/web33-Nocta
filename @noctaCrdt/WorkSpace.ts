import { Page } from "./Page";
import { RemotePageUpdateOperation, WorkSpaceSerializedProps } from "./Interfaces";
import { EditorCRDT } from "./Crdt";

export class WorkSpace {
  id: string;
  name: string;
  pageList: Page[];
  authUser: Map<string, string>;

  constructor(id?: string, name?: string, pageList?: Page[], authUser?: Map<string, string>) {
    this.id = id ? id : crypto.randomUUID();
    this.name = name ? name : "Untitled";
    this.pageList = pageList ? pageList : [];
    this.authUser = authUser ? authUser : new Map();
  }

  serialize(): WorkSpaceSerializedProps {
    return {
      id: this.id,
      name: this.name,
      pageList: this.pageList,
      authUser: this.authUser,
    };
  }

  deserialize(data: WorkSpaceSerializedProps): void {
    this.id = data.id;
    this.name = data.name;
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

  remotePageUpdate(operation: RemotePageUpdateOperation): Page {
    const { pageId, title, icon } = operation;

    // pageList에서 해당 페이지 찾기
    const page = this.pageList.find((p) => p.id === pageId);

    // 페이지가 없으면 에러 발생
    if (!page) {
      throw new Error(`Page with id ${pageId} not found in workspace ${this.id}`);
    }

    // 전달받은 새로운 메타데이터로 페이지 정보 업데이트
    if (title !== undefined) {
      page.title = title;
    }

    if (icon !== undefined) {
      page.icon = icon;
    }

    return page;
  }
  getPage(data: string) {
    const page = this.pageList.find((page) => page.id === data);
    return page;
  }
}
