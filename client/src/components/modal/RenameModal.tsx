import { useState } from "react";
import { container, title, input } from "./RenameModal.style";
import { Modal } from "./modal";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => void;
  currentName: string;
}

export const RenameModal = ({ isOpen, onClose, onRename, currentName }: RenameModalProps) => {
  const [name, setName] = useState(currentName);

  const handleRename = () => {
    if (name.trim()) {
      onRename(name);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      primaryButtonLabel="변경하기"
      primaryButtonOnClick={handleRename}
      secondaryButtonLabel="취소"
      secondaryButtonOnClick={onClose}
    >
      <div className={container}>
        <h2 className={title}>워크스페이스 이름 변경</h2>
        <input
          className={input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="새로운 워크스페이스 이름"
        />
      </div>
    </Modal>
  );
};
