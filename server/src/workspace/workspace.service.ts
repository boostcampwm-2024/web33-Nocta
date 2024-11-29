import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Workspace, WorkspaceDocument } from "./schemas/workspace.schema";
import { WorkSpace as CRDTWorkSpace } from "@noctaCrdt/WorkSpace";
import { Model } from "mongoose";
import { Server } from "socket.io";
import { WorkSpaceSerializedProps } from "@noctaCrdt/Interfaces";
import { Page } from "@noctaCrdt/Page";
import { Block } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { User, UserDocument } from "../auth/schemas/user.schema";

@Injectable()
export class WorkSpaceService implements OnModuleInit {
  private readonly logger = new Logger(WorkSpaceService.name);
  private workspaces: Map<string, CRDTWorkSpace>;
  private server: Server;
  constructor(
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  getServer() {
    return this.server;
  }

  // Socket.IO 서버 인스턴스 설정
  setServer(server: Server) {
    this.server = server;
  }

  async onModuleInit() {
    this.workspaces = new Map();
    // 게스트 워크스페이스 초기화
    const guestWorkspace = new CRDTWorkSpace("guest", "Guest");
    this.workspaces.set("guest", guestWorkspace);

    // 주기적으로 인메모리 DB 정리 작업 실행
    setInterval(
      () => {
        this.cleanupWorkspaces();
      },
      process.env.NODE_ENV === "production" ? 1 * 60 * 60 * 1000 : 30 * 1000,
    );
  }

  /**
   * 인메모리 DB에서 연결된 클라이언트가 없는 워크스페이스 정리
   */
  private async cleanupWorkspaces() {
    try {
      const bulkOps = [];
      for (const [roomId, workspace] of this.workspaces.entries()) {
        // guest workspace는 제외
        if (roomId === "guest") continue;

        // room의 연결된 클라이언트 수 확인
        const room = this.server.sockets.adapter.rooms.get(roomId);
        const clientCount = room ? room.size : 0;

        // 연결된 클라이언트가 없으면 DB에 저장하고 메모리에서 제거
        if (clientCount === 0) {
          const serializedWorkspace = workspace.serialize();
          bulkOps.push({
            updateOne: {
              filter: { id: roomId },
              update: { $set: { ...serializedWorkspace } },
              upsert: true,
            },
          });

          this.workspaces.delete(roomId);
          this.logger.log(`Workspace ${roomId} will be saved to DB and removed from memory`);
        }
      }

      // DB에 저장할 작업이 있으면 한 번에 실행
      if (bulkOps.length > 0) {
        await this.workspaceModel.bulkWrite(bulkOps, { ordered: false });
      }

      this.logger.log(
        `Workspace cleanup completed, current workspaces: ${[...this.workspaces.keys()]}`,
      );
    } catch (error) {
      console.error("Error during workspace cleanup: ", error);
    }
  }

  async getWorkspace(workspaceId: string): Promise<CRDTWorkSpace> {
    // 인메모리에서 먼저 찾기
    const cachedWorkspace = this.workspaces.get(workspaceId);
    if (cachedWorkspace) {
      return cachedWorkspace;
    }

    // DB에서 찾기
    const workspaceJSON = await this.workspaceModel.findOne({ id: workspaceId });

    const workspace = new CRDTWorkSpace();

    if (workspaceJSON) {
      // DB에 있으면 JSON을 객체로 복원
      workspace.deserialize({
        id: workspaceJSON.id,
        pageList: workspaceJSON.pageList,
        authUser: workspaceJSON.authUser,
      } as WorkSpaceSerializedProps);
    }

    // 메모리에 캐시하고 반환
    this.workspaces.set(workspaceId, workspace);
    return workspace;
  }

  async getPage(workspaceId: string, pageId: string): Promise<Page> {
    return (await this.getWorkspace(workspaceId)).pageList.find((page) => page.id === pageId);
  }

  async getPageIndex(workspaceId: string, pageId: string): Promise<number> {
    return (await this.getWorkspace(workspaceId)).pageList.findIndex((page) => page.id === pageId);
  }

  async getBlock(workspaceId: string, pageId: string, blockId: BlockId): Promise<Block> {
    const page = await this.getPage(workspaceId, pageId);
    if (!page) {
      throw new Error(`Page with id ${pageId} not found`);
    }
    return page.crdt.LinkedList.nodeMap[JSON.stringify(blockId)];
  }

  // 워크스페이스 생성
  async createWorkspace(userId: string, name: string): Promise<Workspace> {
    const newWorkspace = await this.workspaceModel.create({
      name,
      authUser: { userId: "owner" },
    });

    // 유저 정보 업데이트
    await this.userModel.updateOne({ id: userId }, { $push: { workspaces: newWorkspace.id } });

    return newWorkspace;
  }

  // 워크스페이스 삭제
  async deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
    const workspace = await this.workspaceModel.findOne({ id: workspaceId });

    if (!workspace) {
      throw new Error(`Workspace with id ${workspaceId} not found`);
    }

    // 권한 확인
    if (!workspace.authUser.has(userId) || workspace.authUser.get(userId) !== "owner") {
      throw new Error(`User ${userId} does not have permission to delete this workspace`);
    }

    // 관련 유저들의 workspaces 목록 업데이트
    await this.userModel.updateMany(
      { workspaces: workspaceId },
      { $pull: { workspaces: workspaceId } },
    );

    await this.workspaceModel.deleteOne({ id: workspaceId });
  }

  // 워크스페이스 조회
  async getUserWorkspaces(userId: string): Promise<string[]> {
    const user = await this.userModel.findOne({ id: userId });
    if (!user) {
      return [];
    }

    return this.workspaceModel.find({ id: { $in: user.workspaces } });
  }

  // 워크스페이스에 유저 초대
  async inviteUserToWorkspace(
    ownerId: string,
    workspaceId: string,
    invitedUserId: string,
  ): Promise<void> {
    const workspace = await this.workspaceModel.findOne({ id: workspaceId });

    if (!workspace) {
      throw new Error(`Workspace with id ${workspaceId} not found`);
    }

    // 권한 확인
    if (!workspace.authUser.has(ownerId) || workspace.authUser.get(ownerId) !== "owner") {
      throw new Error(`User ${ownerId} does not have permission to invite users to this workspace`);
    }

    // 워크스페이스에 유저 추가
    if (!workspace.authUser.has(invitedUserId)) {
      workspace.authUser.set(invitedUserId, "editor");
      await workspace.save();

      // 유저 정보 업데이트
      await this.userModel.updateOne({ id: invitedUserId }, { $push: { workspaces: workspaceId } });
    }
  }
}
