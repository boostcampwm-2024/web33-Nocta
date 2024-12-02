import { DragEndEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { Block } from "@noctaCrdt/Node";
import {
  RemoteBlockReorderOperation,
  RemoteBlockUpdateOperation,
} from "node_modules/@noctaCrdt/Interfaces";
import { useSocketStore } from "@src/stores/useSocketStore.ts";
import { EditorStateProps } from "../Editor";

interface UseBlockDragAndDropProps {
  editorCRDT: EditorCRDT;
  editorState: EditorStateProps;
  setEditorState: React.Dispatch<React.SetStateAction<EditorStateProps>>;
  pageId: string;
  isLocalChange: React.MutableRefObject<boolean>;
}

export const useBlockDragAndDrop = ({
  editorCRDT,
  editorState,
  setEditorState,
  pageId,
  isLocalChange,
}: UseBlockDragAndDropProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const { sendBlockReorderOperation, sendBlockUpdateOperation } = useSocketStore();

  const getBlocksToMove = (nodes: Block[], parentIndex: number, parentIndent: number): Block[] => {
    const blocksToMove = [];
    let i = parentIndex + 1;

    // 자식 블록들 찾기
    while (i < nodes.length && nodes[i].indent > parentIndent) {
      blocksToMove.push(nodes[i]);
      i += 1;
    }

    return blocksToMove;
  };

  const reorderBlocksWithChildren = (
    nodes: Block[],
    targetNode: Block,
    beforeNode: Block | null,
    afterNode: Block | null,
  ) => {
    const operations = [];
    const targetIndex = nodes.indexOf(targetNode);
    const childBlocks = getBlocksToMove(nodes, targetIndex, targetNode.indent);

    // 이동할 위치의 부모 블록 indent 찾기
    let newIndent = 0;
    if (beforeNode) {
      // 앞 블록이 있는 경우, 그 블록의 indent를 기준으로
      newIndent = beforeNode.indent;
    } else if (afterNode) {
      // 뒤 블록이 있는 경우, 그 블록의 indent를 기준으로
      newIndent = afterNode.indent;
    }

    // indent 변화량 계산 -> 추후 자식 블록들에 indentDiff만큼 적용
    const indentDiff = newIndent - targetNode.indent;
    // 타겟 블록 업데이트
    targetNode.indent = newIndent;

    // 타겟 블록의 reorder 연산 처리
    const targetReorderOp = editorCRDT.localReorder({
      targetId: targetNode.id,
      beforeId: beforeNode?.id || null,
      afterId: afterNode?.id || null,
      pageId,
    });
    operations.push({ type: "reorder", operation: targetReorderOp });

    // Update 연산 (indent 갱신)
    const targetUpdateOp = editorCRDT.localUpdate(targetNode, pageId);
    operations.push({ type: "update", operation: targetUpdateOp });

    // 자식 블록들 처리
    let prevBlock = targetNode;
    childBlocks.forEach((childBlock, index) => {
      const childNewIndent = Math.max(0, childBlock.indent + indentDiff);
      childBlock.indent = childNewIndent;

      // 마지막일 경우 after Id를 afterNode 로 설정
      const childReorderOp = editorCRDT.localReorder({
        targetId: childBlock.id,
        beforeId: prevBlock.id,
        afterId: afterNode && index === childBlocks.length - 1 ? afterNode?.id : null,
        pageId,
      });
      operations.push({ type: "reorder", operation: childReorderOp });

      const childUpdateOp = editorCRDT.localUpdate(childBlock, pageId);
      operations.push({ type: "update", operation: childUpdateOp });

      prevBlock = childBlock;
    });

    return operations;
  };

  const handleDragEnd = (
    event: DragEndEvent,
    dragBlockList: string[],
    initDraggingBlock: () => void,
  ) => {
    // 커서 다시 원래대로
    document.body.style.cursor = "auto";
    initDraggingBlock();

    const { active, over } = event;
    if (!over) return;

    // 지금 놓으려는 블록(over)이 드래깅 중인 블록이거나, 드래깅 중인 블록의 자식 블록이면 무시
    const disableDrag = dragBlockList.some((item) => item === over.data.current?.id);
    if (disableDrag) return;

    try {
      isLocalChange.current = true;
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

      if (!targetNode || !overNode) return;

      // 드래그 방향에 따라 beforeNode와 afterNode 결정
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
      const operations = reorderBlocksWithChildren(nodes, targetNode, beforeNode, afterNode);

      // 각 operation type에 따라 함수 호출 (reorder + update(indent 갱신))
      operations.forEach((op) => {
        if (op.type === "reorder") {
          sendBlockReorderOperation(op.operation as RemoteBlockReorderOperation);
        } else if (op.type === "update") {
          sendBlockUpdateOperation(op.operation as RemoteBlockUpdateOperation);
        }
      });

      setEditorState({
        clock: editorCRDT.clock,
        linkedList: editorCRDT.LinkedList,
      });
    } catch (error) {
      console.error("Failed to reorder blocks:", error);
    }
  };

  const handleDragStart = (
    event: DragStartEvent,
    setDragBlockList: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    document.body.style.cursor = "grabbing";
    const { active } = event;
    const parentId = active.data.current?.id;
    const parentIndent = active.data.current?.block.indent;

    if (!parentId) return;

    const findChildBlocks = (parentId: string) => {
      const blocks = editorState.linkedList.spread();
      const parentIndex = blocks.findIndex(
        (block) => `${block.id.client}-${block.id.clock}` === parentId,
      );

      if (parentIndex === -1) return [];
      isLocalChange.current = true;

      const childBlockIds = [];

      for (let i = parentIndex + 1; i < blocks.length; i++) {
        if (blocks[i].indent > parentIndent) {
          childBlockIds.push(`${blocks[i].id.client}-${blocks[i].id.clock}`);
        } else {
          break;
        }
      }

      return childBlockIds;
    };

    const childBlockIds = findChildBlocks(parentId);
    setDragBlockList([parentId, ...childBlockIds]);
  };

  return {
    sensors,
    handleDragEnd,
    handleDragStart,
  };
};
