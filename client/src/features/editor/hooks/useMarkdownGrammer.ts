import { EditorCRDT, BlockCRDT } from "@noctaCrdt/Crdt";
import {
  RemoteBlockInsertOperation,
  RemoteBlockDeleteOperation,
  RemoteBlockUpdateOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
} from "@noctaCrdt/Interfaces";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block } from "@noctaCrdt/Node";
import { useCallback } from "react";
import { EditorStateProps } from "@features/editor/Editor";
import { checkMarkdownPattern } from "@src/features/editor/utils/markdownPatterns";
import { setCaretPosition, getAbsoluteCaretPosition } from "@src/utils/caretUtils";

interface useMarkdownGrammerProps {
  editorCRDT: EditorCRDT;
  editorState: EditorStateProps; // Add editorRef
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

      const updateEditorState = () => {
        setEditorState({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
        });
      };

      const findBlock = (index: number) => {
        if (index < 0) return null;
        if (index >= editorCRDT.LinkedList.spread().length) return null;

        return editorCRDT.LinkedList.findByIndex(index);
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
          if (e.nativeEvent.isComposing) return;
          e.preventDefault();
          const caretPosition = getAbsoluteCaretPosition(e.currentTarget);
          const currentContent = currentBlock.crdt.read();
          const currentCharNodes = currentBlock.crdt.spread();

          if (!currentContent && currentBlock.type !== "p") {
            const wasOrderedList = currentBlock.type === "ol";
            currentBlock.type = "p";
            sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
            editorCRDT.currentBlock = currentBlock;
            editorCRDT.currentBlock.crdt.currentCaret = 0;
            if (wasOrderedList) {
              editorCRDT.LinkedList.updateAllOrderedListIndices();
            }
            updateEditorState();
            break;
          }

          if (!currentContent && currentBlock.type === "p") {
            // 새로운 기본 블록 생성
            const operation = createNewBlock(currentIndex + 1);
            operation.node.indent = currentBlock.indent;
            operation.node.crdt = new BlockCRDT(editorCRDT.client);

            sendBlockInsertOperation({ type: "blockInsert", node: operation.node, pageId });
            editorCRDT.currentBlock = operation.node;
            editorCRDT.currentBlock.crdt.currentCaret = 0;
            updateEditorState();
            break;
          }

          // 현재 캐럿 위치를 기준으로 내용 분할
          const afterContent = currentContent.slice(caretPosition);
          const afterCharNode = currentCharNodes.slice(caretPosition);

          // 새 블록 생성
          const operation = createNewBlock(currentIndex + 1);
          operation.node.crdt = new BlockCRDT(editorCRDT.client);
          if (currentBlock.type === "ol") {
            operation.node.listIndex = currentBlock.listIndex! + 1;
          }
          operation.node.indent = currentBlock.indent;
          sendBlockInsertOperation({ type: "blockInsert", node: operation.node, pageId });

          // 캐럿 이후의 텍스트 있으면 새 블록에 추가
          if (afterContent) {
            afterContent.split("").forEach((char, i) => {
              const currentCharNode = afterCharNode[i];
              sendCharInsertOperation(
                operation.node.crdt.localInsert(
                  i,
                  char,
                  operation.node.id,
                  pageId,
                  currentCharNode.style,
                  currentCharNode.color,
                  currentCharNode.backgroundColor,
                ),
              );
            });
            for (let i = currentContent.length - 1; i >= caretPosition; i--) {
              sendCharDeleteOperation(currentBlock.crdt.localDelete(i, currentBlock.id, pageId));
            }
          }

          // 현재 블록이 li나 checkbox면 동일한 타입으로 생성
          if (["ul", "ol", "checkbox"].includes(currentBlock.type)) {
            operation.node.type = currentBlock.type;
            sendBlockUpdateOperation(editorCRDT.localUpdate(operation.node, pageId));
          }

          editorCRDT.currentBlock = operation.node;
          editorCRDT.currentBlock.crdt.currentCaret = 0;

          // 모든 ordered list 인덱스 재계산
          if (currentBlock.type === "ol") {
            editorCRDT.LinkedList.updateAllOrderedListIndices();
          }

          updateEditorState();
          break;
        }

