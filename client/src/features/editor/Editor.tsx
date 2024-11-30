import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { EditorCRDT } from "@noctaCrdt/Crdt";
import { BlockLinkedList } from "@noctaCrdt/LinkedList";
import { Block as CRDTBlock, Char } from "@noctaCrdt/Node";
import { serializedEditorDataProps } from "node_modules/@noctaCrdt/Interfaces.ts";
import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useSocketStore } from "@src/stores/useSocketStore.ts";
import { setCaretPosition, getAbsoluteCaretPosition } from "@src/utils/caretUtils.ts";
import {
  editorContainer,
  editorTitleContainer,
  editorTitle,
  addNewBlockButton,
} from "./Editor.style";
import { Block } from "./components/block/Block";
import { useBlockDragAndDrop } from "./hooks/useBlockDragAndDrop";
import { useBlockOperation } from "./hooks/useBlockOperation.ts";
import { useBlockOptionSelect } from "./hooks/useBlockOption";
import { useCopyAndPaste } from "./hooks/useCopyAndPaste.ts";
import { useEditorOperation } from "./hooks/useEditorOperation.ts";
import { useMarkdownGrammer } from "./hooks/useMarkdownGrammer";
import { useTextOptionSelect } from "./hooks/useTextOptions.ts";

export interface EditorStateProps {
  clock: number;
  linkedList: BlockLinkedList;
}

interface EditorProps {
  onTitleChange: (title: string, syncWithServer: boolean) => void;
  pageId: string;
  serializedEditorData: serializedEditorDataProps;
  pageTitle: string;
}

