import { css } from "@styled-system/css";

export const IntroScreenContainer = css({
  display: "flex",
  zIndex: 50,
  position: "fixed",
  inset: 0,
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  backgroundSize: "cover",
  transition: "opacity 0.5s ease-in-out",
});

export const topText = css({
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -160px)",
  width: "100%",
  color: "gray.900",
  textAlign: "center",
  fontSize: "2xl",
  opacity: 1,
  animation: "fadeIn",
  textShadow: "0px 0px 5px white",
  animationDelay: "0.5s",
});

export const bottomText = css({
  top: "50%",
  left: "50%",
  transform: "translate(-50%, 120px)",
  width: "100%",
  color: "gray.900",
  textAlign: "center",
  textShadow: "0px 0px 5px white",
  fontSize: "4xl",
  fontWeight: "bold",
  opacity: 1,
  animation: "",
  animationDelay: "0.5s",
});

export const overLayContainer = css({
  zIndex: -1,
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "gray.500/30",
});
