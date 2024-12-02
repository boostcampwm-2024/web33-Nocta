import Plus from "@assets/icons/plusIcon.svg?react";
import { inviteButtonStyle } from "./InviteButton.style";

interface InviteButtonProps {
  onClick: () => void;
}

export const InviteButton = ({ onClick }: InviteButtonProps) => {
  return (
    <button onClick={onClick} className={inviteButtonStyle}>
      <Plus />
      <span>워크스페이스 초대하기</span>
    </button>
  );
};
