import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { WorkSpaceService } from "./workspace.service";
import {
  RemoteBlockDeleteOperation,
  RemoteCharDeleteOperation,
  RemotePageDeleteOperation,
  RemoteBlockInsertOperation,
  RemotePageUpdateOperation,
  RemoteCharInsertOperation,
  RemoteBlockUpdateOperation,
  RemotePageCreateOperation,
  RemoteBlockReorderOperation,
  RemoteBlockCheckboxOperation,
  RemoteCharUpdateOperation,
  CursorPosition,
} from "@noctaCrdt/Interfaces";
import { Logger } from "@nestjs/common";
import { nanoid } from "nanoid";
import { Page } from "@noctaCrdt/Page";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { AuthService } from "../auth/auth.service";
import { WorkspaceInviteData } from "./workspace.interface";
// 클라이언트 맵 타입 정의
interface ClientInfo {
  clientId: number; // 서버가 부여한 아이디로, 0,1,2,3, 같은 숫자임.
  connectionTime: Date;
  email: string;
}

interface BatchOperation {
  event: string;
  operation: Operation;
}

type Operation =
  | RemotePageCreateOperation
  | RemotePageDeleteOperation
  | RemotePageUpdateOperation
  | RemoteBlockInsertOperation
  | RemoteBlockDeleteOperation
  | RemoteBlockUpdateOperation
  | RemoteBlockReorderOperation
  | RemoteCharInsertOperation
  | RemoteCharDeleteOperation
  | RemoteCharUpdateOperation
  | CursorPosition;

