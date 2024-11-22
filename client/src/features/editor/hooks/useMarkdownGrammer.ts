import { EditorCRDT, BlockCRDT } from "@noctaCrdt/Crdt";
import {
  RemoteBlockInsertOperation,
  RemoteBlockDeleteOperation,
  RemoteBlockUpdateOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
} from "@noctaCrdt/Interfaces";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { BlockId } from "@noctaCrdt/NodeId";
import { useCallback } from "react";
import { EditorStateProps } from "@features/editor/Editor";
import { checkMarkdownPattern } from "@src/features/editor/utils/markdownPatterns";
import { setCaretPosition } from "@src/utils/caretUtils";

interface useMarkdownGrammerProps {
  editorCRDT: EditorCRDT;
  editorState: EditorStateProps;
  setEditorState: React.Dispatch<
    React.SetStateAction<{
      clock: number;
      linkedList: BlockLinkedList;
    }>
  >;
  pageId: string;
  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => void;
  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => void;
  sendCharDeleteOperation: (operation: RemoteCharDeleteOperation) => void;
  sendCharInsertOperation: (operation: RemoteCharInsertOperation) => void;
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void;
}

export const useMarkdownGrammer = ({
  editorCRDT,
  editorState,
  setEditorState,
  pageId,
  sendBlockInsertOperation,
  sendBlockDeleteOperation,
  sendCharDeleteOperation,
  sendCharInsertOperation,
  sendBlockUpdateOperation,
}: useMarkdownGrammerProps) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const createNewBlock = (index: number): RemoteBlockInsertOperation => {
        const operation = editorCRDT.localInsert(index, "");
        // TODO: 블록 타입이 초기화가 안됨???
        operation.node.type = "p";
        return operation;
      };

      const updateEditorState = (newBlockId: BlockId | null = null) => {
        if (
          newBlockId !== null &&
          editorCRDT.currentBlock !== editorCRDT.LinkedList.getNode(newBlockId)
        ) {
          editorCRDT.currentBlock = editorCRDT.LinkedList.getNode(newBlockId);
        }
        setEditorState({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
        });
      };

      const currentBlockId = editorCRDT.currentBlock ? editorCRDT.currentBlock.id : null;
      if (!currentBlockId) return;

      const currentBlock = editorCRDT.LinkedList.getNode(currentBlockId);
      if (!currentBlock) return;

      const currentIndex = editorCRDT.LinkedList.spread().findIndex((block) =>
        block.id.equals(currentBlockId),
      );

      switch (e.key) {
        case "Enter": {
          e.preventDefault();
          const selection = window.getSelection();
          if (!selection) return;
          const caretPosition = selection.focusOffset;
          const currentContent = currentBlock.crdt.read();
          const afterText = currentContent.slice(caretPosition);

          if (!currentContent && currentBlock.type !== "p") {
            currentBlock.type = "p";
            sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
            editorCRDT.currentBlock = currentBlock;
            updateEditorState();
            break;
          }

          if (!currentContent && currentBlock.type === "p") {
            // 새로운 기본 블록 생성
            const operation = createNewBlock(currentIndex + 1);
            operation.node.indent = currentBlock.indent;
            operation.node.crdt = new BlockCRDT(editorCRDT.client);

            sendBlockInsertOperation({ node: operation.node, pageId });
            updateEditorState(operation.node.id);
            break;
          }

          // 현재 캐럿 위치 이후의 텍스트가 있으면 현재 블록 내용 업데이트
          if (afterText) {
            // 캐럿 이후의 텍스트만 제거
            for (let i = currentContent.length - 1; i >= caretPosition; i--) {
              sendCharDeleteOperation(currentBlock.crdt.localDelete(i, currentBlock.id, pageId));
            }
          }

          // 새 블록 생성
          const operation = createNewBlock(currentIndex + 1);
          operation.node.crdt = new BlockCRDT(editorCRDT.client);
          operation.node.indent = currentBlock.indent;
          sendBlockInsertOperation({ node: operation.node, pageId });
          // 캐럿 이후의 텍스트 있으면 새 블록에 추가
          if (afterText) {
            afterText.split("").forEach((char, i) => {
              sendCharInsertOperation(
                operation.node.crdt.localInsert(i, char, operation.node.id, pageId),
              );
            });
          }

          // 현재 블록이 li나 checkbox면 동일한 타입으로 생성
          if (["ul", "ol", "checkbox"].includes(currentBlock.type)) {
            operation.node.type = currentBlock.type;
            sendBlockUpdateOperation(editorCRDT.localUpdate(operation.node, pageId));
          }
          updateEditorState(operation.node.id);
          break;
        }

        case "Backspace": {
          const selection = window.getSelection();
          const caretPosition = selection?.focusOffset || 0;
          const currentContent = currentBlock.crdt.read();
          if (currentContent === "") {
            e.preventDefault();
            if (currentBlock.indent > 0) {
              currentBlock.indent -= 1;
              sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
              editorCRDT.currentBlock = currentBlock;
              updateEditorState();
              break;
            }

            if (currentBlock.type !== "p") {
              // 마지막 블록이면 기본 블록으로 변경
              currentBlock.type = "p";
              sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
              editorCRDT.currentBlock = currentBlock;
              updateEditorState();
              break;
            }

            const prevBlock =
              currentIndex > 0 ? editorCRDT.LinkedList.findByIndex(currentIndex - 1) : null;
            if (prevBlock) {
              sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));
              prevBlock.crdt.currentCaret = prevBlock.crdt.read().length;
              editorCRDT.currentBlock = prevBlock;
              updateEditorState(prevBlock.id);
            }
            break;
          } else {
            if (caretPosition === 0) {
              if (currentBlock.indent > 0) {
                currentBlock.indent -= 1;
                sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
                editorCRDT.currentBlock = currentBlock;
                updateEditorState();
                break;
              }
              if (currentBlock.type !== "p") {
                currentBlock.type = "p";
                sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
                editorCRDT.currentBlock = currentBlock;
                updateEditorState();
                // FIX: 서윤님 피드백 반영
              } else {
                const prevBlock =
                  currentIndex > 0 ? editorCRDT.LinkedList.findByIndex(currentIndex - 1) : null;
                if (prevBlock) {
                  const prevBlockEndCaret = prevBlock.crdt.read().length;
                  currentContent.split("").forEach((char) => {
                    sendCharInsertOperation(
                      prevBlock.crdt.localInsert(
                        prevBlock.crdt.read().length,
                        char,
                        prevBlock.id,
                        pageId,
                      ),
                    );
                    sendCharDeleteOperation(
                      currentBlock.crdt.localDelete(caretPosition, currentBlock.id, pageId),
                    );
                  });
                  prevBlock.crdt.currentCaret = prevBlockEndCaret;
                  sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));
                  updateEditorState(prevBlock.id);
                  e.preventDefault();
                }
              }
            }
            break;
          }
        }

        case "Tab": {
          e.preventDefault();

          if (currentBlock) {
            if (e.shiftKey) {
              // shift + tab: 들여쓰기 감소
              if (currentBlock.indent > 0) {
                currentBlock.indent -= 1;
                sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
                editorCRDT.currentBlock = currentBlock;
                updateEditorState();
              }
            } else {
              // tab: 들여쓰기 증가
              const maxIndent = 3;
              if (currentBlock.indent < maxIndent) {
                currentBlock.indent += 1;
                sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
                editorCRDT.currentBlock = currentBlock;
                updateEditorState();
              }
            }
          }
          break;
        }

        case " ": {
          // 여기 수정함
          const selection = window.getSelection();
          if (!selection) return;
          const currentContent = currentBlock.crdt.read();
          const markdownElement = checkMarkdownPattern(currentContent);
          if (markdownElement && currentBlock.type === "p") {
            e.preventDefault();
            // 마크다운 패턴 매칭 시 타입 변경하고 내용 비우기
            currentBlock.type = markdownElement.type;
            let deleteCount = 0;
            while (deleteCount < markdownElement.length) {
              sendCharDeleteOperation(currentBlock.crdt.localDelete(0, currentBlock.id, pageId));
              deleteCount += 1;
            }
            sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
            currentBlock.crdt.currentCaret = 0;
            editorCRDT.currentBlock = currentBlock;
            updateEditorState();
          }

          break;
        }

        case "ArrowUp":
        case "ArrowDown": {
          const hasPrevBlock = currentIndex > 0;
          const hasNextBlock = currentIndex < editorCRDT.LinkedList.spread().length - 1;
          if (e.key === "ArrowUp" && !hasPrevBlock) {
            e.preventDefault();
            return;
          }
          if (e.key === "ArrowDown" && !hasNextBlock) {
            e.preventDefault();
            return;
          }

          const selection = window.getSelection();
          const caretPosition = selection?.focusOffset || 0;

          // 이동할 블록 결정
          const targetIndex = e.key === "ArrowUp" ? currentIndex - 1 : currentIndex + 1;
          const targetBlock = editorCRDT.LinkedList.findByIndex(targetIndex);
          if (!targetBlock) return;
          e.preventDefault();
          targetBlock.crdt.currentCaret = Math.min(caretPosition, targetBlock.crdt.read().length);
          editorCRDT.currentBlock = targetBlock;
          setCaretPosition({
            blockId: targetBlock.id,
            linkedList: editorCRDT.LinkedList,
            position: Math.min(caretPosition, targetBlock.crdt.read().length),
          });
          break;
        }
        case "ArrowLeft":
        case "ArrowRight": {
          const selection = window.getSelection();
          const caretPosition = selection?.focusOffset || 0;
          const textLength = currentBlock.crdt.read().length;

          // 왼쪽 끝에서 이전 블록으로
          if (e.key === "ArrowLeft" && caretPosition === 0 && currentIndex > 0) {
            e.preventDefault(); // 기본 동작 방지
            const prevBlock = editorCRDT.LinkedList.findByIndex(currentIndex - 1);
            if (prevBlock) {
              prevBlock.crdt.currentCaret = prevBlock.crdt.read().length;
              editorCRDT.currentBlock = prevBlock;
              setCaretPosition({
                blockId: prevBlock.id,
                linkedList: editorCRDT.LinkedList,
                position: prevBlock.crdt.read().length,
              });
            }
            break;
            // 오른쪽 끝에서 다음 블록으로
          } else if (
            e.key === "ArrowRight" &&
            caretPosition === textLength &&
            currentIndex < editorCRDT.LinkedList.spread().length - 1
          ) {
            e.preventDefault(); // 기본 동작 방지
            const nextBlock = editorState.linkedList.findByIndex(currentIndex + 1);
            if (nextBlock) {
              nextBlock.crdt.currentCaret = 0;
              editorCRDT.currentBlock = nextBlock;
              setCaretPosition({
                blockId: nextBlock.id,
                linkedList: editorCRDT.LinkedList,
                position: 0,
              });
            }
            break;
            // 블록 내에서 이동하는 경우
          } else {
            if (e.key === "ArrowLeft") {
              currentBlock.crdt.currentCaret -= 1;
            } else {
              currentBlock.crdt.currentCaret += 1;
            }
          }

          break;
        }
      }
    },
    [editorCRDT, editorState, setEditorState, pageId],
  );

  return { handleKeyDown };
};
