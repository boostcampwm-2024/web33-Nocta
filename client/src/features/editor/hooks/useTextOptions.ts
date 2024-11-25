import { EditorCRDT } from "@noctaCrdt/Crdt";
import { TextStyleType } from "@noctaCrdt/Interfaces";
import { Block, Char } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { useCallback } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";
import { EditorStateProps } from "../Editor";

interface UseTextOptionSelectProps {
  editorCRDT: EditorCRDT;
  setEditorState: React.Dispatch<React.SetStateAction<EditorStateProps>>;
  pageId: string;
}

export const useTextOptionSelect = ({
  editorCRDT,
  setEditorState,
  pageId,
}: UseTextOptionSelectProps) => {
  const { sendCharUpdateOperation } = useSocketStore();

  const handleStyleUpdate = useCallback(
    (styleType: TextStyleType, blockId: BlockId, nodes: Array<Char> | null) => {
      if (!nodes || nodes.length === 0) return;
      const block = editorCRDT.LinkedList.getNode(blockId) as Block;
      if (!block) return;

      // 선택된 범위의 모든 문자들의 현재 스타일 상태 확인
      const hasStyle = nodes.every((node) => {
        const char = block.crdt.LinkedList.getNode(node.id) as Char;
        return char && char.style.includes(styleType);
      });

      // 스타일을 추가할지 제거할지 결정 (토글 로직)
      const shouldAdd = !hasStyle;

      nodes.forEach((node) => {
        const char = block.crdt.LinkedList.getNode(node.id) as Char;
        if (!char) return;

        // 현재 스타일 복사
        const newStyles = [...char.style];

        if (shouldAdd) {
          // 스타일이 없는 경우에만 추가
          if (!newStyles.includes(styleType)) {
            newStyles.push(styleType);
          }
        } else {
          // 스타일이 있는 경우에만 제거
          const styleIndex = newStyles.indexOf(styleType);
          if (styleIndex !== -1) {
            newStyles.splice(styleIndex, 1);
          }
        }

        // 새로운 스타일 배열 할당
        char.style = newStyles;

        // 업데이트 및 전송
        block.crdt.localUpdate(char, node.id, pageId);
        sendCharUpdateOperation({
          node: char,
          blockId,
          pageId,
        });
      });

      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
      });
    },
    [pageId, sendCharUpdateOperation, editorCRDT],
  );

  return {
    onTextStyleUpdate: handleStyleUpdate,
  };
};
