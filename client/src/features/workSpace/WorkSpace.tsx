import { WorkSpace as WorkSpaceClass } from "@noctaCrdt/WorkSpace";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { BottomNavigator } from "@components/bottomNavigator/BottomNavigator";
import { ErrorModal } from "@components/modal/ErrorModal";
import { Sidebar } from "@components/sidebar/Sidebar";
import { Page } from "@features/page/Page";
import { useSocketStore } from "@src/stores/useSocketStore";
import { workSpaceContainer, content } from "./WorkSpace.style";
import { IntroScreen } from "./components/IntroScreen";
import { usePagesManage } from "./hooks/usePagesManage";
import { useWorkspaceInit } from "./hooks/useWorkspaceInit";

export const WorkSpace = () => {
  const [workspace, setWorkspace] = useState<WorkSpaceClass | null>(null);
  const { isLoading, isInitialized, error } = useWorkspaceInit();
  const { workspace: workspaceMetadata, clientId } = useSocketStore();

  const {
    pages,
    fetchPage,
    selectPage,
    closePage,
    updatePage,
    initPages,
    initPagePosition,
    openPage,
  } = usePagesManage(workspace, clientId);
  const visiblePages = pages.filter((page) => page.isVisible && page.isLoaded);

  useEffect(() => {
    if (workspaceMetadata) {
      const newWorkspace = new WorkSpaceClass(workspaceMetadata.id, workspaceMetadata.pageList);
      newWorkspace.deserialize(workspaceMetadata);
      setWorkspace(newWorkspace);

      initPages(newWorkspace.pageList);
      initPagePosition();
    }
  }, [workspaceMetadata]);

  if (error) {
    return <ErrorModal errorMessage="서버와 연결할 수 없습니다." />;
  }

  return (
    <>
      <AnimatePresence mode="wait">{isLoading && <IntroScreen />}</AnimatePresence>
      <div
        className={workSpaceContainer({
          visibility: isInitialized && !isLoading ? "visible" : "hidden",
          opacity: isInitialized && !isLoading ? 1 : 0,
        })}
      >
        <Sidebar
          pages={pages}
          handlePageAdd={fetchPage}
          handlePageOpen={openPage}
          handlePageUpdate={updatePage}
        />
        <div className={content}>
          {visiblePages.map((page) => (
            <Page
              key={page.id}
              {...page}
              handlePageSelect={selectPage}
              handlePageClose={closePage}
              handleTitleChange={updatePage}
            />
          ))}
        </div>
        <BottomNavigator pages={visiblePages} handlePageSelect={openPage} />
      </div>
    </>
  );
};
