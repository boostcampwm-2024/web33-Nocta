import { Page } from "@src/types/page";
import { motion } from "framer-motion";
import { IconButton } from "@components/button/IconButton";
import { animation } from "./BottomNavigator.animation";
import { bottomNavigatorContainer } from "./BottomNavigator.style";

interface BottomNavigatorProps {
  pages: Page[];
  handlePageSelect: (pageId: number) => void;
}

export const BottomNavigator = ({ pages, handlePageSelect }: BottomNavigatorProps) => {
  return (
    <div className={bottomNavigatorContainer}>
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
              handlePageSelect(page.id);
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};
