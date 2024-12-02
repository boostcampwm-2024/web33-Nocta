import { EditorCRDT } from "@noctaCrdt/Crdt";
import { TextColorType, BackgroundColorType } from "@noctaCrdt/Interfaces";
import { Block } from "@noctaCrdt/Node";
import { useCallback } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";
import { EditorStateProps } from "../Editor";
import { getTextOffset } from "../utils/domSyncUtils";
import { checkMarkdownPattern } from "../utils/markdownPatterns";

interface ClipboardMetadata {
  value: string;
  style: string[];
  color: TextColorType | undefined;
  backgroundColor: BackgroundColorType | undefined;
}

interface UseCopyAndPasteProps {
  editorCRDT: EditorCRDT;
  pageId: string;
  setEditorState: React.Dispatch<React.SetStateAction<EditorStateProps>>;
  isLocalChange: React.MutableRefObject<boolean>;
}

export const useCopyAndPaste = ({
  editorCRDT,
  pageId,
  setEditorState,
  isLocalChange,
}: UseCopyAndPasteProps) => {
  const {
    sendCharInsertOperation,
    sendCharDeleteOperation,
    sendBlockInsertOperation,
    sendBlockUpdateOperation,
  } = useSocketStore();

  const handleCopy = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>, blockRef: HTMLDivElement | null, block: Block) => {
      e.preventDefault();
      if (!blockRef) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !blockRef) return;

      const range = selection.getRangeAt(0);
      if (!blockRef.contains(range.commonAncestorContainer)) return;

      // 선택된 텍스트의 시작과 끝 위치 계산
      const startOffset = getTextOffset(blockRef, range.startContainer, range.startOffset);
      const endOffset = getTextOffset(blockRef, range.endContainer, range.endOffset);

      // 선택된 텍스트와 스타일 정보 추출
      const selectedChars = block.crdt.LinkedList.spread().slice(startOffset, endOffset);

      // 커스텀 데이터 포맷으로 저장
      const customData = {
        text: selectedChars.map((char) => char.value).join(""),
        metadata: selectedChars.map(
          (char) =>
            ({
              value: char.value,
              style: char.style,
              color: char.color,
              backgroundColor: char.backgroundColor,
            }) as ClipboardMetadata,
        ),
      };

      // 일반 텍스트와 커스텀 데이터 모두 클립보드에 저장
      e.clipboardData.setData("text/plain", customData.text);
      e.clipboardData.setData("application/x-nocta-formatted", JSON.stringify(customData));
    },
    [],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>, blockRef: HTMLDivElement | null, block: Block) => {
      e.preventDefault();
      if (!blockRef) return;

      const selection = window.getSelection();
      isLocalChange.current = true;
      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        if (!blockRef.contains(range.commonAncestorContainer)) {
          // ?????
          isLocalChange.current = false;
          return;
        }

        const startOffset = getTextOffset(blockRef, range.startContainer, range.startOffset);
        const endOffset = getTextOffset(blockRef, range.endContainer, range.endOffset);

        // 선택된 범위의 문자들을 역순으로 삭제
        for (let i = endOffset - 1; i >= startOffset; i--) {
          const operationNode = block.crdt.localDelete(i, block.id, pageId);
          sendCharDeleteOperation(operationNode);
        }
      }

      const customData = e.clipboardData.getData("application/x-nocta-formatted");

      if (customData) {
        const { metadata } = JSON.parse(customData);
        const caretPosition = block.crdt.currentCaret;

        metadata.forEach((char: ClipboardMetadata, index: number) => {
          const insertPosition = caretPosition + index;
          const charNode = block.crdt.localInsert(
            insertPosition,
            char.value,
            block.id,
            pageId,
            char.style,
            char.color,
            char.backgroundColor,
          );
          sendCharInsertOperation({
            type: "charInsert",
            node: charNode.node,
            blockId: block.id,
            pageId,
            style: char.style,
            color: char.color,
            backgroundColor: char.backgroundColor,
          });
        });

        editorCRDT.currentBlock!.crdt.currentCaret = caretPosition + metadata.length;
      } else {
        const text = e.clipboardData.getData("text/plain");
        if (!block || text.length === 0) return;

        const caretPosition = block.crdt.currentCaret;

        if (text.includes("\n")) {
          let currentBlockIndex = editorCRDT.LinkedList.spread().findIndex(
            (b) => b.id === block.id,
          );
          const textList = text.split("\n");
          textList.forEach((line, index) => {
            console.log(line);
            if (index === 0) {
              line.split("").forEach((char, index) => {
                const charNode = block.crdt.localInsert(index, char, block.id, pageId);
                sendCharInsertOperation({
                  type: "charInsert",
                  node: charNode.node,
                  blockId: block.id,
                  pageId,
                });
              });
              const isMarkdownGrammer = checkMarkdownPattern(line);
              if (isMarkdownGrammer && block.type === "p") {
                block.type = isMarkdownGrammer.type;
                sendBlockUpdateOperation(editorCRDT.localUpdate(block, pageId));
                for (let i = 0; i < isMarkdownGrammer.length; i++) {
                  sendCharDeleteOperation(block.crdt.localDelete(0, block.id, pageId));
                }
              }
            } else {
              const newBlock = editorCRDT.localInsert(currentBlockIndex, "");
              sendBlockInsertOperation({
                type: "blockInsert",
                node: newBlock.node,
                pageId,
              });
              line.split("").forEach((char, index) => {
                sendCharInsertOperation(
                  newBlock.node.crdt.localInsert(index, char, newBlock.node.id, pageId),
                );
              });
              const isMarkdownGrammer = checkMarkdownPattern(line);
              if (isMarkdownGrammer && newBlock.node.type === "p") {
                newBlock.node.type = isMarkdownGrammer.type;
                sendBlockUpdateOperation(editorCRDT.localUpdate(newBlock.node, pageId));
                for (let i = 0; i < isMarkdownGrammer.length; i++) {
                  sendCharDeleteOperation(
                    newBlock.node.crdt.localDelete(0, newBlock.node.id, pageId),
                  );
                }
              }
            }
            currentBlockIndex += 1;
          });
        } else {
          // 텍스트를 한 글자씩 순차적으로 삽입
          text.split("").forEach((char, index) => {
            const insertPosition = caretPosition + index;
            const charNode = block.crdt.localInsert(insertPosition, char, block.id, pageId);
            sendCharInsertOperation({
              type: "charInsert",
              node: charNode.node,
              blockId: block.id,
              pageId,
            });
          });
          // 캐럿 위치 업데이트
          editorCRDT.currentBlock!.crdt.currentCaret = caretPosition + text.length;
        }
      }

      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
      });
    },
    [],
  );

  return { handleCopy, handlePaste };
};
