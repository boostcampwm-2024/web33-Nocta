import { motion } from "framer-motion";
import { NoctaIcon } from "@components/lotties/NoctaIcon";
import { containerVariants, bottomTextVariants, topTextVariants } from "./IntroScreen.animation";
import { IntroScreenContainer, topText, bottomText, overLayContainer } from "./IntroScreen.style";

export const IntroScreen = () => {
  return (
    <motion.div
      className={IntroScreenContainer}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.6, ease: "easeInOut" }}
      exit={{ opacity: 0 }}
    >
      <motion.div variants={topTextVariants} className={topText}>
        밤하늘의 별빛처럼, 자유로운 인터랙션 실시간 에디터
      </motion.div>
      <NoctaIcon size={200} />
      <motion.div variants={bottomTextVariants} className={bottomText}>
        Nocta
      </motion.div>
      <div className={overLayContainer}></div>
    </motion.div>
  );
};
