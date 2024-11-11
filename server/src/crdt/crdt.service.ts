import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Doc, DocumentDocument } from "../schemas/document.schema";
import { Model } from "mongoose";
import { CRDT } from "../../../@crdt/Crdt";
import { NodeId, Node } from "../../../@crdt/Node";

interface RemoteInsertOperation {
  node: Node;
}

interface RemoteDeleteOperation {
  targetId: NodeId | null;
  clock: number;
}

@Injectable()
export class CrdtService implements OnModuleInit {
  private crdt: CRDT;

  constructor(@InjectModel(Doc.name) private documentModel: Model<DocumentDocument>) {
    this.crdt = new CRDT(0); // 초기 클라이언트 ID는 0으로 설정 (서버 자체)
  }
  async onModuleInit() {
    try {
      const doc = await this.getDocument();

      if (doc && doc.content) {
        this.crdt = new CRDT(0);
        let contentArray: string[];

        try {
          contentArray = JSON.parse(doc.content) as string[];
        } catch (e) {
          console.error("Invalid JSON in document content:", doc.content);
        }

        contentArray.forEach((char, index) => {
          this.crdt.localInsert(index, char);
        });
      }
    } catch (error) {
      console.error("Error during CrdtService initialization:", error);
    }
  }

  /**
   * MongoDB에서 문서를 가져옵니다.
   */
  async getDocument(): Promise<Doc> {
    let doc = await this.documentModel.findOne();
    if (!doc) {
      doc = new this.documentModel({ content: JSON.stringify(this.crdt.spread()) });
      await doc.save();
    }
    return doc;
  }

  /**
   * MongoDB에 문서를 업데이트합니다.
   */
  async updateDocument(): Promise<Doc> {
    const content = JSON.stringify(this.crdt.spread());
    const doc = await this.documentModel.findOneAndUpdate(
      {},
      { content, updatedAt: new Date() },
      { new: true, upsert: true },
    );

    if (!doc) {
      throw new Error("문서가 저장되지 않았습니다.");
    }
    return doc;
  }

  /**
   * 삽입 연산을 처리하고 문서를 업데이트합니다.
   */
  async handleInsert(operation: RemoteInsertOperation): Promise<void> {
    this.crdt.remoteInsert(operation);
    await this.updateDocument();
  }

  /**
   * 삭제 연산을 처리하고 문서를 업데이트합니다.
   */
  async handleDelete(operation: RemoteDeleteOperation): Promise<void> {
    this.crdt.remoteDelete(operation);
    await this.updateDocument();
  }

  /**
   * 현재 CRDT의 텍스트를 반환합니다.
   */
  getText(): string {
    return this.crdt.read();
  }
  /**
   * CRDT 인스턴스를 반환하는 Getter 메서드
   */
  getCRDT(): CRDT {
    return this.crdt;
  }
}