        case "Backspace": {
          const currentContent = currentBlock.crdt.read();
          const currentCharNodes = currentBlock.crdt.spread();
          if (currentContent === "") {
            e.preventDefault();
            if (currentBlock.indent > 0) {
              const wasOrderedList = currentBlock.type === "ol";
              currentBlock.indent -= 1;
              sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
              editorCRDT.currentBlock = currentBlock;
              if (wasOrderedList) {
                editorCRDT.LinkedList.updateAllOrderedListIndices();
              }
              updateEditorState();
              break;
            }

            // 현재 블록이 기본 블록이면서 앞뒤가 ordered list인 경우 확인
            if (currentBlock.type === "p") {
              const prevBlock = currentBlock.prev
                ? editorCRDT.LinkedList.getNode(currentBlock.prev)
                : null;
              const nextBlock = currentBlock.next
                ? editorCRDT.LinkedList.getNode(currentBlock.next)
                : null;

              if (prevBlock?.type === "ol" && nextBlock?.type === "ol") {
                // 현재 블록 삭제
                sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));

                // 리스트 인덱스 재계산
                editorCRDT.LinkedList.updateAllOrderedListIndices();

                // 이전 블록으로 캐럿 이동
                editorCRDT.currentBlock = prevBlock;
                editorCRDT.currentBlock.crdt.currentCaret = prevBlock.crdt.read().length;

                updateEditorState();
                break;
              }
            }

            if (currentBlock.type !== "p") {
              const wasOrderedList = currentBlock.type === "ol";
              // 마지막 블록이면 기본 블록으로 변경
              currentBlock.type = "p";
              sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
              editorCRDT.currentBlock = currentBlock;

              // ol이었던 경우에만 ordered list 인덱스 재계산
              if (wasOrderedList) {
                editorCRDT.LinkedList.updateAllOrderedListIndices();
              }

              updateEditorState();
              break;
            }

