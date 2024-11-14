import { BlockCRDT } from "@noctaCrdt/Crdt";
import { Char } from "@noctaCrdt/Node";
import { CharId } from "@noctaCrdt/NodeId";
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface RemoteInsertOperation {
  node: Char; // Node<NodeId>에서 Char로 변경
}
interface RemoteDeleteOperation {
  targetId: CharId;
  clock: number;
}

export const TestApp = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const crdtRef = useRef<BlockCRDT | null>(null); // CRDT를 BlockCRDT로 변경
  const [content, setContent] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket: Socket = io("http://localhost:3000");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("requestId");
    });

    socket.on("assignId", (id: number) => {
      crdtRef.current = new BlockCRDT(id);
    });

    socket.on("document", (data: any) => {
      if (crdtRef.current) {
        crdtRef.current.clock = data.clock;
        crdtRef.current.client = data.client;

        if (data.LinkedList.head) {
          crdtRef.current.LinkedList.head = new CharId( // NodeId를 CharId로 변경
            data.LinkedList.head.clock,
            data.LinkedList.head.client,
          );
        } else {
          crdtRef.current.LinkedList.head = null;
        }

        crdtRef.current.LinkedList.nodeMap = {};
        for (const key in data.LinkedList.nodeMap) {
          const node = data.LinkedList.nodeMap[key];
          const reconstructedNode = new Char(node.value, new CharId(node.id.clock, node.id.client)); // Node를 Char로 변경
          reconstructedNode.next = node.next ? new CharId(node.next.clock, node.next.client) : null;
          reconstructedNode.prev = node.prev ? new CharId(node.prev.clock, node.prev.client) : null;
          crdtRef.current.LinkedList.nodeMap[key] = reconstructedNode;
        }

        setContent(crdtRef.current.read());
      }
    });

    socket.on("insert", (operation: RemoteInsertOperation) => {
      if (crdtRef.current) {
        crdtRef.current.remoteInsert(operation);
        setContent(crdtRef.current.read());
      }
    });

    socket.on("delete", (operation: RemoteDeleteOperation) => {
      if (crdtRef.current) {
        crdtRef.current.remoteDelete(operation);
        setContent(crdtRef.current.read());
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);
  // content 상태가 변경되면 contentEditable div를 업데이트
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerText !== content) {
      contentRef.current.innerText = content;
    }
  }, [content]);

  /**
   * 두 문자열 간의 차이 인덱스를 찾습니다.
   * @param oldStr 이전 문자열
   * @param newStr 현재 문자열
   * @returns 차이가 발생한 인덱스
   */
  const findDifferenceIndex = (oldStr: string, newStr: string): number => {
    let i = 0;
    while (i < oldStr.length && i < newStr.length && oldStr[i] === newStr[i]) {
      i += 1;
    }
    return i;
  };

  // 캐럿 커서 위치로 추가 인덱스를 정해도 될것같은느낌.

  //   const handleCursorChange = () => {
  //     if (!crdtRef.current || !contentRef.current || !socketRef.current) return;

  //     const selection = window.getSelection();
  //     if (selection && selection.rangeCount > 0) {
  //       const range = selection.getRangeAt(0);
  //       const preCaretRange = range.cloneRange();
  //       preCaretRange.selectNodeContents(contentRef.current);
  //       preCaretRange.setEnd(range.endContainer, range.endOffset);
  //       const caretPosition = preCaretRange.toString().length;

  //       const cursorData: CursorPosition = {
  //         clientId: numericId,
  //         position: caretPosition,
  //       };

  //       // 서버로 커서 위치 전파
  //       socketRef.current.emit("cursor", cursorData);
  //     }
  //   };
  /**
   * 사용자 입력 핸들러
   */
  const handleInput = () => {
    if (!crdtRef.current || !contentRef.current || !socketRef.current) return;
    const newContent = contentRef.current.innerText || "";
    const oldContent = crdtRef.current.read();
    const diffIndex = findDifferenceIndex(oldContent, newContent);

    const trimmedNewContent = newContent.trim();
    console.log("newContent:", JSON.stringify(newContent));
    console.log("oldContent:", oldContent);
    console.log("newContent.length:", newContent.length, "oldContent.length:", oldContent.length);

    if (trimmedNewContent.length > oldContent.length) {
      // 삽입이 발생한 경우
      const insertedChar = newContent[diffIndex];
      console.log(`삽입: '${insertedChar}' at index ${diffIndex}`);

      // CRDT 로컬 삽입 수행
      const insertOp = crdtRef.current.localInsert(diffIndex, insertedChar);

      // 서버로 삽입 연산 전파
      socketRef.current.emit("insert", insertOp);

      // 로컬 텍스트 업데이트
      setContent(crdtRef.current.read());
    } else if (trimmedNewContent.length < oldContent.length) {
      // 삭제가 발생한 경우
      console.log(`삭제: at index ${diffIndex}`);

      // CRDT 로컬 삭제 수행
      const deleteOp = crdtRef.current.localDelete(diffIndex);
      console.log(deleteOp, typeof deleteOp);
      // 서버로 삭제 연산 전파
      socketRef.current.emit("delete", deleteOp);

      // 로컬 텍스트 업데이트
      setContent(crdtRef.current.read());
    } else {
      // 변경이 없거나, 교체 발생한 경우 (단일 교체를 처리하려면 추가 로직 필요)
      console.log("변경 없음 또는 교체 발생.");
      // 추가 로직 구현 가능
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>실시간 편집기 (CRDT 적용)</h1>
      <p>클라이언트 숫자ID: {0}</p>
      <div
        contentEditable="true"
        ref={contentRef}
        onInput={handleInput}
        // onSelect={handleCursorChange}
        style={{
          border: "1px solid #ddd",
          padding: "8px",
          minHeight: "150px",
          width: "100%",
          outline: "none",
          whiteSpace: "pre-wrap",
        }}
      />
      <h2>CRDT 상태</h2>
      <pre>{JSON.stringify(crdtRef.current?.LinkedList, null, 2)}</pre>
    </div>
  );
};