@WebSocketGateway({
  cors: {
    origin:
      process.env.NODE_ENV === "development"
        ? "http://localhost:5173" // Vite 개발 서버 포트
        : ["https://nocta.site", "https://www.nocta.site"],
    credentials: true,
  },
  path: "/api/socket.io",
  transports: ["websocket", "polling"],
})
export class WorkspaceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WorkspaceGateway.name);
  private clientIdCounter: number = 1;
  private clientMap: Map<string, ClientInfo> = new Map();
  private batchMap: Map<string, BatchOperation[]> = new Map();
  constructor(
    private readonly workSpaceService: WorkSpaceService,
    private readonly authService: AuthService,
  ) {}

  afterInit(server: Server) {
    this.workSpaceService.setServer(server);
  }

  emitOperation(
    clientId: string,
    roomId: string,
    event: string,
    operation: Operation,
    batch: boolean,
  ) {
    const key = `${clientId}:${roomId}`;
    if (batch) {
      if (!this.batchMap.has(key)) {
        this.batchMap.set(key, []);
      }
      this.batchMap.get(key)!.push({ event, operation });
    } else {
      const server = this.workSpaceService.getServer();
      server.to(roomId).except(clientId).emit(event, operation);
    }
  }

  /**
   * 클라이언트 연결 처리
   * 새로운 클라이언트에게 ID를 할당하고 현재 문서 상태를 전송
   */
  async handleConnection(client: Socket) {
    try {
      let { userId } = client.handshake.auth;
      const { workspaceId } = client.handshake.auth;
      if (!userId) {
        userId = "guest";
      }
      client.data.userId = userId;
      client.join(`user:${userId}`); // 유저 전용 룸에 조인 추후 초대 수신용

      const workspaces = await this.workSpaceService.getUserWorkspaces(userId);
      const userInfo = await this.authService.getProfile(userId);
      let NewWorkspaceId = "";

      if (userId === "guest") {
        client.join("guest");
        NewWorkspaceId = "guest";
      } else if (workspaces.length === 0) {
        const workspace = await this.workSpaceService.createWorkspace(
          userId,
          `${userInfo.name}의 Workspace`,
        );
        client.join(workspace.id);
        NewWorkspaceId = workspace.id;
      } else {
        if (workspaceId && workspaces.some((workspace) => workspace.id === workspaceId)) {
          NewWorkspaceId = workspaceId;
        } else {
          // 없으면 첫 번째 워크스페이스 사용
          NewWorkspaceId = workspaces[0].id; // WorkspaceListItem의 id 속성 접근
        }
        client.join(NewWorkspaceId);
      }
      const user = await this.authService.findById(userId);
      client.data.workspaceId = NewWorkspaceId;
      const currentWorkSpace = (
        await this.workSpaceService.getWorkspace(NewWorkspaceId)
      ).serialize();
      client.emit("workspace", currentWorkSpace);

      if (user && NewWorkspaceId !== "guest") {
        const server = this.workSpaceService.getServer();
        server
          .to(NewWorkspaceId)
          .except(client.id)
          .emit("workspace/user/join", {
            workspaceId: NewWorkspaceId,
            userName: user.name,
            message: `${user.name}님이 워크스페이스에 참가하셨습니다.`,
          });
      }

      const assignedId = (this.clientIdCounter += 1);
      const clientInfo: ClientInfo = {
        clientId: assignedId,
        connectionTime: new Date(),
        email: user?.email || "guest", // email 정보 저장
      };
      this.clientMap.set(client.id, clientInfo);
      client.emit("assign/clientId", assignedId);

      setTimeout(async () => {
        const workspaces = await this.workSpaceService.getUserWorkspaces(userId);
        const workspaceList = workspaces.map((workspace) => {
          return {
            id: workspace.id,
            name: workspace.name,
            role: workspace.role,
            memberCount: workspace.memberCount,
            activeUsers: workspace.activeUsers,
          };
        });

        this.logger.log(`Sending workspace list to client ${client.id}`);
        client.emit("workspace/list", workspaceList);
        this.SocketStoreBroadcastWorkspaceConnections();
      }, 100);

      this.logger.log(`클라이언트 연결 성공 - User ID: ${userId}, Client ID: ${assignedId}`);
      this.logger.debug(`현재 연결된 클라이언트 수: ${this.clientMap.size}`);
    } catch (error) {
      this.logger.error(`클라이언트 연결 중 오류 발생: ${error.message}`, error.stack);
      client.disconnect();
    }
  }

  /**
   * 클라이언트 연결 해제 처리
   */
  handleDisconnect(client: Socket) {
    try {
      const clientInfo = this.clientMap.get(client.id);
      if (clientInfo) {
        // 다른 클라이언트들에게 사용자 퇴장 알림
        client.broadcast.emit("userLeft", { clientId: clientInfo.clientId });

        // 연결 시간 계산
        const connectionDuration = new Date().getTime() - clientInfo.connectionTime.getTime();
        this.logger.log(
          `클라이언트 연결 해제 - Socket ID: ${client.id}, ` +
            `Client ID: ${clientInfo.clientId}, ` +
            `연결 시간: ${Math.round(connectionDuration / 1000)}초`,
        );
      }

      this.clientMap.delete(client.id);
      this.SocketStoreBroadcastWorkspaceConnections();
      this.logger.debug(`남은 연결된 클라이언트 수: ${this.clientMap.size}`);
    } catch (error) {
      this.logger.error(`클라이언트 연결 해제 중 오류 발생: ${error.message}`, error.stack);
    }
  }

  Copy; // workspace.gateway.ts
  @SubscribeMessage("leave/workspace")
  async handleWorkspaceLeave(
    @MessageBody() data: { workspaceId: string; userId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      client.leave(data.workspaceId);
      const user = await this.authService.findById(data.userId);
      const server = this.workSpaceService.getServer();
      server.to(data.workspaceId).emit("workspace/user/left", {
        workspaceId: data.workspaceId,
        userName: user.name,
        message: `${user.name}님이 워크스페이스에서 퇴장하셨습니다.`,
      });
      this.SocketStoreBroadcastWorkspaceConnections();
    } catch (error) {
      this.logger.error(`워크스페이스 퇴장 중 오류 발생`, error.stack);
    }
  }

  @SubscribeMessage("invite/workspace")
  async handleWorkspaceInvite(
    @MessageBody() data: WorkspaceInviteData,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    if (!clientInfo) {
      throw new WsException("Client information not found");
    }

    try {
      // 1. 초대받을 사용자 확인
      const targetUser = await this.authService.findByEmail(data.email);
      const sentUser = await this.authService.findByEmail(clientInfo.email);
      if (!targetUser) {
        client.emit("invite/workspace/fail", {
          email: data.email,
          workspaceId: data.workspaceId,
          message: "유저가 존재하지 않습니다.",
        });
        throw new WsException("User not found");
      }

      // 2. 이미 워크스페이스 멤버인지 확인
      if (targetUser.workspaces.includes(data.workspaceId)) {
        client.emit("invite/workspace/fail", {
          email: data.email,
          workspaceId: data.workspaceId,
          message: "유저가 이미 워크스페이스에 존재합니다.",
        });
        throw new WsException("User is already a member of this workspace");
      }

      const { userId } = client.handshake.auth;
      await this.authService.addWorkspace(targetUser.id, data.workspaceId);
      await this.workSpaceService.inviteUserToWorkspace(userId, data.workspaceId, targetUser.id);
      const targetSocket = Array.from(this.clientMap.entries()).find(
        ([_, info]) => info.email === targetUser.email,
      );

      if (targetSocket) {
        const [socketId] = targetSocket;
        const server = this.workSpaceService.getServer();

        server.to(`user:${targetUser.id}`).emit("workspace/invited", {
          workspaceId: data.workspaceId,
          invitedUserId: client.data.userId,
          message: `${sentUser.name}님이 초대하셨습니다.`,
        });

        const workspaces = await this.workSpaceService.getUserWorkspaces(targetUser.id);
        const workspaceList = workspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          role: workspace.role,
          memberCount: workspace.memberCount,
        }));

        this.logger.log(`Sending workspace list to client ${client.id}`);
        server.to(socketId).emit("workspace/list", workspaceList);
      }
      // 5. 초대한 사용자에게 성공 메시지
      client.emit("invite/workspace/success", {
        email: data.email,
        workspaceId: data.workspaceId,
        message: `${targetUser.name}유저를 초대하였습니다.`,
      });
      const sentUserUpdatedWorkspaces = await this.workSpaceService.getUserWorkspaces(
        client.data.userId,
      );
      // 6. 초대한 사용자의 UI에 최신 workspace/list 반영
      client.emit("workspace/list", sentUserUpdatedWorkspaces);
    } catch (error) {
      this.logger.error(
        `Workspace Invite 처리 중 오류 발생 - Client ID: ${clientInfo.clientId}`,
        error.stack,
      );
      throw new WsException(`Invite 실패: ${error.message}`);
    }
  }

  @SubscribeMessage("workspace/rename")
  async handleWorkspaceRename(
    @MessageBody() data: { workspaceId: string; newName: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const workspace = await this.workSpaceService.getWorkspace(data.workspaceId);

      const userRole = await this.workSpaceService.getUserRole(
        client.data.userId,
        data.workspaceId,
      );
      if (userRole !== "owner") {
        throw new WsException("권한이 없습니다.");
      }

      // 워크스페이스 이름 업데이트
      await this.workSpaceService.updateWorkspaceName(data.workspaceId, data.newName);

      // 여기에 업데이트된 workspace/list정보 날리는 메소드 구현해줘 ..
      const members = await this.workSpaceService.getWorkspaceMembers(data.workspaceId);
      // 워크스페이스 멤버들에게 변경 알림
      const server = this.workSpaceService.getServer();
      for (const memberId of members) {
        const memberWorkspaces = await this.workSpaceService.getUserWorkspaces(memberId);
        server.to(`user:${memberId}`).emit("workspace/list", memberWorkspaces);
      }
    } catch (error) {
      throw new WsException(`워크스페이스 이름 변경 실패: ${error.message}`);
    }
  }

  /**
   * 페이지 참여 처리
   * 클라이언트가 특정 페이지에 참여할 때 호출됨
   */
  @SubscribeMessage("join/page")
  async handlePageJoin(
    @MessageBody() data: { pageId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const start = process.hrtime();
    const clientInfo = this.clientMap.get(client.id);
    if (!clientInfo) {
      throw new WsException("Client information not found");
    }

    try {
      const { pageId } = data;
      const { workspaceId } = client.data;
      // 워크스페이스에서 해당 페이지 찾기
      const currentPage = await this.workSpaceService.getPage(workspaceId, pageId);
      if (!currentPage) {
        throw new WsException(`Page with id ${pageId} not found`);
      }
      // pageId에 가입 시키기
      client.join(pageId);

      client.emit("join/page", {
        pageId,
        serializedPage: currentPage,
      });
      this.logger.log(`Client ${clientInfo.clientId} joined page ${pageId}`);
    } catch (error) {
      this.logger.error(
        `페이지 참여 중 오류 발생 - Client ID: ${clientInfo.clientId}`,
        error.stack,
      );
      throw new WsException(`페이지 참여 실패: ${error.message}`);
    } finally {
      // 정보 모니터링
      const server = this.workSpaceService.getServer();
      const [seconds, nanoseconds] = process.hrtime(start);
      this.logger.log(`Page join operation took ${seconds}s ${nanoseconds / 1000000}ms`);
      this.logger.log(`Active connections: ${server.engine.clientsCount}`);
      this.logger.log(`Connected clients: ${this.clientMap.size}`);
      this.logger.log(`Memory usage: ${process.memoryUsage().heapUsed}`);
    }
  }

  /**
   * 페이지 퇴장 처리
   * 클라이언트가 특정 페이지에서 나갈 때 호출됨
   */
  @SubscribeMessage("leave/page")
  async handlePageLeave(
    @MessageBody() data: { pageId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    if (!clientInfo) {
      throw new WsException("Client information not found");
    }

    try {
      const { pageId } = data;
      client.leave(pageId);

      this.logger.log(`Client ${clientInfo.clientId} leaved page ${pageId}`);
    } catch (error) {
      this.logger.error(
        `페이지 퇴장 중 오류 발생 - Client ID: ${clientInfo.clientId}`,
        error.stack,
      );
      throw new WsException(`페이지 퇴장 실패: ${error.message}`);
    }
  }

  /**
   * 페이지 삽입 연산 처리
   */
  @SubscribeMessage("create/page")
  async handlePageCreate(
    @MessageBody() data: RemotePageCreateOperation,
    @ConnectedSocket() client: Socket,
    batch: boolean = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Page Create 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { workspaceId } = client.data;
      const workspace = await this.workSpaceService.getWorkspace(workspaceId);
      const newEditorCRDT = new EditorCRDT(data.clientId);
      const newPage = new Page(nanoid(), "새로운 페이지", "Docs", newEditorCRDT);
      workspace.pageList.push(newPage);

      const operation = {
        type: "pageCreate",
        workspaceId: data.workspaceId,
        clientId: data.clientId,
        page: newPage.serialize(),
      } as RemotePageCreateOperation;
      client.emit("create/page", operation);
      this.emitOperation(client.id, workspaceId, "create/page", operation, batch);
    } catch (error) {
      this.logger.error(
        `Page Create 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Page Create 연산 실패: ${error.message}`);
    }
  }

  /**
   * 페이지 삭제 연산 처리
   */
  @SubscribeMessage("delete/page")
  async handlePageDelete(
    @MessageBody() data: RemotePageDeleteOperation,
    @ConnectedSocket() client: Socket,
    batch: boolean = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Page Delete 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { workspaceId } = client.data;
      // 현재 워크스페이스 가져오기
      const currentWorkspace = await this.workSpaceService.getWorkspace(workspaceId);
      // pageList에서 해당 페이지 찾기
      const pageIndex = await this.workSpaceService.getPageIndex(workspaceId, data.pageId);
      if (pageIndex === -1) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }
      const pageTitle = (await this.workSpaceService.getPage(workspaceId, data.pageId)).title;
      currentWorkspace.pageList.splice(pageIndex, 1);

      const operation = {
        type: "pageDelete",
        workspaceId,
        pageId: data.pageId,
        pageTitle,
        clientId: data.clientId,
      } as RemotePageDeleteOperation;
      client.emit("delete/page", operation);
      this.emitOperation(client.id, workspaceId, "delete/page", operation, batch);

      this.logger.debug(`Page ${data.pageId} successfully deleted`);
    } catch (error) {
      this.logger.error(
        `Page Delete 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Page Delete 연산 실패: ${error.message}`);
    }
  }

  /**
   * 페이지 업데이트 처리
   * 페이지의 메타데이터(제목, 아이콘 등)가 변경될 때 호출됨
   */
  @SubscribeMessage("update/page")
  async handlePageUpdate(
    @MessageBody() data: RemotePageUpdateOperation,
    @ConnectedSocket() client: Socket,
    batch = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    if (!clientInfo) {
      throw new WsException("Client information not found");
    }

    try {
      this.logger.debug(
        `Page Update 연산 수신 - Client ID: ${clientInfo.clientId}, Data:`,
        JSON.stringify(data),
      );

      const { pageId, title, icon, workspaceId } = data;
      const currentPage = await this.workSpaceService.getPage(workspaceId, data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }

      // 페이지 메타데이터 업데이트
      if (title) {
        currentPage.title = title;
      }
      if (icon) {
        currentPage.icon = icon;
      }

      const operation = {
        type: "pageUpdate",
        workspaceId,
        pageId,
        title,
        icon,
        clientId: clientInfo.clientId,
      } as RemotePageUpdateOperation;
      client.emit("update/page", operation);
      this.emitOperation(client.id, workspaceId, "update/page", operation, batch);

      this.logger.log(`Page ${pageId} updated successfully by client ${clientInfo.clientId}`);
    } catch (error) {
      this.logger.error(
        `Page Update 연산 처리 중 오류 발생 - Client ID: ${clientInfo.clientId}`,
        error.stack,
      );
      throw new WsException(`페이지 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 블록 삽입 연산 처리
   */
  @SubscribeMessage("insert/block")
  async handleBlockInsert(
    @MessageBody() data: RemoteBlockInsertOperation,
    @ConnectedSocket() client: Socket,
    batch: boolean = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Block Insert 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );

      const { workspaceId } = client.data;
      const currentPage = await this.workSpaceService.getPage(workspaceId, data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }
      currentPage.crdt.remoteInsert(data);

      const operation = {
        type: "blockInsert",
        node: data.node,
        pageId: data.pageId,
      } as RemoteBlockInsertOperation;
      this.emitOperation(client.id, data.pageId, "insert/block", operation, batch);
    } catch (error) {
      this.logger.error(
        `Block Insert 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Insert 연산 실패: ${error.message}`);
    }
  }

  /**
   * 블록 삭제 연산 처리
   */
  @SubscribeMessage("delete/block")
  async handleBlockDelete(
    @MessageBody() data: RemoteBlockDeleteOperation,
    @ConnectedSocket() client: Socket,
    batch: boolean = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Block Delete 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { workspaceId } = client.data;
      const currentPage = await this.workSpaceService.getPage(workspaceId, data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }
      currentPage.crdt.remoteDelete(data);

      const operation = {
        type: "blockDelete",
        targetId: data.targetId,
        clock: data.clock,
        pageId: data.pageId,
      } as RemoteBlockDeleteOperation;
      this.emitOperation(client.id, data.pageId, "delete/block", operation, batch);
      currentPage.crdt.LinkedList.updateAllOrderedListIndices();
    } catch (error) {
      this.logger.error(
        `Block Delete 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Delete 연산 실패: ${error.message}`);
    }
  }

  /**
   * 블록 업데이트 연산 처리
   */
  @SubscribeMessage("update/block")
  async handleBlockUpdate(
    @MessageBody() data: RemoteBlockUpdateOperation,
    @ConnectedSocket() client: Socket,
    batch: boolean = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Block Update 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      console.log(data);
      const { workspaceId } = client.data;
      const currentPage = await this.workSpaceService.getPage(workspaceId, data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }
      currentPage.crdt.remoteUpdate(data.node, data.pageId);
      currentPage.crdt.LinkedList.updateAllOrderedListIndices();
      const operation = {
        type: "blockUpdate",
        node: data.node,
        pageId: data.pageId,
      } as RemoteBlockUpdateOperation;
      this.emitOperation(client.id, data.pageId, "update/block", operation, batch);
    } catch (error) {
      this.logger.error(
        `Block Update 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Update 연산 실패: ${error.message}`);
    }
  }

  /**
   * 블록 Reorder 연산 처리
   */
  @SubscribeMessage("reorder/block")
  async handleBlockReorder(
    @MessageBody() data: RemoteBlockReorderOperation,
    @ConnectedSocket() client: Socket,
    batch: boolean = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Block Reorder 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { workspaceId } = client.data;
      const currentPage = await this.workSpaceService.getPage(workspaceId, data.pageId);
      if (!currentPage) {
        throw new Error(`Page with id ${data.pageId} not found`);
      }
      currentPage.crdt.remoteReorder(data);

      // 5. 다른 클라이언트들에게 업데이트된 블록 정보 브로드캐스트
      const operation = {
        type: "blockReorder",
        targetId: data.targetId,
        beforeId: data.beforeId,
        afterId: data.afterId,
        pageId: data.pageId,
      } as RemoteBlockReorderOperation;
      this.emitOperation(client.id, data.pageId, "reorder/block", operation, batch);
      currentPage.crdt.LinkedList.updateAllOrderedListIndices();
    } catch (error) {
      this.logger.error(
        `Block Reorder 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Update 연산 실패: ${error.message}`);
    }
  }

  /**
   * 블록 Checkbox 연산 처리
   */
  @SubscribeMessage("checkbox/block")
  async handleBlockCheckbox(
    @MessageBody() data: RemoteBlockCheckboxOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Block checkbox 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { workspaceId } = client.data;
      const currentBlock = await this.workSpaceService.getBlock(
        workspaceId,
        data.pageId,
        data.blockId,
      );

      if (!currentBlock) {
        throw new Error(`Block with id ${data.blockId} not found`);
      }

      currentBlock.isChecked = data.isChecked;

      const operation = {
        type: "blockCheckbox",
        blockId: data.blockId,
        pageId: data.pageId,
        isChecked: data.isChecked,
      };

      client.broadcast.to(data.pageId).emit("checkbox/block", operation);
    } catch (error) {
      this.logger.error(
        `Block Checkbox 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Checkbox 연산 실패: ${error.message}`);
    }
  }

  /**
   * 글자 삽입 연산 처리
   */
  @SubscribeMessage("insert/char")
  async handleCharInsert(
    @MessageBody() data: RemoteCharInsertOperation,
    @ConnectedSocket() client: Socket,
    batch: boolean = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Char Insert 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );

      const { workspaceId } = client.data;
      const currentBlock = await this.workSpaceService.getBlock(
        workspaceId,
        data.pageId,
        data.blockId,
      );
      if (!currentBlock) {
        throw new Error(`Block with id ${data.blockId} not found`);
      }
      currentBlock.crdt.remoteInsert(data);

      // server는 EditorCRDT 없습니다. - BlockCRDT 로 사용되고있음.
      const operation = {
        type: "charInsert",
        node: data.node,
        blockId: data.blockId,
        pageId: data.pageId,
        style: data.node.style || [],
        color: data.node.color ? data.node.color : "black",
        backgroundColor: data.node.backgroundColor ? data.node.backgroundColor : "transparent",
      } as RemoteCharInsertOperation;
      this.emitOperation(client.id, data.pageId, "insert/char", operation, batch);
    } catch (error) {
      this.logger.error(
        `Char Insert 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Insert 연산 실패: ${error.message}`);
    }
  }

  /**
   * 글자 삭제 연산 처리
   */
  @SubscribeMessage("delete/char")
  async handleCharDelete(
    @MessageBody() data: RemoteCharDeleteOperation,
    @ConnectedSocket() client: Socket,
    batch: boolean = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Char Delete 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { workspaceId } = client.data;
      const currentBlock = await this.workSpaceService.getBlock(
        workspaceId,
        data.pageId,
        data.blockId,
      );
      if (!currentBlock) {
        throw new Error(`Block with id ${data.blockId} not found`);
      }
      currentBlock.crdt.remoteDelete(data);

      const operation = {
        type: "charDelete",
        targetId: data.targetId,
        clock: data.clock,
        blockId: data.blockId,
        pageId: data.pageId,
      } as RemoteCharDeleteOperation;
      this.emitOperation(client.id, data.pageId, "delete/char", operation, batch);
    } catch (error) {
      this.logger.error(
        `Char Delete 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Delete 연산 실패: ${error.message}`);
    }
  }

  /**
   * 글자 업데이트 연산 처리
   */
  @SubscribeMessage("update/char")
  async handleCharUpdate(
    @MessageBody() data: RemoteCharUpdateOperation,
    @ConnectedSocket() client: Socket,
    batch: boolean = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Char Update 연산 수신 - Client ID: ${clientInfo?.clientId}, Data:`,
        JSON.stringify(data),
      );
      const { workspaceId } = client.data;
      const currentBlock = await this.workSpaceService.getBlock(
        workspaceId,
        data.pageId,
        data.blockId,
      );
      if (!currentBlock) {
        throw new Error(`Block with id ${data.blockId} not found`);
      }
      currentBlock.crdt.remoteUpdate(data);

      const operation = {
        type: "charUpdate",
        node: data.node,
        blockId: data.blockId,
        pageId: data.pageId,
      } as RemoteCharUpdateOperation;
      this.emitOperation(client.id, data.pageId, "update/char", operation, batch);
    } catch (error) {
      this.logger.error(
        `Char Update 연산 처리 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Update 연산 실패: ${error.message}`);
    }
  }

  /**
   * 커서 위치 업데이트 처리
   */
  @SubscribeMessage("cursor")
  async handleCursor(
    @MessageBody() data: CursorPosition,
    @ConnectedSocket() client: Socket,
    batch: boolean = false,
  ): Promise<void> {
    const clientInfo = this.clientMap.get(client.id);
    try {
      this.logger.debug(
        `Cursor 위치 업데이트 - Client ID: ${clientInfo?.clientId}, Position:`,
        JSON.stringify(data),
      );

      const operation = {
        type: "cursor",
        clientId: clientInfo?.clientId,
        position: data.position,
      } as CursorPosition;
      const { workspaceId } = client.data;
      this.emitOperation(client.id, workspaceId, "cursor", operation, batch);
    } catch (error) {
      this.logger.error(
        `Cursor 업데이트 중 오류 발생 - Client ID: ${clientInfo?.clientId}`,
        error.stack,
      );
      throw new WsException(`Cursor 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 현재 연결된 모든 클라이언트 정보 조회
   */
  getConnectedClients(): { total: number; clients: ClientInfo[] } {
    return {
      total: this.clientMap.size,
      clients: Array.from(this.clientMap.values()),
    };
  }

  @SubscribeMessage("batch/operations")
  async handleBatchOperations(@MessageBody() batch: any[], @ConnectedSocket() client: Socket) {
    const start = process.hrtime();

    try {
      const clientInfo = this.clientMap.get(client.id);
      if (!clientInfo) {
        return;
      }

      this.logger.debug(`Batch 연산 수행중... - Client ID: ${clientInfo?.clientId}`);
      for (const operation of batch) {
        // 각 연산 처리 로직
        await this.processOperation(operation, client);
      }
      this.logger.debug(`Batch 연산 완료 - Client ID: ${clientInfo?.clientId}`);

      // 다른 클라이언트들에게 배치 전송
      if (batch.length > 0) {
        this.executeBatch();
      }
    } catch (error) {
      throw new WsException(`Batch 연산 실패: ${error.message}`);
    } finally {
      // 정보 모니터링
      const [seconds, nanoseconds] = process.hrtime(start);
      this.logger.log(`Batch operation took ${seconds}s ${nanoseconds / 1000000}ms`);
      this.logger.log(`Processed ${batch.length} operations`);
    }
  }

  private SocketStoreBroadcastWorkspaceConnections() {
    const server = this.workSpaceService.getServer();
    const connectionCounts = {} as Record<string, number>;

    // 각 워크스페이스의 room size를 가져옴
    for (const [roomId, room] of server.sockets.adapter.rooms.entries()) {
      // user: 로 시작하는 룸은 제외 (초대용 룸)
      if (!roomId.startsWith("user:")) {
        connectionCounts[roomId] = room.size;
      }
    }
    // 모든 클라이언트에게 전송
    server.emit("workspace/connections", connectionCounts);
  }

  executeBatch() {
    try {
      const server = this.workSpaceService.getServer();
      const batches = Array.from(this.batchMap.entries());
      for (const [room, batch] of batches) {
        if (batch.length > 0) {
          const [clientId, roomId] = room.split(":");
          server.to(roomId).except(clientId).emit("batch/operations", batch);
          this.batchMap.delete(room);
        }
      }
      this.batchMap.clear();
    } catch (error) {
      this.logger.error(`Batch 실행 중 오류 발생: ${error.message}`, error.stack);
      throw new WsException(`Batch 실행 실패: ${error.message}`);
    }
  }

  private async processOperation(operation: Operation, client: Socket) {
    try {
      switch (operation.type) {
        case "blockInsert":
          await this.handleBlockInsert(operation, client, true);
          break;
        case "blockUpdate":
          await this.handleBlockUpdate(operation, client, true);
          break;
        case "blockDelete":
          await this.handleBlockDelete(operation, client, true);
          break;
        case "blockReorder":
          await this.handleBlockReorder(operation, client, true);
          break;
        case "charInsert":
          await this.handleCharInsert(operation, client, true);
          break;
        case "charDelete":
          await this.handleCharDelete(operation, client, true);
          break;
        case "charUpdate":
          await this.handleCharUpdate(operation, client, true);
          break;
        case "pageCreate":
          await this.handlePageCreate(operation, client, true);
          break;
        case "pageDelete":
          await this.handlePageDelete(operation, client, true);
          break;
        case "pageUpdate":
          await this.handlePageUpdate(operation, client, true);
          break;
        case "cursor":
          await this.handleCursor(operation, client, true);
          break;
        default:
          this.logger.warn("배치 연산 중 알 수 없는 연산 발견:", operation);
      }
    } catch (error) {
      this.logger.error(`연산 처리 중 오류 발생: ${error.message}`, error.stack);
      throw new WsException(`배치 연산 처리 실패: ${error.message}`);
    }
  }
}
