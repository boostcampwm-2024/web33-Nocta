import { serializedEditorDataProps } from "@noctaCrdt/Interfaces";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Editor } from "@features/editor/Editor";
import { useSocketStore } from "@src/stores/useSocketStore";
import { Page as PageType } from "@src/types/page";
import { pageAnimation, resizeHandleAnimation } from "./Page.animation";
import { pageContainer, pageHeader, resizeHandle } from "./Page.style";
import { PageControlButton } from "./components/PageControlButton/PageControlButton";
import { PageTitle } from "./components/PageTitle/PageTitle";
import { usePage } from "./hooks/usePage";

interface PageProps extends PageType {
  handlePageSelect: ({ pageId, isSidebar }: { pageId: string; isSidebar?: boolean }) => void;
  handlePageClose: (pageId: string) => void;
  handleTitleChange: (pageId: string, newTitle: string) => void;
  updatePageData: (pageId: string, newData: serializedEditorDataProps) => void;
  serializedEditorData: serializedEditorDataProps;
}

export const Page = ({
  id,
  x,
  y,
  title,
  zIndex,
  isActive,
  handlePageSelect,
  handlePageClose,
  handleTitleChange,
  updatePageData,
  serializedEditorData,
}: PageProps) => {
  const { position, size, pageDrag, pageResize, pageMinimize, pageMaximize } = usePage({ x, y });
  const [isLoading, setIsLoading] = useState(true);
  const [serializedEditorDatas, setSerializedEditorDatas] =
    useState<serializedEditorDataProps | null>(serializedEditorData);

  const onTitleChange = (newTitle: string) => {
    handleTitleChange(id, newTitle);
  };

  const handlePageClick = () => {
    if (!isActive) {
      handlePageSelect({ pageId: id });
    }
  };

  // serializedEditorData prop이 변경되면 local state도 업데이트
  useEffect(() => {
    setSerializedEditorDatas(serializedEditorData);
  }, [serializedEditorData, updatePageData]);

  useEffect(() => {
    const socketStore = useSocketStore.getState();
    if (!socketStore.socket) return;
    // 페이지 데이터 수신 핸들러
    const handlePageData = (data: { pageId: string; serializedPage: any }) => {
      if (data.pageId === id) {
        console.log("Received new editor data:", data);
        setSerializedEditorDatas(data.serializedPage.crdt);
        updatePageData(id, data.serializedPage.crdt);
        setIsLoading(false);
      }
    };
    socketStore.socket.on("join/page", handlePageData);
    socketStore.socket.emit("join/page", { pageId: id });

    return () => {
      if (socketStore.socket) {
        socketStore.socket.emit("leave/page", { pageId: id });
        socketStore.socket.off("join/page", handlePageData);
      }
    };
  }, [id, updatePageData]);

  if (isLoading || !serializedEditorDatas) {
    return <div>Loading page content...</div>;
  }
  return (
    <AnimatePresence>
      <motion.div
        className={pageContainer}
        initial={pageAnimation.initial}
        animate={pageAnimation.animate({
          x: position.x,
          y: position.y,
          isActive,
        })}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          zIndex,
        }}
        onPointerDown={handlePageClick}
      >
        <div className={pageHeader} onPointerDown={pageDrag} onClick={handlePageClick}>
          <PageTitle title={title} />
          <PageControlButton
            onPageClose={() => handlePageClose(id)}
            onPageMaximize={pageMaximize}
            onPageMinimize={pageMinimize}
          />
        </div>
        <Editor
          onTitleChange={onTitleChange}
          pageId={id}
          serializedEditorData={serializedEditorDatas}
        />
        <motion.div
          className={resizeHandle}
          onMouseDown={pageResize}
          whileHover={resizeHandleAnimation.whileHover}
        />
      </motion.div>
    </AnimatePresence>
  );
};
