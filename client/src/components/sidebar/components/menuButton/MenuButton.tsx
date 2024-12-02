import { useState, useEffect } from "react";
import { InviteModal } from "@src/components/modal/InviteModal";
import { useModal } from "@src/components/modal/useModal";
import { useSocketStore } from "@src/stores/useSocketStore";
import { useToastStore } from "@src/stores/useToastStore";
import { useWorkspaceStore } from "@src/stores/useWorkspaceStore";
import { useUserInfo } from "@stores/useUserStore";
import {
  menuItemWrapper,
  textBox,
  menuButtonContainer,
  // userCount,
  // currentWorkspaceNameBox,
  // workspaceInfo,
  // workspaceRole,
  // nameWrapper,
} from "./MenuButton.style";
import { MenuIcon } from "./components/MenuIcon";
import { WorkspaceSelectModal } from "./components/WorkspaceSelectModal";

export const MenuButton = () => {
  const { name } = useUserInfo();
  const [isOpen, setIsOpen] = useState(false);
  const { socket, workspace } = useSocketStore();
  const { addToast } = useToastStore();
  const currentRole = useWorkspaceStore((state) => state.currentRole);
  // const currentWorkspaceName = useWorkspaceStore((state) => state.currentWorkspaceName);
  // const currentActiveUsers = useWorkspaceStore((state) => state.currentActiveUsers);
  // const currentMemberCount = useWorkspaceStore((state) => state.currentMemberCount);
  const {
    isOpen: isInviteModalOpen,
    openModal: openInviteModal,
    closeModal: closeInviteModal,
  } = useModal();
  const handleMenuClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleClickOutside = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(`.menu_button_container`)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    // 초대 성공 응답 수신
    socket.on(
      "invite/workspace/success",
      (data: { email: string; workspaceId: string; message: string }) => {
        addToast(data.message);
        closeInviteModal();
      },
    );

    // 초대 실패 응답 수신
    socket.on(
      "invite/workspace/fail",
      (data: { email: string; workspaceId: string; message: string }) => {
        addToast(data.message);
        closeInviteModal();
      },
    );

    // 초대 받은 경우 수신
    socket.on(
      "workspace/invited",
      (data: { workspaceId: string; invitedBy: string; message: string }) => {
        addToast(data.message);
      },
    );

    return () => {
      socket.off("invite/workspace/success");
      socket.off("invite/workspace/fail");
      socket.off("workspace/invited");
    };
  }, [socket]);

  const handleInvite = (email: string) => {
    if (!socket || !workspace?.id) return;

    socket.emit("invite/workspace", {
      email,
      workspaceId: workspace.id,
    });
  };

  const handleInviteModal = () => {
    if (isInviteModalOpen) return;
    if (currentRole === "editor") {
      addToast("Editor 권한으로는 초대할 수 없습니다.");
      return;
    }
    openInviteModal();
  };

  return (
    <>
      <button
        className={`${menuButtonContainer} menu_button_container`}
        onClick={handleMenuClick}
        data-onboarding="menu-button"
      >
        <button className={menuItemWrapper}>
          <MenuIcon />
          <p className={textBox}>{name ?? "Nocta"}</p>
          {/* <div className={nameWrapper}>
            {currentWorkspaceName && currentRole && (
              <div className={workspaceInfo}>
                <span className={currentWorkspaceNameBox}>{currentWorkspaceName}</span>
                <span className={workspaceRole}>{currentRole}</span>
              </div>
            )}
          </div> */}
        </button>
        <WorkspaceSelectModal isOpen={isOpen} userName={name} onInviteClick={handleInviteModal} />
        <InviteModal
          isOpen={isInviteModalOpen}
          onClose={closeInviteModal}
          onInvite={handleInvite}
        />
      </button>
    </>
  );
};
