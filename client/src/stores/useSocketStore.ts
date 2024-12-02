import {
  RemotePageCreateOperation,
  RemoteBlockInsertOperation,
  RemoteBlockDeleteOperation,
  RemoteCharInsertOperation,
  RemoteCharDeleteOperation,
  RemoteBlockUpdateOperation,
  RemoteBlockReorderOperation,
  RemoteBlockCheckboxOperation,
  RemoteCharUpdateOperation,
  RemotePageDeleteOperation,
  RemotePageUpdateOperation,
  CursorPosition,
  WorkSpaceSerializedProps,
  WorkspaceListItem,
} from "@noctaCrdt/Interfaces";
import { io, Socket } from "socket.io-client";
import { create } from "zustand";
import { useToastStore } from "./useToastStore";
import { useWorkspaceStore } from "./useWorkspaceStore";

class BatchProcessor {
  private batch: any[] = [];
  private batchTimeout: number;
  private batchTimer: any;
  private sendBatchCallback: (batch: any[]) => void;

  constructor(sendBatchCallback: (batch: any[]) => void, batchTimeout: number = 500) {
    this.sendBatchCallback = sendBatchCallback;
    this.batchTimeout = batchTimeout;
  }

  addOperation(operation: any) {
    this.batch.push(operation);
    if (!this.batchTimer) {
      this.startBatchTimer();
    }
  }

  private startBatchTimer() {
    this.batchTimer = setTimeout(() => {
      this.executeBatch();
    }, this.batchTimeout);
  }

  private executeBatch() {
    if (this.batch.length > 0) {
      this.sendBatchCallback(this.batch);
      this.batch = [];
    }
    clearTimeout(this.batchTimer);
    this.batchTimer = null;
  }
}

interface SocketStore {
  socket: Socket | null;
  clientId: number | null; // 숫자로 된 클라이언트Id
  workspace: WorkSpaceSerializedProps | null;
  availableWorkspaces: WorkspaceListItem[];
  batchProcessor: BatchProcessor;
  workspaceConnections: Record<string, number>; // 워크스페이스별 접속자 수
  init: (userId: string | null, workspaceId: string | null) => void;
  cleanup: () => void;
  switchWorkspace: (userId: string | null, workspaceId: string | null) => void; // 새로운 함수 추가
  fetchWorkspaceData: () => WorkSpaceSerializedProps | null;
  sendPageCreateOperation: (operation: RemotePageCreateOperation) => void;
  sendPageDeleteOperation: (operation: RemotePageDeleteOperation) => void;
  sendPageUpdateOperation: (operation: RemotePageUpdateOperation) => void;
  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => void;
  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => void;
  sendCharInsertOperation: (operation: RemoteCharInsertOperation) => void;
  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => void;
  sendCharDeleteOperation: (operation: RemoteCharDeleteOperation) => void;
  sendCharUpdateOperation: (operation: RemoteCharUpdateOperation) => void;
  sendBlockReorderOperation: (operation: RemoteBlockReorderOperation) => void;
  sendCursorPosition: (position: CursorPosition) => void;
  subscribeToRemoteOperations: (handlers: RemoteOperationHandlers) => (() => void) | undefined;
  subscribeToPageOperations: (handlers: PageOperationsHandlers) => (() => void) | undefined;
  setWorkspace: (workspace: WorkSpaceSerializedProps) => void;
  sendOperation: (operation: any) => void;
  sendBlockCheckboxOperation: (operation: RemoteBlockCheckboxOperation) => void;
}

interface RemoteOperationHandlers {
  onRemoteBlockUpdate: (operation: RemoteBlockUpdateOperation) => void;
  onRemoteBlockInsert: (operation: RemoteBlockInsertOperation) => void;
  onRemoteBlockDelete: (operation: RemoteBlockDeleteOperation) => void;
  onRemoteBlockReorder: (operation: RemoteBlockReorderOperation) => void;
  onRemoteCharInsert: (operation: RemoteCharInsertOperation) => void;
  onRemoteCharDelete: (operation: RemoteCharDeleteOperation) => void;
  onRemoteCharUpdate: (operation: RemoteCharUpdateOperation) => void;
  onRemoteCursor: (position: CursorPosition) => void;
  onBatchOperations: (batch: any[]) => void;
  onRemoteBlockCheckbox: (operation: RemoteBlockCheckboxOperation) => void;
}

