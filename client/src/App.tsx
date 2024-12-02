import { useEffect } from "react";
import { ErrorModal } from "@components/modal/ErrorModal";
import { WorkSpace } from "@features/workSpace/WorkSpace";
import { useErrorStore } from "@stores/useErrorStore";
import { useUserInfo } from "@stores/useUserStore";
import { useSocketStore } from "./stores/useSocketStore";

const App = () => {
  // TODO 라우터, react query 설정
  const { isErrorModalOpen, errorMessage } = useErrorStore();
  const { userId } = useUserInfo();

  useEffect(() => {
    const socketStore = useSocketStore.getState();
    const savedWorkspace = sessionStorage.getItem("currentWorkspace");
    const workspaceId = savedWorkspace ? JSON.parse(savedWorkspace).id : null;
    socketStore.init(userId, workspaceId);

    return () => {
      setTimeout(() => {
        socketStore.cleanup();
      }, 0);
    };
  }, [userId]);

  return (
    <>
      {isErrorModalOpen && <ErrorModal errorMessage={errorMessage} />}
      <WorkSpace />
    </>
  );
};

export default App;
