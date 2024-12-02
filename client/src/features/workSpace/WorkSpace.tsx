import { WorkSpace as WorkSpaceClass } from "@noctaCrdt/WorkSpace";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { BottomNavigator } from "@components/bottomNavigator/BottomNavigator";
import { ErrorModal } from "@components/modal/ErrorModal";
import { Sidebar } from "@components/sidebar/Sidebar";
import { Page } from "@features/page/Page";
import { ToastContainer } from "@src/components/Toast/ToastContainer";
import { useSocketStore } from "@src/stores/useSocketStore";
import { workSpaceContainer, content } from "./WorkSpace.style";
import { IntroScreen } from "./components/IntroScreen";
import { OnboardingOverlay } from "./components/OnboardingOverlay";
import { usePagesManage } from "./hooks/usePagesManage";
import { useWorkspaceInit } from "./hooks/useWorkspaceInit";

export const WorkSpace = () => {
  const [workspace, setWorkspace] = useState<WorkSpaceClass | null>(null);
  const { isLoading, isInitialized, error } = useWorkspaceInit();
  const { workspace: workspaceMetadata, clientId } = useSocketStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const {
    pages,
    fetchPage,
    selectPage,
    closePage,
    updatePage,
    initPages,
    // initPagePosition,
    openPage,
  } = usePagesManage(workspace, clientId);
  const visiblePages = pages.filter((page) => page.isVisible && page.isLoaded);

  useEffect(() => {
    if (workspaceMetadata) {
      const newWorkspace = new WorkSpaceClass(
        workspaceMetadata.id,
        workspaceMetadata.name,
        workspaceMetadata.pageList,
      );
      newWorkspace.deserialize(workspaceMetadata);
      setWorkspace(newWorkspace);

      initPages(newWorkspace.pageList);
      // initPagePosition();
    }
  }, [workspaceMetadata]);

  useEffect(() => {
    // IntroScreen이 끝나고 초기화가 완료된 후에 지연시켜서 온보딩 표시
    if (!isLoading && isInitialized) {
      // 약간의 딜레이를 주어 UI가 완전히 렌더링된 후에 온보딩 표시
      setTimeout(() => {
        setShowOnboarding(true);
      }, 500); // 500ms 딜레이
    }
  }, [isLoading, isInitialized]);

  if (error) {
    return <ErrorModal errorMessage="서버와 연결할 수 없습니다." />;
  }

  return (
    <>
      <ToastContainer />
      <AnimatePresence mode="wait">{isLoading && <IntroScreen />}</AnimatePresence>

      <div
        className={workSpaceContainer({
          visibility: isInitialized && !isLoading ? "visible" : "hidden",
          opacity: isInitialized && !isLoading ? 1 : 0,
        })}
      >
        <Sidebar
          sidebarOnBoardingProps={{
            "data-onboarding": "sidebar",
          }}
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
        <BottomNavigator
          BottomNavigatorOnBoardingProps={{
            "data-onboarding": "bottom-nav",
          }}
          pages={visiblePages}
          data-onboarding="bottom-nav"
          handlePageSelect={openPage}
        />
      </div>
      {<OnboardingOverlay isShow={showOnboarding} />}
    </>
  );
};
