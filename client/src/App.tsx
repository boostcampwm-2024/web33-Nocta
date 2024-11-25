import { useRefreshQuery } from "@apis/auth";
import { useErrorStore } from "@stores/useErrorStore";
import { useUserInfo } from "@stores/useUserStore";
import { useEffect } from "react";
import { ErrorModal } from "@components/modal/ErrorModal";
import { WorkSpace } from "@features/workSpace/WorkSpace";
import { useSocketStore } from "./stores/useSocketStore";

const App = () => {
  // TODO 라우터, react query 설정
  const { refetch: refreshToken } = useRefreshQuery();
  const { isErrorModalOpen, errorMessage } = useErrorStore();

  useEffect(() => {
    refreshToken();
  }, []);

  useEffect(() => {
    const socketStore = useSocketStore.getState();
    socketStore.init();
    return () => {
      setTimeout(() => {
        socketStore.cleanup();
      }, 0);
    };
  }, []);

  return (
    <>
      {isErrorModalOpen && <ErrorModal errorMessage={errorMessage} />}
      <WorkSpace />
    </>
  );
};

export default App;
