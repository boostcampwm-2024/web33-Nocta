import { PageIconType, serializedEditorDataProps } from "@noctaCrdt/Interfaces";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Editor } from "@features/editor/Editor";
import { Page as PageType } from "@src/types/page";
import { pageContainer, pageHeader, resizeHandles } from "./Page.style";
import { PageControlButton } from "./components/PageControlButton/PageControlButton";
import { PageTitle } from "./components/PageTitle/PageTitle";
import { DIRECTIONS, usePage } from "./hooks/usePage";

interface PageProps extends PageType {
  handlePageSelect: ({ pageId, isSidebar }: { pageId: string; isSidebar?: boolean }) => void;
  handlePageClose: (pageId: string) => void;
  handleTitleChange: (
    pageId: string,
    updates: { title?: string; icon?: PageIconType },
    syncWithServer: boolean,
  ) => void;
  serializedEditorData: serializedEditorDataProps | null;
}

export const Page = ({
  id,
  x,
  y,
  title,
  zIndex,
  icon,
  isActive,
  handlePageSelect,
  handlePageClose,
  handleTitleChange,
  serializedEditorData,
}: PageProps) => {
  const { position, size, isMaximized, pageDrag, pageResize, pageMinimize, pageMaximize } = usePage(
    { x, y },
  );
  const [serializedEditorDatas, setSerializedEditorDatas] =
    useState<serializedEditorDataProps | null>(serializedEditorData);

  const onTitleChange = (newTitle: string, syncWithServer: boolean) => {
    if (syncWithServer) {
      handleTitleChange(id, { title: newTitle }, true);
    } else {
      handleTitleChange(id, { title: newTitle }, false);
    }
  };

  const handlePageClick = () => {
    if (!isActive) {
      handlePageSelect({ pageId: id });
    }
  };

  // serializedEditorData prop이 변경되면 local state도 업데이트
  useEffect(() => {
    setSerializedEditorDatas(serializedEditorData);
  }, [serializedEditorData]);

  if (!serializedEditorDatas) {
    return null;
  }
  return (
    <AnimatePresence>
      <div
        id={id}
        className={pageContainer}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          transform: `translate(${position.x}px, ${position.y}px)`,
          zIndex,
        }}
        onPointerDown={handlePageClick}
      >
        <div className={pageHeader} onPointerDown={pageDrag} onClick={handlePageClick}>
          <PageTitle title={title} icon={icon} />
          <PageControlButton
            isMaximized={isMaximized}
            onPageClose={() => handlePageClose(id)}
            onPageMaximize={pageMaximize}
            onPageMinimize={pageMinimize}
          />
        </div>
        <Editor
          onTitleChange={onTitleChange}
          pageId={id}
          pageTitle={title}
          serializedEditorData={serializedEditorDatas}
        />
        {DIRECTIONS.map((direction) => (
          <motion.div
            key={direction}
            className={resizeHandles[direction]}
            onMouseDown={(e) => pageResize(e, direction)}
          />
        ))}
      </div>
    </AnimatePresence>
  );
};
