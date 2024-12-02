import { motion } from "framer-motion";
import { IconButton } from "@components/button/IconButton";
import { Page } from "@src/types/page";
import { animation } from "./BottomNavigator.animation";
import { bottomNavigatorContainer } from "./BottomNavigator.style";

interface BottomNavigatorProps {
  pages: Page[];
  handlePageSelect: ({ pageId, isSidebar }: { pageId: string; isSidebar?: boolean }) => void;
  BottomNavigatorOnBoardingProps?: Record<string, string>;
}

export const BottomNavigator = ({
  pages,
  handlePageSelect,
  BottomNavigatorOnBoardingProps,
}: BottomNavigatorProps) => {
  return (
    <div className={bottomNavigatorContainer} {...BottomNavigatorOnBoardingProps}>
      {pages.map((page) => (
        <motion.div
          key={page.id}
          initial={animation.initial}
          animate={animation.animate(page.isActive)}
          transition={animation.transition}
          whileHover={animation.whileHover}
        >
          <IconButton
            key={page.id}
            icon={page.icon}
            size="md"
            onClick={() => {
              handlePageSelect({
                pageId: page.id,
              });
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};
