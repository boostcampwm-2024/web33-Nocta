import { BlockCRDT, EditorCRDT } from "@noctaCrdt/Crdt";
import {
  AnimationType,
  ElementType,
  RemoteBlockDeleteOperation,
  RemoteBlockInsertOperation,
  RemoteBlockUpdateOperation,
  RemoteCharInsertOperation,
} from "@noctaCrdt/Interfaces";
import { Block } from "@noctaCrdt/Node";
import { BlockId } from "@noctaCrdt/NodeId";
import { BlockLinkedList } from "node_modules/@noctaCrdt/LinkedList";
import { EditorStateProps } from "../Editor";

interface useBlockOptionSelectProps {
  editorCRDT: EditorCRDT;
  editorState: EditorStateProps;
  setEditorState: React.Dispatch<
    React.SetStateAction<{
      clock: number;
      linkedList: BlockLinkedList;
    }>
  >;
  pageId: string;
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void;
  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => void;
  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => void;
  sendCharInsertOperation: (operation: RemoteCharInsertOperation) => void;
}

export const useBlockOptionSelect = ({
  editorCRDT,
  editorState,
  setEditorState,
  pageId,
  sendBlockUpdateOperation,
  sendBlockDeleteOperation,
  sendBlockInsertOperation,
  sendCharInsertOperation,
}: useBlockOptionSelectProps) => {
  const handleTypeSelect = (blockId: BlockId, type: ElementType) => {
    const block = editorState.linkedList.getNode(blockId);
    if (!block) return;

    block.type = type;
    editorCRDT.currentBlock = block;

    // block의 crdt 초기화. hr 은 문자 노드가 없기 때문에
    if (block.type === "hr") {
      block.crdt = new BlockCRDT(editorCRDT.client);
    }

    sendBlockUpdateOperation({
      type: "blockUpdate",
      node: block,
      pageId,
    });

    setEditorState({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
    });
  };

  const handleAnimationSelect = (blockId: BlockId, animation: AnimationType) => {
    const block = editorState.linkedList.getNode(blockId);
    if (!block) return;

    block.animation = animation;
    editorCRDT.currentBlock = block;
    editorCRDT.remoteUpdate(block, pageId);

    sendBlockUpdateOperation({
      type: "blockUpdate",
      node: block,
      pageId,
    });

    setEditorState({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
    });
  };

  const handleCopySelect = (blockId: BlockId) => {
    const currentBlock = editorState.linkedList.getNode(blockId);
    if (!currentBlock) return;

    const currentIndex = editorCRDT.LinkedList.spread().findIndex((block) =>
      block.id.equals(blockId),
    );

    const copyBlock = (block: Block, targetIndex: number) => {
      const operation = editorCRDT.localInsert(targetIndex, "");
      operation.node.type = block.type;
      operation.node.indent = block.indent;
      operation.node.animation = block.animation;
      operation.node.style = block.style;
      operation.node.icon = block.icon;
      operation.node.crdt = new BlockCRDT(editorCRDT.client);

      // 먼저 새로운 블록을 만들고
      sendBlockInsertOperation({ type: "blockInsert", node: operation.node, pageId });

      // 내부 문자 노드 복사
      block.crdt.LinkedList.spread().forEach((char, index) => {
        const insertOperation = operation.node.crdt.localInsert(
          index,
          char.value,
          operation.node.id,
          pageId,
        );
        sendCharInsertOperation(insertOperation);
      });

      // 여기서 update를 한번 더 해주면 된다. (block의 속성 (animation, type, style, icon)을 복사하기 위함)
      sendBlockUpdateOperation({
        type: "blockUpdate",
        node: operation.node,
        pageId,
      });

      return operation.node;
    };

    const childBlocks = editorCRDT.LinkedList.spread()
      .slice(currentIndex + 1)
      .filter((block) => block.indent > currentBlock.indent);

    let targetIndex = currentIndex + childBlocks.length + 1;
    const copiedParent = copyBlock(currentBlock, targetIndex);

    childBlocks.forEach((child) => {
      targetIndex += 1;
      copyBlock(child, targetIndex);
    });

    editorCRDT.currentBlock = copiedParent;
    editorCRDT.LinkedList.updateAllOrderedListIndices();
    setEditorState({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
    });
  };

  const findBlock = (linkedList: BlockLinkedList, index: number) => {
    if (index < 0) return null;
    if (index >= linkedList.spread().length) return null;
    return linkedList.findByIndex(index);
  };

  const handleDeleteSelect = (blockId: BlockId) => {
    const blocks = editorCRDT.LinkedList.spread(); // spread() 한 번만 호출
    const currentIndex = blocks.findIndex((block) => block.id.equals(blockId));

    const currentBlock = blocks[currentIndex];
    if (!currentBlock) return;

    const deleteIndices = [];
    const currentIndent = currentBlock.indent;

    // 현재 블록과 자식 블록들의 인덱스를 한 번에 수집
    for (let i = currentIndex; i < blocks.length; i++) {
      if (i === currentIndex || blocks[i].indent > currentIndent) {
        deleteIndices.push(i);
      } else if (blocks[i].indent <= currentIndent) {
        break; // 더 이상 자식 블록이 없으면 종료
      }
    }

    // 인덱스 역순으로 삭제
    for (let i = deleteIndices.length - 1; i >= 0; i--) {
      sendBlockDeleteOperation(editorCRDT.localDelete(deleteIndices[i], undefined, pageId));
    }

    // 삭제할 블록이 현재 활성화된 블록인 경우
    if (editorCRDT.currentBlock?.id.equals(blockId)) {
      // 다음 블록이나 이전 블록으로 currentBlock 설정
      // 서윤님 피드백 반영
      const nextBlock = findBlock(editorCRDT.LinkedList, currentIndex); // ✅ 이미 삭제한 후라, next는 currentIndex
      const prevBlock = findBlock(editorCRDT.LinkedList, currentIndex - 1); // ✅ 이미 삭제한 후라, prev는 currentIndex - 1
      editorCRDT.currentBlock = nextBlock || prevBlock || null;
    }

    // ol 노드의 index를 다시 설정
    editorCRDT.LinkedList.updateAllOrderedListIndices();

    setEditorState({
      clock: editorCRDT.clock,
      linkedList: editorCRDT.LinkedList,
    });
  };

  return {
    handleTypeSelect,
    handleAnimationSelect,
    handleCopySelect,
    handleDeleteSelect,
  };
};