interface PageOperationsHandlers {
  onRemotePageCreate: (operation: RemotePageCreateOperation) => void;
  onRemotePageDelete: (operation: RemotePageDeleteOperation) => void;
  onRemotePageUpdate: (operation: RemotePageUpdateOperation) => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,
  clientId: null,
  workspace: null,
  availableWorkspaces: [],
  workspaceConnections: {},
  batchProcessor: new BatchProcessor((batch) => {
    const { socket } = get();
    socket?.emit("batch/operations", batch);
  }),

  init: (userId: string | null, workspaceId: string | null) => {
    const { socket: existingSocket } = get();

    if (existingSocket) {
      existingSocket.disconnect();
    }

    const SERVER_URL =
      process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://nocta.site";

    const socket = io(SERVER_URL, {
      path: "/api/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        userId,
        workspaceId,
      },
      autoConnect: false,
    });

    socket.on("assign/clientId", (clientId: number) => {
      set({ clientId });
    });

    socket.on("workspace", (workspace: WorkSpaceSerializedProps) => {
      const { setWorkspace } = get();
      setWorkspace(workspace);
    });

    socket.on(
      "workspace/user/left",
      (data: { workspaceId: string; userName: string; message: string }) => {
        useToastStore.getState().addToast(data.message);
      },
    );

    socket.on(
      "workspace/user/join",
      (data: { workspaceId: string; userName: string; message: string }) => {
        useToastStore.getState().addToast(data.message);
      },
    );

    socket.on("workspace/connections", (connections: Record<string, number>) => {
      set({ workspaceConnections: connections });
    });

