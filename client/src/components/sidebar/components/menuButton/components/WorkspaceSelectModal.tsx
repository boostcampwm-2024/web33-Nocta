import { motion } from "framer-motion";
import { useRef, useEffect, useState, useMemo } from "react";
import { SIDE_BAR } from "@constants/size";
import { useSocketStore } from "@src/stores/useSocketStore";
import {
  workspaceListContainer,
  workspaceModalContainer,
  textBox,
} from "./WorkspaceSelectModal.style";
import { InviteButton } from "./components/InviteButton";
import { WorkspaceSelectItem } from "./components/WorkspaceSelectItem";

interface WorkspaceSelectModalProps {
  isOpen: boolean;
  userName: string | null;
  onInviteClick: () => void;
}

export const WorkspaceSelectModal = ({
  isOpen,
  userName,
  onInviteClick,
}: WorkspaceSelectModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const availableWorkspaces = useSocketStore((state) => state.availableWorkspaces);
  const workspaceConnections = useSocketStore((state) => state.workspaceConnections);
  const workspacesWithActiveUsers = useMemo(
    () =>
      availableWorkspaces.map((workspace) => ({
        ...workspace,
        activeUsers: workspaceConnections[workspace.id] || 0,
      })),
    [availableWorkspaces, workspaceConnections],
  );
  const [workspaces, setWorkspaces] = useState(workspacesWithActiveUsers);

  const informText = userName
    ? availableWorkspaces.length > 0
      ? ""
      : "접속할 수 있는 워크스페이스가 없습니다."
    : `다른 워크스페이스 기능은\n 회원전용 입니다`;

  useEffect(() => {
    setWorkspaces(workspacesWithActiveUsers);
  }, [availableWorkspaces, workspacesWithActiveUsers]); // availableWorkspaces가 변경될 때마다 실행

  return (
    <motion.div
      ref={modalRef}
      className={workspaceModalContainer}
      initial={{ opacity: 0, y: -20 }}
      animate={{
        opacity: isOpen ? 1 : 0,
        y: isOpen ? 0 : -20,
      }}
      transition={{ duration: 0.2 }}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        left: -1,
        width: SIDE_BAR.WIDTH,
        zIndex: 20,
        pointerEvents: isOpen ? "auto" : "none",
        display: isOpen ? "block" : "none",
      }}
    >
      <div className={workspaceListContainer}>
        {userName && workspaces.length > 0 ? (
          <>
            {workspaces.map((workspace) => (
              <WorkspaceSelectItem key={workspace.id} userName={userName} {...workspace} />
            ))}
            <InviteButton onClick={onInviteClick} />
          </>
        ) : (
          <p className={textBox}>{informText}</p>
        )}
      </div>
    </motion.div>
  );
};
