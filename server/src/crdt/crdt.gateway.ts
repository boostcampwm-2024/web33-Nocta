import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { CrdtService } from "./crdt.service";
import {
  RemoteInsertOperation,
  RemoteDeleteOperation,
  CursorPosition,
} from "../../../@crdt/interfaces/crdt";

@WebSocketGateway({
  cors: {
    origin: "*", // 실제 배포 시에는 보안을 위해 적절히 설정하세요
  },
})
export class CrdtGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private server: Server;
  private clientIdCounter: number = 1;
  private clientMap: Map<string, number> = new Map(); // socket.id -> clientId

  constructor(private readonly crdtService: CrdtService) {}

  afterInit(server: Server) {
    this.server = server;
  }

  /**
   * 초기에 연결될때, 클라이언트에 숫자id및 문서정보를 송신한다.
   * @param client 클라이언트 socket 정보
   */
  async handleConnection(client: Socket) {
    console.log(`클라이언트 연결: ${client.id}`);
    const assignedId = this.clientIdCounter++;
    this.clientMap.set(client.id, assignedId);
    client.emit("assignId", assignedId);
    const currentCRDT = this.crdtService.getCRDT().serialize();
    client.emit("document", currentCRDT);
  }

  /**
   * 연결이 끊어지면 클라이언트 맵에서 클라이언트 삭제
   * @param client 클라이언트 socket 정보
   */
  handleDisconnect(client: Socket) {
    console.log(`클라이언트 연결 해제: ${client.id}`);
    this.clientMap.delete(client.id);
  }

  /**
   * 클라이언트로부터 받은 원격 삽입 연산
   * @param data 클라이언트가 송신한 Node 정보
   * @param client 클라이언트 번호
   */
  @SubscribeMessage("insert")
  async handleInsert(
    @MessageBody() data: RemoteInsertOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    console.log(`Insert 연산 수신 from ${client.id}:`, data);

    await this.crdtService.handleInsert(data);

    client.broadcast.emit("insert", data);
  }

  /**
   * 클라이언트로부터 받은 원격 삭제 연산
   * @param data 클라이언트가 송신한 Node 정보
   * @param client 클라이언트 번호
   */
  @SubscribeMessage("delete")
  async handleDelete(
    @MessageBody() data: RemoteDeleteOperation,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    console.log(`Delete 연산 수신 from ${client.id}:`, data);
    await this.crdtService.handleDelete(data);
    client.broadcast.emit("delete", data);
  }

  /**
   * 추후 caret 표시 기능을 위해 받아놓음 + 추후 개선때 인덱스 계산할때 캐럿으로 계산하면 용이할듯 하여 데이터로 만듦
   * @param data 클라이언트가 송신한 caret 정보
   * @param client 클라이언트 번호
   */
  @SubscribeMessage("cursor")
  handleCursor(@MessageBody() data: CursorPosition, @ConnectedSocket() client: Socket): void {
    console.log(`Cursor 위치 수신 from ${client.id}:`, data);
    client.broadcast.emit("cursor", data);
  }
}
