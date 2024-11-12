import { LinkedList } from "./LinkedList";
import { NodeId, Node } from "./Node";
import { RemoteInsertOperation, RemoteDeleteOperation } from "./interfaces/Crdt";

export class CRDT {
  clock: number;
  client: number;
  textLinkedList: LinkedList;

  constructor(client: number) {
    this.clock = 0; // 이 CRDT의 논리적 시간 설정
    this.client = client;
    this.textLinkedList = new LinkedList();
  }

  /**
   * 로컬에서 삽입 연산을 수행하고, 원격에 전파할 연산 객체를 반환합니다.
   * @param index 삽입할 인덱스
   * @param value 삽입할 값
   * @returns 원격에 전파할 삽입 연산 객체
   */
  localInsert(index: number, value: string): RemoteInsertOperation {
    const id = new NodeId((this.clock += 1), this.client);
    const remoteInsertion = this.textLinkedList.insertAtIndex(index, value, id);
    return { node: remoteInsertion.node };
  }

  /**
   * 원격에서 삽입 연산을 수신했을 때 처리합니다.
   * @param operation 원격 삽입 연산 객체
   */
  remoteInsert(operation: RemoteInsertOperation): void {
    const newNodeId = new NodeId(operation.node.id.clock, operation.node.id.client);
    const newNode = new Node(operation.node.value, newNodeId);
    newNode.next = operation.node.next;
    newNode.prev = operation.node.prev;
    this.textLinkedList.insertById(newNode);
    // 동기화 논리적 시간
    if (this.clock <= newNode.id.clock) {
      this.clock = newNode.id.clock + 1;
    }
  }

  /**
   * 원격에서 삭제 연산을 수신했을때 처리합니다.
   * @param operation 원격 삭제 연산 객체
   */
  remoteDelete(operation: RemoteDeleteOperation): void {
    const { targetId, clock } = operation;
    if (targetId) {
      this.textLinkedList.deleteNode(targetId);
    }
    // 동기화 논리적 시간
    if (this.clock <= clock) {
      this.clock = clock + 1;
    }
  }
  /**
   * 현재 텍스트를 문자열로 반환합니다.
   * @returns 현재 텍스트
   */
  read(): string {
    return this.textLinkedList.stringify();
  }

  /**
   * 현재 텍스트를 배열로 반환합니다.
   * @returns 현재 텍스트 배열
   */
  spread(): string[] {
    return this.textLinkedList.spread();
  }

  /**
   * 로컬에서 삭제 연산을 수행하고, 원격에 전파할 연산 객체를 반환합니다.
   * @param index 삭제할 인덱스
   * @returns 원격에 전파할 삭제 연산 객체
   */
  localDelete(index: number): RemoteDeleteOperation {
    // 유효한 인덱스인지 확인
    if (index < 0 || index >= this.textLinkedList.spread().length) {
      throw new Error(`유효하지 않은 인덱스입니다: ${index}`);
    }

    // 삭제할 노드 찾기
    const nodeToDelete = this.textLinkedList.findByIndex(index);
    if (!nodeToDelete) {
      throw new Error(`삭제할 노드를 찾을 수 없습니다. 인덱스: ${index}`);
    }

    // 삭제 연산 객체 생성
    const operation: RemoteDeleteOperation = {
      targetId: nodeToDelete.id,
      clock: this.clock + 1,
    };

    // 로컬 삭제 수행
    this.textLinkedList.deleteNode(nodeToDelete.id);

    // 클록 업데이트
    this.clock += 1;

    return operation;
  }
  /**
   * textLinkedList를 반환하는 getter 메서드
   * @returns LinkedList 인스턴스
   */
  public getTextLinkedList(): LinkedList {
    return this.textLinkedList;
  }

  /**
   * CRDT의 상태를 직렬화 가능한 객체로 반환합니다.
   * @returns 직렬화 가능한 CRDT 상태
   */
  serialize(): any {
    return {
      clock: this.clock,
      client: this.client,
      textLinkedList: {
        head: this.textLinkedList.head,
        nodeMap: this.textLinkedList.nodeMap,
      },
    };
  }
}