            const prevBlock =
              currentIndex > 0 ? editorCRDT.LinkedList.findByIndex(currentIndex - 1) : null;
            if (prevBlock) {
              // 현재 블록 삭제
              sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));

              // 이전 편집 가능한 블록 찾기
              let targetIndex = currentIndex - 1;
              let targetBlock = findBlock(targetIndex);

              while (targetBlock && targetBlock.type === "hr") {
                targetIndex -= 1;
                targetBlock = findBlock(targetIndex);
              }

              // 편집 가능한 블록을 찾았다면 캐럿 이동
              if (targetBlock && targetBlock.type !== "hr") {
                targetBlock.crdt.currentCaret = targetBlock.crdt.read().length;
                editorCRDT.currentBlock = targetBlock;
                setCaretPosition({
                  blockId: targetBlock.id,
                  linkedList: editorCRDT.LinkedList,
                  position: targetBlock.crdt.read().length,
                  pageId,
                });
              }

              updateEditorState();
            }
            break;
          } else {
            const currentCaretPosition = currentBlock.crdt.currentCaret;
            if (currentCaretPosition === 0) {
              if (currentBlock.indent > 0) {
                currentBlock.indent -= 1;
                sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
                editorCRDT.currentBlock = currentBlock;
                updateEditorState();
                break;
              }
              if (currentBlock.type !== "p") {
                const wasOrderedList = currentBlock.type === "ol";
                currentBlock.type = "p";
                sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
                editorCRDT.currentBlock = currentBlock;
                if (wasOrderedList) {
                  editorCRDT.LinkedList.updateAllOrderedListIndices();
                }
                updateEditorState();
                break;
              }
              // FIX: 서윤님 피드백 반영
              const prevBlock =
                currentIndex > 0 ? editorCRDT.LinkedList.findByIndex(currentIndex - 1) : null;
              const nextBlock =
                currentIndex < editorCRDT.LinkedList.spread().length - 1
                  ? editorCRDT.LinkedList.findByIndex(currentIndex + 1)
                  : null;
              if (prevBlock) {
                let targetIndex = currentIndex - 1;
                let targetBlock = findBlock(targetIndex);

                while (targetBlock && targetBlock.type === "hr") {
                  targetIndex -= 1;
                  targetBlock = findBlock(targetIndex);
                }
                if (targetBlock && prevBlock.type === "hr") {
                  editorCRDT.currentBlock = targetBlock;
                  editorCRDT.currentBlock.crdt.currentCaret = targetBlock.crdt.read().length; // 커서 이동
                  updateEditorState();
                  break;
                }

                const prevBlockEndCaret = prevBlock.crdt.spread().length;
                for (let i = 0; i < currentContent.length; i++) {
                  const currentCharNode = currentCharNodes[i];
                  sendCharInsertOperation(
                    prevBlock.crdt.localInsert(
                      prevBlockEndCaret + i,
                      currentContent[i],
                      prevBlock.id,
                      pageId,
                      currentCharNode.style,
                      currentCharNode.color,
                      currentCharNode.backgroundColor,
                    ),
                  );
                }
                currentContent.split("").forEach(() => {
                  sendCharDeleteOperation(
                    currentBlock.crdt.localDelete(0, currentBlock.id, pageId),
                  );
                });
                editorCRDT.currentBlock = prevBlock;
                editorCRDT.currentBlock.crdt.currentCaret = prevBlockEndCaret;
                sendBlockDeleteOperation(editorCRDT.localDelete(currentIndex, undefined, pageId));
                updateEditorState();
                if (prevBlock.type === "ol" && nextBlock?.type === "ol") {
                  editorCRDT.LinkedList.updateAllOrderedListIndices();
                }
                e.preventDefault();
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
                const isOrderedList = currentBlock.type === "ol";
                currentBlock.indent -= 1;
                sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
                editorCRDT.currentBlock = currentBlock;
                if (isOrderedList) {
                  editorCRDT.LinkedList.updateAllOrderedListIndices();
                }
                updateEditorState();
              }
            } else {
              // tab: 들여쓰기 증가
              const maxIndent = 3;
              if (currentBlock.indent < maxIndent) {
                const isOrderedList = currentBlock.type === "ol";
                currentBlock.indent += 1;
                sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
                editorCRDT.currentBlock = currentBlock;
                if (isOrderedList) {
                  editorCRDT.LinkedList.updateAllOrderedListIndices();
                }
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
            for (let i = 0; i < markdownElement.length; i++) {
              sendCharDeleteOperation(currentBlock.crdt.localDelete(0, currentBlock.id, pageId));
            }
            sendBlockUpdateOperation(editorCRDT.localUpdate(currentBlock, pageId));
            currentBlock.crdt.currentCaret = 0;
            editorCRDT.currentBlock = currentBlock;
            if (markdownElement.type === "ol") {
              editorCRDT.LinkedList.updateAllOrderedListIndices();
            }
            updateEditorState();
          }

          break;
        }

        case "Delete": {
          const currentContent = currentBlock.crdt.read();
          if (!currentBlock.next || currentContent) return;
          const nextBlock = editorCRDT.LinkedList.getNode(currentBlock.next);
          if (!nextBlock) return;
          sendCharDeleteOperation(
            currentBlock.crdt.localDelete(currentIndex + 1, currentBlock.id, pageId),
          );
          updateEditorState();
          break;
        }

        case "Home":
        case "End": {
          currentBlock.crdt.currentCaret = e.key === "Home" ? 0 : currentBlock.crdt.read().length;
          setCaretPosition({
            blockId: currentBlock.id,
            linkedList: editorCRDT.LinkedList,
            position: currentBlock.crdt.currentCaret,
            pageId,
          });
          break;
        }

        case "PageUp": {
          e.preventDefault();
          const currentCaretPosition = currentBlock.crdt.currentCaret;
          const headBlock = editorCRDT.LinkedList.getNode(editorCRDT.LinkedList.head);
          if (!headBlock) return;
          headBlock.crdt.currentCaret = Math.min(
            currentCaretPosition,
            headBlock.crdt.read().length,
          );
          editorCRDT.currentBlock = headBlock;
          setCaretPosition({
            blockId: headBlock.id,
            linkedList: editorCRDT.LinkedList,
            position: currentCaretPosition,
            pageId,
          });
          break;
        }

        case "PageDown": {
          e.preventDefault();
          if (!currentBlock.next) return;
          const currentCaretPosition = currentBlock.crdt.currentCaret;
          let lastBlock = currentBlock;
          while (lastBlock.next && editorCRDT.LinkedList.getNode(lastBlock.next)) {
            lastBlock = editorCRDT.LinkedList.getNode(lastBlock.next)!;
          }
          lastBlock.crdt.currentCaret = Math.min(
            currentCaretPosition,
            lastBlock.crdt.read().length,
          );
          editorCRDT.currentBlock = lastBlock;
          setCaretPosition({
            blockId: lastBlock.id,
            linkedList: editorCRDT.LinkedList,
            position: currentCaretPosition,
            pageId,
          });
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

          const caretPosition = getAbsoluteCaretPosition(e.currentTarget);

          let targetIndex = e.key === "ArrowUp" ? currentIndex - 1 : currentIndex + 1;
          let targetBlock = findBlock(targetIndex);

          while (targetBlock && targetBlock.type === "hr") {
            targetIndex = e.key === "ArrowUp" ? targetIndex - 1 : targetIndex + 1;
            targetBlock = findBlock(targetIndex);
          }

          if (!targetBlock || targetBlock.type === "hr") return;

          e.preventDefault();
          targetBlock.crdt.currentCaret = Math.min(caretPosition, targetBlock.crdt.read().length);
          editorCRDT.currentBlock = targetBlock;
          setCaretPosition({
            blockId: targetBlock.id,
            linkedList: editorCRDT.LinkedList,
            position: Math.min(caretPosition, targetBlock.crdt.read().length),
            pageId,
          });
          break;
        }
        case "ArrowLeft":
        case "ArrowRight": {
          // const selection = window.getSelection();
          // const caretPosition = selection?.focusOffset || 0;
          const caretPosition = getAbsoluteCaretPosition(e.currentTarget);
          const textLength = currentBlock.crdt.read().length;

          // 왼쪽 끝에서 이전 블록으로
          if (e.key === "ArrowLeft" && caretPosition === 0 && currentIndex > 0) {
            e.preventDefault(); // 기본 동작 방지

            let targetIndex = currentIndex - 1;
            let targetBlock = findBlock(targetIndex);

            while (targetBlock && targetBlock.type === "hr") {
              targetIndex -= 1;
              targetBlock = findBlock(targetIndex);
            }

            if (targetBlock && targetBlock.type !== "hr") {
              targetBlock.crdt.currentCaret = targetBlock.crdt.read().length;
              editorCRDT.currentBlock = targetBlock;
              setCaretPosition({
                blockId: targetBlock.id,
                linkedList: editorCRDT.LinkedList,
                position: targetBlock.crdt.read().length,
                pageId,
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
            let targetIndex = currentIndex + 1;
            let targetBlock = findBlock(targetIndex);

            while (targetBlock && targetBlock.type === "hr") {
              targetIndex += 1;
              targetBlock = findBlock(targetIndex);
            }

            if (targetBlock && targetBlock.type !== "hr") {
              targetBlock.crdt.currentCaret = 0;
              editorCRDT.currentBlock = targetBlock;
              setCaretPosition({
                blockId: targetBlock.id,
                linkedList: editorCRDT.LinkedList,
                position: 0,
                pageId,
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

  // hr은 --- 입력 시 생성되는 input 이벤트. KeyDown 입력과 관련이 없으므로 함수 분리
  const handleInput = useCallback(
    (block: Block, newContent: string) => {
      if (newContent === "---") {
        const currentContent = block.crdt.read();
        currentContent.split("").forEach((_) => {
          const operationNode = block.crdt.localDelete(0, block.id, pageId);
          sendCharDeleteOperation(operationNode);
        });

        block.type = "hr";
        sendBlockUpdateOperation(editorCRDT.localUpdate(block, pageId));

        // 새로운 블록 생성
        const currentIndex = editorCRDT.LinkedList.spread().findIndex((b) => b.id.equals(block.id));
        const operation = editorCRDT.localInsert(currentIndex + 1, "");
        operation.node.type = "p";
        sendBlockInsertOperation({ type: "blockInsert", node: operation.node, pageId });

        editorCRDT.currentBlock = operation.node;
        editorCRDT.currentBlock.crdt.currentCaret = 0;

        setEditorState({
          clock: editorCRDT.clock,
          linkedList: editorCRDT.LinkedList,
        });

        return true;
      }
      return false;
    },
    [
      editorCRDT,
      sendCharDeleteOperation,
      sendBlockUpdateOperation,
      sendBlockInsertOperation,
      pageId,
    ],
  );

  return { handleKeyDown, handleInput };
};