    socket.on("connect", () => {
      set({ socket });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    socket.on("workspace/list", (workspaces: WorkspaceListItem[]) => {
      set({ availableWorkspaces: workspaces });
      const { availableWorkspaces } = get();
      console.log(availableWorkspaces);
      const { workspace } = get();
      const currentWorkspace = availableWorkspaces.find((ws) => ws.id === workspace!.id);
      if (currentWorkspace) {
        useWorkspaceStore.getState().setCurrentRole(currentWorkspace.role);
        useWorkspaceStore.getState().setCurrentWorkspaceName(currentWorkspace.name);
        useWorkspaceStore.getState().setCurrentActiveUsers(currentWorkspace.activeUsers);
        useWorkspaceStore.getState().setCurrentMemberCount(currentWorkspace.memberCount);
      }
    });

    socket.on("error", (error: Error) => {
      console.error("Socket error:", error);
    });

    socket.on("workspace/role", (data: { role: "owner" | "editor" }) => {
      useWorkspaceStore.getState().setCurrentRole(data.role);
    });

    socket.connect();
  },

  cleanup: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      sessionStorage.removeItem("currentWorkspace"); // sessionStorage 삭제
      set({ socket: null, workspace: null, clientId: null });
    }
  },

  switchWorkspace: (userId: string | null, workspaceId: string | null) => {
    const { socket, workspace, init } = get();
    // 기존 연결 정리
    if (socket) {
      if (workspace?.id) {
        socket.emit("leave/workspace", { workspaceId: workspace.id, userId });
      }
      socket.disconnect();
    }
    sessionStorage.removeItem("currentWorkspace");
    set({ workspace: null }); // 상태도 초기화
    init(userId, workspaceId);
  },

  fetchWorkspaceData: () => get().workspace,

  setWorkspace: (workspace: WorkSpaceSerializedProps) => {
    sessionStorage.setItem("currentWorkspace", JSON.stringify(workspace));
    set({ workspace });
  },

  sendPageUpdateOperation: (operation: RemotePageUpdateOperation) => {
    const { socket } = get();
    socket?.emit("update/page", operation);
  },

  sendPageCreateOperation: (operation: RemotePageCreateOperation) => {
    const { socket } = get();
    socket?.emit("create/page", operation);
  },

  sendPageDeleteOperation: (operation: RemotePageDeleteOperation) => {
    const { socket } = get();
    socket?.emit("delete/page", operation);
  },

  sendBlockInsertOperation: (operation: RemoteBlockInsertOperation) => {
    const { socket } = get();
    socket?.emit("insert/block", operation);
    // const { sendOperation } = get();
    // sendOperation(operation);
  },

  sendCharInsertOperation: (operation: RemoteCharInsertOperation) => {
    const { socket } = get();
    socket?.emit("insert/char", operation);
    // const { sendOperation } = get();
    // sendOperation(operation);
  },

  sendBlockUpdateOperation: (operation: RemoteBlockUpdateOperation) => {
    const { socket } = get();
    socket?.emit("update/block", operation);
    // const { sendOperation } = get();
    // sendOperation(operation);
  },

  sendBlockDeleteOperation: (operation: RemoteBlockDeleteOperation) => {
    const { socket } = get();
    socket?.emit("delete/block", operation);
    // const { sendOperation } = get();
    // sendOperation(operation);
  },

  sendCharDeleteOperation: (operation: RemoteCharDeleteOperation) => {
    const { socket } = get();
    socket?.emit("delete/char", operation);
    // const { sendOperation } = get();
    // sendOperation(operation);
  },

  sendCharUpdateOperation: (operation: RemoteCharUpdateOperation) => {
    const { socket } = get();
    socket?.emit("update/char", operation);
    // const { sendOperation } = get();
    // sendOperation(operation);
  },

  sendCursorPosition: (position: CursorPosition) => {
    const { socket } = get();
    socket?.emit("cursor", position);
  },

  sendBlockReorderOperation: (operation: RemoteBlockReorderOperation) => {
    const { socket } = get();
    socket?.emit("reorder/block", operation);
    // const { sendOperation } = get();
    // sendOperation(operation);
  },

  sendBlockCheckboxOperation: (operation: RemoteBlockCheckboxOperation) => {
    const { socket } = get();
    socket?.emit("checkbox/block", operation);
  },

  subscribeToRemoteOperations: (handlers: RemoteOperationHandlers) => {
    const { socket } = get();
    if (!socket) return;

    socket.on("update/block", handlers.onRemoteBlockUpdate);
    socket.on("insert/block", handlers.onRemoteBlockInsert);
    socket.on("delete/block", handlers.onRemoteBlockDelete);
    socket.on("reorder/block", handlers.onRemoteBlockReorder);
    socket.on("insert/char", handlers.onRemoteCharInsert);
    socket.on("delete/char", handlers.onRemoteCharDelete);
    socket.on("update/char", handlers.onRemoteCharUpdate);
    socket.on("cursor", handlers.onRemoteCursor);
    socket.on("batch/operations", handlers.onBatchOperations);
    socket.on("checkbox/block", handlers.onRemoteBlockCheckbox);

    return () => {
      socket.off("update/block", handlers.onRemoteBlockUpdate);
      socket.off("insert/block", handlers.onRemoteBlockInsert);
      socket.off("delete/block", handlers.onRemoteBlockDelete);
      socket.off("reorder/block", handlers.onRemoteBlockReorder);
      socket.off("insert/char", handlers.onRemoteCharInsert);
      socket.off("delete/char", handlers.onRemoteCharDelete);
      socket.off("update/char", handlers.onRemoteCharUpdate);
      socket.off("cursor", handlers.onRemoteCursor);
      socket.off("batch/operations", handlers.onBatchOperations);
      socket.off("checkbox/block", handlers.onRemoteBlockCheckbox);
    };
  },

  subscribeToPageOperations: (handlers: PageOperationsHandlers) => {
    const { socket } = get();
    if (!socket) return;
    socket.on("create/page", handlers.onRemotePageCreate);
    socket.on("delete/page", handlers.onRemotePageDelete);
    socket.on("update/page", handlers.onRemotePageUpdate);
    return () => {
      socket.off("create/page", handlers.onRemotePageCreate);
      socket.off("delete/page", handlers.onRemotePageDelete);
      socket.off("update/page", handlers.onRemotePageUpdate);
    };
  },

  sendOperation: (operation: any) => {
    const { batchProcessor } = get();
    batchProcessor.addOperation(operation);
  },
}));
