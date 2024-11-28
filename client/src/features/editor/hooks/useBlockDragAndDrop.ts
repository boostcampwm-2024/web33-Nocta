// hooks/useBlockDragAndDrop.ts
import { DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { useSocketStore } from "@src/stores/useSocketStore.ts";
import { EditorStateProps } from "../Editor";

interface UseBlockDragAndDropProps {
  editorCRDT: EditorCRDT;
  editorState: EditorStateProps;
  setEditorState: React.Dispatch<React.SetStateAction<EditorStateProps>>;
  pageId: string;
}

export const useBlockDragAndDrop = ({
  editorCRDT,
  editorState,
  setEditorState,
  pageId,
}: UseBlockDragAndDropProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const { sendBlockReorderOperation } = useSocketStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    try {
      const nodes = editorState.linkedList.spread();

      // ID 문자열에서 client와 clock 추출
      const parseNodeId = (idString: string): { client: number; clock: number } => {
        const [client, clock] = idString.split("-").map(Number);
        return { client, clock };
      };

      // 파싱된 ID 정보로 실제 노드 찾기
      const targetInfo = parseNodeId(active.id as string);
      const overInfo = parseNodeId(over.id as string);

      // 기존 블록의 ID로 노드 찾기
      const targetNode = nodes.find(
        (block) => block.id.client === targetInfo.client && block.id.clock === targetInfo.clock,
      );
      const overNode = nodes.find(
        (block) => block.id.client === overInfo.client && block.id.clock === overInfo.clock,
      );

      if (!targetNode || !overNode) {
        throw new Error("Unable to find target or destination node");
      }

      const targetIndex = nodes.indexOf(targetNode);
      const overIndex = nodes.indexOf(overNode);

      // 드래그 방향 결정
      const isMoveDown = targetIndex < overIndex;

      // 드래그 방향에 따라 beforeNode와 afterNode 결정
      let beforeNode;
      let afterNode;

      if (isMoveDown) {
        // 아래로 드래그할 때
        beforeNode = overNode;
        afterNode = overIndex < nodes.length - 1 ? nodes[overIndex + 1] : null;
      } else {
        // 위로 드래그할 때
        beforeNode = overIndex > 0 ? nodes[overIndex - 1] : null;
        afterNode = overNode;
      }

      // EditorCRDT의 현재 상태로 작업
      const operation = editorCRDT.localReorder({
        targetId: targetNode.id,
        beforeId: beforeNode?.id || null,
        afterId: afterNode?.id || null,
        pageId,
      });

      sendBlockReorderOperation(operation);

      // EditorState 업데이트
      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
      });
    } catch (error) {
      console.error("Failed to reorder blocks:", error);
    }
  };

  return {
    sensors,
    handleDragEnd,
  };
};
