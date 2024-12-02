// InviteModal.tsx
import { useState, useEffect, useRef } from "react";
import { modalContentContainer, titleText, descriptionText, emailInput } from "./InviteModal.style";
import { Modal } from "./modal";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string) => void;
}

export const InviteModal = ({ isOpen, onClose, onInvite }: InviteModalProps) => {
  const [email, setEmail] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleInvite = () => {
    onInvite(email);
    setEmail("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      primaryButtonLabel="초대하기"
      primaryButtonOnClick={handleInvite}
      secondaryButtonLabel="취소"
      secondaryButtonOnClick={onClose}
    >
      <div className={modalContentContainer}>
        <h2 className={titleText}>워크스페이스 초대</h2>
        <p className={descriptionText}>초대할 사용자의 이메일을 입력해주세요</p>
        <input
          ref={inputRef}
          className={emailInput}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 주소 입력"
          type="email"
          value={email}
        />
      </div>
    </Modal>
  );
};
