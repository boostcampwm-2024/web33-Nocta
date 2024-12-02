import { EditorCRDT } from "@noctaCrdt/Crdt";
import {
  RemoteBlockDeleteOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
  RemoteBlockUpdateOperation,
  RemoteBlockReorderOperation,
  RemoteCharUpdateOperation,
  RemoteBlockInsertOperation,
  RemoteBlockCheckboxOperation,
} from "@noctaCrdt/Interfaces";
import { TextLinkedList } from "@noctaCrdt/LinkedList";
import { CharId } from "@noctaCrdt/NodeId";
import { useCallback } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";
import { EditorStateProps } from "../Editor";

interface UseEditorOperationProps {
  editorCRDT: React.MutableRefObject<EditorCRDT>;
  pageId: string;
  setEditorState: (state: EditorStateProps) => void;
  isSameLocalChange: React.MutableRefObject<boolean>;
}

const getPositionById = (linkedList: TextLinkedList, nodeId: CharId | null): number => {
  if (!nodeId) return 0;
  let position = 0;
  let current = linkedList.head;

  while (current) {
    if (current.equals(nodeId)) return position;
    position += 1;
    current = linkedList.getNode(current) ? linkedList.getNode(current)!.next : null;
  }
  return position;
};

export const useEditorOperation = ({
  editorCRDT,
  pageId,
  setEditorState,
  isSameLocalChange,
}: UseEditorOperationProps) => {
  const { sendBlockInsertOperation } = useSocketStore();
  const handleRemoteBlockInsert = useCallback(
    (operation: RemoteBlockInsertOperation) => {
      if (operation.pageId !== pageId) return;
      const prevBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.node.prev)];
      editorCRDT.current.remoteInsert(operation);
      if (prevBlock && prevBlock.type === "ol") {
        editorCRDT.current.LinkedList.updateAllOrderedListIndices();
      }
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [pageId, editorCRDT],
  );

  const handleRemoteBlockDelete = useCallback(
    (operation: RemoteBlockDeleteOperation) => {
      if (operation.pageId !== pageId) return;
      const targetBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.targetId)];
      const prevBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(targetBlock.prev)];
      const nextBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(targetBlock.next)];
      editorCRDT.current.remoteDelete(operation);
      if (prevBlock && prevBlock.type === "ol" && nextBlock.type === "ol") {
        editorCRDT.current.LinkedList.updateAllOrderedListIndices();
      }
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [pageId, editorCRDT],
  );

  const handleRemoteCharInsert = useCallback(
    // 원격으로 입력된 글자의 위치가 현재 캐럿의 위치보다 작을때만 캐럿을 1 증가시킨다.
    (operation: RemoteCharInsertOperation) => {
      if (operation.pageId !== pageId) return;
      const targetBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
      if (targetBlock) {
        if (targetBlock === editorCRDT.current.currentBlock) {
          isSameLocalChange.current = true;
        }
        const insertPosition = getPositionById(targetBlock.crdt.LinkedList, operation.node.prev);
        const { currentCaret } = targetBlock.crdt;
        targetBlock.crdt.remoteInsert(operation);
        if (editorCRDT.current.currentBlock === targetBlock && insertPosition < currentCaret) {
          editorCRDT.current.currentBlock.crdt.currentCaret += 1;
        }
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      }
    },
    [pageId, editorCRDT],
  );

  const handleRemoteCharDelete = useCallback(
    (operation: RemoteCharDeleteOperation) => {
      if (operation.pageId !== pageId) return;
      const targetBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
      if (targetBlock) {
        if (targetBlock === editorCRDT.current.currentBlock) {
          isSameLocalChange.current = true;
        }
        const deletePosition = getPositionById(targetBlock.crdt.LinkedList, operation.targetId);
        const { currentCaret } = targetBlock.crdt;
        targetBlock.crdt.remoteDelete(operation);
        if (editorCRDT.current.currentBlock === targetBlock && deletePosition < currentCaret) {
          editorCRDT.current.currentBlock.crdt.currentCaret -= 1;
        }
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      }
    },
    [pageId, editorCRDT],
  );

  const handleRemoteBlockUpdate = useCallback(
    (operation: RemoteBlockUpdateOperation) => {
      if (operation.pageId !== pageId) return;
      const prevBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.node.prev)];
      editorCRDT.current.remoteUpdate(operation.node, operation.pageId);
      if (prevBlock && prevBlock.type === "ol") {
        editorCRDT.current.LinkedList.updateAllOrderedListIndices();
      }
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [pageId, editorCRDT],
  );

  const handleRemoteBlockReorder = useCallback(
    (operation: RemoteBlockReorderOperation) => {
      if (operation.pageId !== pageId) return;
      editorCRDT.current.remoteReorder(operation);
      editorCRDT.current.LinkedList.updateAllOrderedListIndices();
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [pageId, editorCRDT],
  );

  const handleRemoteBlockCheckbox = useCallback(
    (operation: RemoteBlockCheckboxOperation) => {
      if (operation.pageId !== pageId) return;
      const targetBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
      if (targetBlock) {
        targetBlock.isChecked = operation.isChecked;
        setEditorState({
          clock: editorCRDT.current.clock,
          linkedList: editorCRDT.current.LinkedList,
        });
      }
    },
    [pageId, editorCRDT],
  );

  const handleRemoteCharUpdate = useCallback(
    (operation: RemoteCharUpdateOperation) => {
      if (!editorCRDT) return;
      if (operation.pageId !== pageId) return;
      const targetBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
      targetBlock.crdt.remoteUpdate(operation);
      setEditorState({
        clock: editorCRDT.current.clock,
        linkedList: editorCRDT.current.LinkedList,
      });
    },
    [pageId, editorCRDT],
  );

  const handleRemoteCursor = useCallback((position: any) => {
    console.log(position, "커서위치 수신");
  }, []);

  const addNewBlock = () => {
    if (!editorCRDT) return;
    const index = editorCRDT.current.LinkedList.spread().length;
    const operation = editorCRDT.current.localInsert(index, "");
    editorCRDT.current.currentBlock = operation.node;
    sendBlockInsertOperation({ type: "blockInsert", node: operation.node, pageId });
    setEditorState({
      clock: editorCRDT.current.clock,
      linkedList: editorCRDT.current.LinkedList,
    });
  };

  return {
    handleRemoteBlockInsert,
    handleRemoteBlockDelete,
    handleRemoteCharInsert,
    handleRemoteCharDelete,
    handleRemoteBlockUpdate,
    handleRemoteBlockReorder,
    handleRemoteCharUpdate,
    handleRemoteCursor,
    handleRemoteBlockCheckbox,
    addNewBlock,
  };
};
