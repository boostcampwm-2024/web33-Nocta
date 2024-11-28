import { PageIconType } from "@noctaCrdt/Interfaces";
import { useState } from "react";
import CloseIcon from "@assets/icons/close.svg?react";
import { useModal } from "@src/components/modal/useModal";
import { PageIconButton } from "../pageIconButton/PageIconButton";
import { PageIconModal } from "../pageIconButton/PageIconModal";
import { pageItemContainer, textBox, deleteBox } from "./PageItem.style";

interface PageItemProps {
  id: string;
  title: string;
  icon: PageIconType;
  onClick: () => void;
  onDelete?: (id: string) => void; // 추가: 삭제 핸들러
  handleIconUpdate: (
    pageId: string,
    updates: { title?: string; icon?: PageIconType },
    syncWithServer: boolean,
  ) => void;
}

export const PageItem = ({
  id,
  icon,
  title,
  onClick,
  onDelete,
  handleIconUpdate,
}: PageItemProps) => {
  const { isOpen, openModal, closeModal } = useModal();
  const [pageIcon, setPageIcon] = useState<PageIconType>(icon);
  // 삭제 버튼 클릭 핸들러
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // 상위 요소로의 이벤트 전파 중단
    onDelete?.(id);
  };

  const handleToggleModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      closeModal();
    } else {
      openModal();
    }
  };

  const handleCloseModal = (e: React.MouseEvent) => {
    closeModal();
    e.stopPropagation();
  };

  const handleSelectIcon = (e: React.MouseEvent, type: PageIconType) => {
    e.stopPropagation();
    setPageIcon(type);
    handleIconUpdate(id, { icon: type }, true);
    closeModal();
  };

  return (
    <div className={pageItemContainer} onClick={onClick}>
      <PageIconButton type={pageIcon ?? "Docs"} onClick={handleToggleModal} />
      <span className={textBox}>{title || "새로운 페이지"}</span>
      <span className={`delete_box ${deleteBox}`} onClick={handleDelete}>
        <CloseIcon width={16} height={16} />
      </span>
      {isOpen && (
        <PageIconModal
          isOpen={isOpen}
          onClose={handleCloseModal}
          onSelect={handleSelectIcon}
          currentType={pageIcon}
        />
      )}
    </div>
  );
};
