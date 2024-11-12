import { NodeId, Node } from "./Node";

interface InsertOperation {
  node: Node;
}

interface DeleteOperation {
  targetId: NodeId | null;
  clock: number;
}

export class LinkedList {
  head: NodeId | null;
  nodeMap: { [key: string]: Node };

  constructor(initialStructure?: LinkedList) {
    if (initialStructure) {
      this.head = initialStructure.head;
      this.nodeMap = { ...initialStructure.nodeMap };
    } else {
      this.head = null;
      this.nodeMap = {};
    }
  }

  // 노드맵에 노드 추가 메소드
  setNode(id: NodeId, node: Node): void {
    this.nodeMap[JSON.stringify(id)] = node;
  }

  // 노드맵에서 노드 조회 메서드
  getNode(id: NodeId | null): Node | null {
    if (!id) return null;
    return this.nodeMap[JSON.stringify(id)] || null;
  }

  // 링크드 리스트에서 노드를 제거하고 nodeMap에서 삭제
  deleteNode(id: NodeId): void {
    const nodeToDelete = this.getNode(id);
    if (!nodeToDelete) return;

    if (this.head && this.head.equals(id)) {
      // 삭제할 노드가 헤드인 경우
      this.head = nodeToDelete.next;
      if (nodeToDelete.next) {
        const nextNode = this.getNode(nodeToDelete.next);
        if (nextNode) {
          nextNode.prev = null;
        }
      }
    } else {
      // 삭제할 노드의 이전 노드를 찾아 연결을 끊음?
      if (nodeToDelete.prev) {
        const prevNode = this.getNode(nodeToDelete.prev);
        if (prevNode) {
          prevNode.next = nodeToDelete.next;
          if (nodeToDelete.next) {
            const nextNode = this.getNode(nodeToDelete.next);
            if (nextNode) {
              nextNode.prev = nodeToDelete.prev;
            }
          }
        }
      }
    }

    // nodeMap에서 노드 삭제
    delete this.nodeMap[JSON.stringify(id)];
  }

  /**
   * 링크드 리스트 안에 특정 인덱스에 해당하는 노드를 찾습니다.
   * @param index 찾을 인덱스 (0-부터 출발한다.)
   * @returns 해당 인덱스의 노드
   */
  findByIndex(index: number): Node {
    if (index < 0) {
      throw new Error(`링크드 리스트에서 특정 인덱스${index}가 음수가 입력되었습니다.`);
    }

    let currentNodeId = this.head;
    let currentIndex = 0;

    while (currentNodeId !== null && currentIndex < index) {
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) {
        throw new Error(
          `링크드 리스트에서 특정 인덱스에 해당하는 노드를 찾다가 에러가 발생했습니다. ${currentIndex}`,
        );
      }
      currentNodeId = currentNode.next;
      currentIndex += 1;
    }

    // 유효성 검사
    if (currentNodeId === null) {
      throw new Error(`링크드 리스트에서 ${index}를 조회했지만 링크드 리스트가 비어있습니다.  `);
    }
    const node = this.getNode(currentNodeId);
    if (!node) {
      throw new Error(`링크드 리스트에서 인덱스 ${index}에서 노드를 가져오지 못했습니다. `);
    }

    return node;
  }

  /**
   * 인덱스를 기반으로 노드를 삽입합니다.
   * 글자를 작성할때 특정 인덱스에 삽입해야 하기 때문.
   * @param index 삽입할 인덱스 (0-based)
   * @param value 삽입할 값
   * @param id 삽입할 노드의 식별자
   * @returns 삽입된 노드
   */
  insertAtIndex(index: number, value: string, id: NodeId): InsertOperation {
    try {
      const node = new Node(value, id);
      this.setNode(id, node);

      // 헤드에 삽입하는 경우
      if (!this.head || index === -1) {
        node.next = this.head;
        node.prev = null;
        if (this.head) {
          const oldHead = this.getNode(this.head);
          if (oldHead) {
            oldHead.prev = id;
          }
        }

        this.head = id;
        return { node };
      }

      // 삽입할 위치의 이전 노드 찾기
      const prevNode = this.findByIndex(index - 1);

      // 링크드 리스트 변환과정
      // 이전 노드의 다음이
      node.next = prevNode.next;
      prevNode.next = id;
      node.prev = prevNode.id;

      // 노드의 다음께 있으면 node를 얻고 다음 노드의 prev가 새로 추가된 노드로 업데이트
      if (node.next) {
        const nextNode = this.getNode(node.next);
        if (nextNode) {
          nextNode.prev = id;
        }
      }

      return { node };
    } catch (e) {
      throw new Error(`링크드 리스트 내에서 insertAtIndex 실패\n${e}`);
    }
  }

  /**
   * 원격 삽입 연산을 처리합니다.
   * 원격 연산이 왔을때는 이미 node정보가 완성된 상태로 수신하여 큰 연산이 필요 없다.
   * @param node 삽입할 노드 객체
   * @returns 수정된 인덱스 (선택사항)
   */
  insertById(node: Node): void {
    // 이미 존재하는 노드라면 무시
    if (this.getNode(node.id)) {
      return;
    }

    // 노드의 prev가 null이면 헤드에 삽입
    if (!node.prev) {
      node.next = this.head;
      node.prev = null;

      if (this.head) {
        const oldHead = this.getNode(this.head);
        if (oldHead) {
          oldHead.prev = node.id;
        }
      }

      this.head = node.id;
      this.setNode(node.id, node);
      return;
    }

    // 삽입할 위치의 이전 노드 찾기
    const prevNode = this.getNode(node.prev);
    if (!prevNode) {
      throw new Error(
        `원격 삽입 시, 이전 노드를 찾을 수 없습니다. prevId: ${JSON.stringify(node.prev)}`,
      );
    }

    // 새 노드의 다음을 이전 노드의 다음으로 설정
    node.next = prevNode.next;
    node.prev = prevNode.id;

    // 이전 노드의 다음을 새 노드로 설정
    prevNode.next = node.id;

    // 새 노드의 다음 노드가 있다면, 그 노드의 prev를 새 노드로 업데이트
    if (node.next) {
      const nextNode = this.getNode(node.next);
      if (nextNode) {
        nextNode.prev = node.id;
      }
    }

    // 새 노드를 nodeMap에 추가
    this.setNode(node.id, node);
  }

  /**
   * 현재 리스트를 문자열로 변환합니다.
   * @returns 링크드 리스트를 순회하여 얻은 문자열
   */

  stringify(): string {
    let currentNodeId = this.head;
    let result = "";

    while (currentNodeId !== null) {
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) break;
      result += currentNode.value;
      currentNodeId = currentNode.next;
    }

    return result;
  }

  /**
   * 현재 리스트를 배열로 변환합니다.
   * @returns 배열로 변환된 리스트
   */

  spread(): string[] {
    let currentNodeId = this.head;
    const result: string[] = [];

    while (currentNodeId !== null) {
      const currentNode = this.getNode(currentNodeId);
      if (!currentNode) break;
      result.push(currentNode.value);
      currentNodeId = currentNode.next;
    }

    return result;
  }
}