export const Editor = ({ onTitleChange, pageId, pageTitle, serializedEditorData }: EditorProps) => {
  const {
    sendCharInsertOperation,
    sendCharDeleteOperation,
    subscribeToRemoteOperations,
    sendBlockInsertOperation,
    sendBlockDeleteOperation,
    sendBlockUpdateOperation,
  } = useSocketStore();
  const { clientId } = useSocketStore();
  const [displayTitle, setDisplayTitle] = useState(pageTitle);
  const [dragBlockList, setDragBlockList] = useState<string[]>([]);

  useEffect(() => {
    if (pageTitle === "새로운 페이지" || pageTitle === "") {
      setDisplayTitle("");
    } else {
      setDisplayTitle(pageTitle);
    }
  }, [pageTitle]);

  const editorCRDTInstance = useMemo(() => {
    let newEditorCRDT;
    if (serializedEditorData) {
      newEditorCRDT = new EditorCRDT(serializedEditorData.client);
      newEditorCRDT.deserialize(serializedEditorData);
    } else {
      newEditorCRDT = new EditorCRDT(clientId ? clientId : 0);
    }
    return newEditorCRDT;
  }, [serializedEditorData, clientId]);

  const editorCRDT = useRef<EditorCRDT>(editorCRDTInstance);
  const isLocalChange = useRef(false);
  const isSameLocalChange = useRef(false);
  const composingCaret = useRef<number | null>(null);

  // editorState도 editorCRDT가 변경될 때마다 업데이트
  const [editorState, setEditorState] = useState<EditorStateProps>({
    clock: editorCRDT.current.clock,
    linkedList: editorCRDT.current.LinkedList,
  });

  const {
    handleRemoteBlockInsert,
    handleRemoteBlockDelete,
    handleRemoteCharInsert,
    handleRemoteCharDelete,
    handleRemoteBlockUpdate,
    handleRemoteBlockReorder,
    handleRemoteCharUpdate,
    handleRemoteCursor,
    addNewBlock,
  } = useEditorOperation({ editorCRDT, pageId, setEditorState, isSameLocalChange });

  const { sensors, handleDragEnd, handleDragStart } = useBlockDragAndDrop({
    editorCRDT: editorCRDT.current,
    editorState,
    setEditorState,
    pageId,
    isLocalChange,
  });

  const { handleTypeSelect, handleAnimationSelect, handleCopySelect, handleDeleteSelect } =
    useBlockOptionSelect({
      editorCRDT: editorCRDT.current,
      editorState,
      setEditorState,
      pageId,
      sendBlockUpdateOperation,
      sendBlockDeleteOperation,
      sendBlockInsertOperation,
      sendCharInsertOperation,
    });

  const { handleKeyDown: onKeyDown, handleInput: handleHrInput } = useMarkdownGrammer({
    editorCRDT: editorCRDT.current,
    editorState,
    setEditorState,
    pageId,
    sendBlockInsertOperation,
    sendBlockDeleteOperation,
    sendBlockUpdateOperation,
    sendCharDeleteOperation,
    sendCharInsertOperation,
  });

  const { handleBlockClick, handleBlockInput, handleKeyDown } = useBlockOperation({
    editorCRDT: editorCRDT.current,
    setEditorState,
    pageId,
    onKeyDown,
    handleHrInput,
    isLocalChange,
  });

  const { onTextStyleUpdate, onTextColorUpdate, onTextBackgroundColorUpdate } = useTextOptionSelect(
    {
      editorCRDT: editorCRDT.current,
      setEditorState,
      pageId,
      isLocalChange,
    },
  );

  const { handleCopy, handlePaste } = useCopyAndPaste({
    editorCRDT: editorCRDT.current,
    setEditorState,
    pageId,
    isLocalChange,
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setDisplayTitle(newTitle); // 로컬 상태 업데이트
    onTitleChange(newTitle, false); // 낙관적 업데이트
  };

  const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (newTitle === "") {
      setDisplayTitle(""); // 입력이 비어있으면 로컬상태는 빈 문자열로
    } else {
      onTitleChange(newTitle, true);
    }
  };

  const handleCompositionStart = (e: React.CompositionEvent<HTMLDivElement>, block: CRDTBlock) => {
    const currentText = e.data;
    composingCaret.current = getAbsoluteCaretPosition(e.currentTarget);
    block.crdt.localInsert(composingCaret.current, currentText, block.id, pageId);
  };

  const handleCompositionUpdate = (e: React.CompositionEvent<HTMLDivElement>, block: CRDTBlock) => {
    const currentText = e.data;
    if (composingCaret.current === null) return;
    const currentCaret = composingCaret.current;
    const currentCharNode = block.crdt.LinkedList.findByIndex(currentCaret);
    if (!currentCharNode) return;
    currentCharNode.value = currentText;
  };

  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLDivElement>, block: CRDTBlock) => {
      if (!editorCRDT) return;
      const event = e.nativeEvent as CompositionEvent;
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

      if (!composingCaret.current) return;
      const currentCaret = composingCaret.current;
      const currentCharNode = block.crdt.LinkedList.findByIndex(currentCaret);
      if (!currentCharNode) return;

      if (isMac) {
        const [character, space] = event.data;
        if (!character || !composingCaret.current) return;
        if (!currentCharNode) return;
        currentCharNode.value = character;
        sendCharInsertOperation({
          type: "charInsert",
          node: currentCharNode,
          blockId: block.id,
          pageId,
        });
        if (space) {
          const spaceNode = block.crdt.localInsert(currentCaret + 1, space, block.id, pageId);
          sendCharInsertOperation({
            type: "charInsert",
            node: spaceNode.node,
            blockId: block.id,
            pageId,
          });
        }
        block.crdt.currentCaret = currentCaret + 2;
      } else {
        // Windows의 경우
        const character = event.data;
        if (!character) return;

        currentCharNode.value = character;
        sendCharInsertOperation({
          type: "charInsert",
          node: currentCharNode,
          blockId: block.id,
          pageId,
        });
        sendCharInsertOperation(block.crdt.localInsert(currentCaret + 1, "", block.id, pageId));

        block.crdt.currentCaret = currentCaret;
      }

      composingCaret.current = null;
    },
    [editorCRDT, pageId, sendCharInsertOperation],
  );

  const subscriptionRef = useRef(false);

  useEffect(() => {
    if (!editorCRDT || !editorCRDT.current.currentBlock) return;

    const { activeElement } = document;
    if (activeElement?.tagName.toLowerCase() === "input") {
      return; // input에 포커스가 있으면 캐럿 위치 변경하지 않음
    }
    if (isLocalChange.current || isSameLocalChange.current) {
      setCaretPosition({
        blockId: editorCRDT.current.currentBlock.id,
        linkedList: editorCRDT.current.LinkedList,
        position: editorCRDT.current.currentBlock?.crdt.currentCaret,
        pageId,
      });
      isLocalChange.current = false;
      isSameLocalChange.current = false;
      return;
    }
    // 서윤님 피드백 반영
  }, [editorCRDT.current.currentBlock?.id.serialize()]);

  useEffect(() => {
    if (!editorCRDT) return;
    if (subscriptionRef.current) return;
    subscriptionRef.current = true;

    const unsubscribe = subscribeToRemoteOperations({
      onRemoteBlockInsert: handleRemoteBlockInsert,
      onRemoteBlockDelete: handleRemoteBlockDelete,
      onRemoteCharInsert: handleRemoteCharInsert,
      onRemoteCharDelete: handleRemoteCharDelete,
      onRemoteBlockUpdate: handleRemoteBlockUpdate,
      onRemoteBlockReorder: handleRemoteBlockReorder,
      onRemoteCharUpdate: handleRemoteCharUpdate,
      onRemoteCursor: handleRemoteCursor,
      onBatchOperations: (batch) => {
        for (const item of batch) {
          switch (item.event) {
            case "insert/block":
              handleRemoteBlockInsert(item.operation);
              break;
            case "delete/block":
              handleRemoteBlockDelete(item.operation);
              break;
            case "insert/char":
              handleRemoteCharInsert(item.operation);
              break;
            case "delete/char":
              handleRemoteCharDelete(item.operation);
              break;
            case "update/block":
              handleRemoteBlockUpdate(item.operation);
              break;
            case "reorder/block":
              handleRemoteBlockReorder(item.operation);
              break;
            case "update/char":
              handleRemoteCharUpdate(item.operation);
              break;
            default:
              console.warn("알 수 없는 연산 타입:", item.event);
          }
        }
      },
    });

    return () => {
      subscriptionRef.current = false;
      unsubscribe?.();
    };
  }, [
    editorCRDT,
    subscribeToRemoteOperations,
    pageId,
    handleRemoteBlockInsert,
    handleRemoteBlockDelete,
    handleRemoteCharInsert,
    handleRemoteCharDelete,
    handleRemoteBlockUpdate,
    handleRemoteBlockReorder,
    handleRemoteCharUpdate,
    handleRemoteCursor,
  ]);

  // 로딩 상태 체크
  if (!editorCRDT || !editorState) {
    return <div>Loading editor data...</div>;
  }
  return (
    <div className={editorContainer}>
      <div className={editorTitleContainer}>
        <input
          type="text"
          placeholder="제목을 입력하세요..."
          onChange={handleTitleChange}
          onBlur={handleBlur}
          value={displayTitle}
          className={editorTitle}
        />
        <div style={{ height: "36px" }}></div>
        <DndContext
          onDragEnd={(event: DragEndEvent) => {
            handleDragEnd(event, dragBlockList, () => setDragBlockList([]));
          }}
          onDragStart={(event) => {
            handleDragStart(event, setDragBlockList);
          }}
          sensors={sensors}
        >
          <SortableContext
            items={editorState.linkedList
              .spread()
              .map((block) => `${block.id.client}-${block.id.clock}`)}
            strategy={verticalListSortingStrategy}
          >
            {editorState.linkedList.spread().map((block) => (
              <Block
                key={`${block.id.client}-${block.id.clock}`}
                id={`${block.id.client}-${block.id.clock}`}
                block={block}
                isActive={block.id === editorCRDT.current.currentBlock?.id}
                onInput={handleBlockInput}
                onCompositionStart={handleCompositionStart}
                onCompositionUpdate={handleCompositionUpdate}
                onCompositionEnd={handleCompositionEnd}
                onKeyDown={handleKeyDown}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onClick={handleBlockClick}
                onAnimationSelect={handleAnimationSelect}
                onTypeSelect={handleTypeSelect}
                onCopySelect={handleCopySelect}
                onDeleteSelect={handleDeleteSelect}
                onTextStyleUpdate={onTextStyleUpdate}
                onTextColorUpdate={onTextColorUpdate}
                onTextBackgroundColorUpdate={onTextBackgroundColorUpdate}
                dragBlockList={dragBlockList}
              />
            ))}
          </SortableContext>
        </DndContext>
        {editorState.linkedList.spread().length === 0 && (
          <div className={addNewBlockButton} onClick={addNewBlock}>
            클릭해서 새로운 블록을 추가하세요
          </div>
        )}
      </div>
    </div>
  );
};
