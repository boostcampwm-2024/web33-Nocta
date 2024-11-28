import { EditorCRDT } from "@noctaCrdt/Crdt";
import { RemoteCharInsertOperation } from "@noctaCrdt/Interfaces";
import { Block } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { useCallback } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";
import { getAbsoluteCaretPosition } from "@src/utils/caretUtils";
import { EditorStateProps } from "../Editor";
import { getTextOffset } from "../utils/domSyncUtils";

interface UseBlockOperationProps {
  editorCRDT: EditorCRDT;
  pageId: string;
  setEditorState: React.Dispatch<React.SetStateAction<EditorStateProps>>;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  handleHrInput: (block: Block, content: string) => boolean;
}

export const useBlockOperation = ({
  editorCRDT,
  pageId,
  setEditorState,
  onKeyDown,
  handleHrInput,
}: UseBlockOperationProps) => {
  const { sendCharInsertOperation, sendCharDeleteOperation } = useSocketStore();

  const handleBlockClick = useCallback(
    (blockId: BlockId, e: React.MouseEvent<HTMLDivElement>) => {
      if (editorCRDT) {
        const selection = window.getSelection();
        if (!selection) return;

        const clickedElement = (e.target as HTMLElement).closest(
          '[contenteditable="true"]',
        ) as HTMLDivElement;
        if (!clickedElement) return;

        editorCRDT.currentBlock = editorCRDT.LinkedList.nodeMap[JSON.stringify(blockId)];
        const caretPosition = getAbsoluteCaretPosition(clickedElement);

        // 계산된 캐럿 위치 저장
        editorCRDT.currentBlock.crdt.currentCaret = caretPosition;
      }
    },
    [editorCRDT],
  );

  const handleBlockInput = useCallback(
    (e: React.FormEvent<HTMLDivElement>, block: Block) => {
      if (!block || !editorCRDT) return;
      if ((e.nativeEvent as InputEvent).isComposing) {
        return;
      }

      let operationNode;
      const element = e.currentTarget;
      const newContent = element.textContent || "";
      const currentContent = block.crdt.read();
      const caretPosition = getAbsoluteCaretPosition(element);

      if (handleHrInput(block, newContent)) {
        return;
      }

      if (newContent.length > currentContent.length) {
        let charNode: RemoteCharInsertOperation;
        // 캐럿 위치 유효성 검사
        const validCaretPosition = Math.min(Math.max(0, caretPosition), currentContent.length);
        // 맨 앞에 삽입
        if (caretPosition === 0) {
          const [addedChar] = newContent;
          charNode = block.crdt.localInsert(0, addedChar, block.id, pageId);
        } else if (caretPosition > currentContent.length) {
          // 맨 뒤에 삽입
          let prevChar;
          if (currentContent.length > 0) {
            prevChar = editorCRDT.currentBlock?.crdt.LinkedList.findByIndex(
              currentContent.length - 1,
            );
          }
          const addedChar = newContent[newContent.length - 1];
          charNode = block.crdt.localInsert(
            currentContent.length,
            addedChar,
            block.id,
            pageId,
            prevChar ? prevChar.style : [],
            prevChar ? prevChar.color : undefined,
            prevChar ? prevChar.backgroundColor : undefined,
          );
        } else {
          // 중간에 삽입
          const prevChar = editorCRDT.currentBlock?.crdt.LinkedList.findByIndex(
            validCaretPosition - 1,
          );
          const addedChar = newContent[validCaretPosition - 1];
          charNode = block.crdt.localInsert(
            validCaretPosition - 1,
            addedChar,
            block.id,
            pageId,
            prevChar?.style,
            prevChar?.color,
            prevChar?.backgroundColor,
          );
        }
        editorCRDT.currentBlock!.crdt.currentCaret = caretPosition;
        sendCharInsertOperation({
          type: "charInsert",
          node: charNode.node,
          blockId: block.id,
          pageId,
        });
      } else if (newContent.length < currentContent.length) {
        // 문자가 삭제된 경우
        // 삭제 위치 계산
        const deletePosition = Math.max(0, caretPosition);
        if (deletePosition >= 0 && deletePosition < currentContent.length) {
          operationNode = block.crdt.localDelete(deletePosition, block.id, pageId);
          sendCharDeleteOperation(operationNode);

          // 캐럿 위치 업데이트
          editorCRDT.currentBlock!.crdt.currentCaret = deletePosition;
        }
      }
      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
      });
    },
    [sendCharInsertOperation, sendCharDeleteOperation, editorCRDT, pageId],
  );

  const deleteSelectedText = useCallback(
    (block: Block, startOffset: number, endOffset: number) => {
      for (let i = endOffset - 1; i >= startOffset; i--) {
        const operationNode = block.crdt.localDelete(i, block.id, pageId);
        sendCharDeleteOperation(operationNode);
      }
      block.crdt.currentCaret = startOffset;
    },
    [pageId, sendCharDeleteOperation],
  );

  const handleKeyWithSelection = useCallback(
    (
      e: React.KeyboardEvent<HTMLDivElement>,
      block: Block,
      startOffset: number,
      endOffset: number,
    ) => {
      switch (e.key) {
        case "Backspace":
        case "Delete": {
          e.preventDefault();
          deleteSelectedText(block, startOffset, endOffset);
          setEditorState({
            clock: editorCRDT.clock,
            linkedList: editorCRDT.LinkedList,
          });
          break;
        }
        // 복사, 잘라내기, 실행취소 등 조합 키는 기본 동작 허용
        case "c":
        case "v":
        case "x":
        case "z":
        case "y": {
          if (e.metaKey || e.ctrlKey) {
            // 기본 브라우저 동작 허용
            return;
          }
          deleteSelectedText(block, startOffset, endOffset);
          onKeyDown(e);
          break;
        }
        // 탐색 및 선택 관련 키
        case "Tab":
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
        case "Home":
        case "End":
        case "PageUp":
        case "PageDown": {
          e.preventDefault();
          onKeyDown(e);
          break;
        }
        // 기능 키들은 기본 동작 허용
        case "F1":
        case "F2":
        case "F3":
        case "F4":
        case "F5":
        case "F6":
        case "F7":
        case "F8":
        case "F9":
        case "F10":
        case "F11":
        case "F12": {
          return;
        }
        case "Enter": {
          deleteSelectedText(block, startOffset, endOffset);
          onKeyDown(e);
          break;
        }
        case "Escape": {
          // 선택 해제만 하고 다른 동작은 하지 않음
          window.getSelection()?.removeAllRanges();
          return;
        }
        default: {
          // 일반 입력 키의 경우
          if (e.metaKey || e.ctrlKey || e.altKey) {
            // 다른 단축키들 허용
            return;
          }
          deleteSelectedText(block, startOffset, endOffset);
          onKeyDown(e);
        }
      }
    },
    [deleteSelectedText, editorCRDT, onKeyDown],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>, blockRef: HTMLDivElement | null, block: Block) => {
      if (!blockRef || !block) return;
      const selection = window.getSelection();
      if (!selection) return;

      // 선택된 텍스트가 없으면 기본 키 핸들러 실행
      if (selection.isCollapsed) {
        onKeyDown(e);
        return;
      }

      const range = selection.getRangeAt(0);
      if (!blockRef.contains(range.commonAncestorContainer)) return;

      const startOffset = getTextOffset(blockRef, range.startContainer, range.startOffset);
      const endOffset = getTextOffset(blockRef, range.endContainer, range.endOffset);

      handleKeyWithSelection(e, block, startOffset, endOffset);
    },
    [editorCRDT.LinkedList, sendCharDeleteOperation, pageId, onKeyDown],
  );

  return {
    handleBlockClick,
    handleBlockInput,
    handleKeyDown,
  };
};
