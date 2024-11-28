import { EditorCRDT } from "@noctaCrdt/Crdt";
import {
  RemoteBlockDeleteOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
  RemoteBlockUpdateOperation,
  RemoteBlockReorderOperation,
  RemoteCharUpdateOperation,
  RemoteBlockInsertOperation,
} from "@noctaCrdt/Interfaces";
import { useCallback } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";
import { EditorStateProps } from "../Editor";

interface UseEditorOperationProps {
  editorCRDT: React.MutableRefObject<EditorCRDT>;
  pageId: string;
  setEditorState: (state: EditorStateProps) => void;
}

export const useEditorOperation = ({
  editorCRDT,
  pageId,
  setEditorState,
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
      if (prevBlock.type === "ol" && nextBlock.type === "ol") {
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
    (operation: RemoteCharInsertOperation) => {
      if (operation.pageId !== pageId) return;
      const targetBlock = editorCRDT.current.LinkedList.nodeMap[JSON.stringify(operation.blockId)];
      if (targetBlock) {
        targetBlock.crdt.remoteInsert(operation);
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
        targetBlock.crdt.remoteDelete(operation);
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
      if (prevBlock.type === "ol") {
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
    addNewBlock,
  };
};
