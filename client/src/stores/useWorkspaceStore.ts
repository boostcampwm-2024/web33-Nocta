import { create } from "zustand";

// 워크스페이스 권한 타입 정의

interface WorkspaceStore {
  // 현재 선택된 워크스페이스의 권한
  currentRole: string | null;
  currentWorkspaceName: string | null;
  currentActiveUsers: number | null;
  currentMemberCount: number | null;
  setCurrentRole: (role: string | null) => void;
  setCurrentWorkspaceName: (name: string | null) => void;
  setCurrentActiveUsers: (count: number | null) => void;
  setCurrentMemberCount: (count: number | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  currentRole: null,
  setCurrentRole: (role) => set({ currentRole: role }),
  currentWorkspaceName: null,
  setCurrentWorkspaceName: (name) => set({ currentWorkspaceName: name }),
  currentActiveUsers: null,
  setCurrentActiveUsers: (count) => set({ currentActiveUsers: count }),
  currentMemberCount: null,
  setCurrentMemberCount: (count) => set({ currentMemberCount: count }),
}));
