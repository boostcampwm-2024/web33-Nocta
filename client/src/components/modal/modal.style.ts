import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const container = css({
  display: "flex",
  zIndex: 10000,
  position: "fixed",
  inset: 0,
  justifyContent: "center",
  alignItems: "center",
  width: "100vw",
  height: "100vh",
});

export const overlayBox = css({
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  background: "gray.500/10",
  backdropFilter: "blur(3px)",
});

export const modalContainer = cx(
  glassContainer({ border: "lg" }),
  css({
    display: "flex",
    zIndex: 10001,
    position: "absolute",
    transform: "translate(-50%, -50%)",
    flexDirection: "column",
    justifyContent: "space-between",
    width: "400px",
    height: "auto",
    padding: "md",
    background: "white/20",
    boxShadow: "md",
    blur: "1px",
  }),
);
export const modalContent = css({
  display: "flex",
  flexGrow: 1,
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  height: "100%",
  paddingTop: "md",
  paddingBottom: "md",
  textAlign: "center",
});

export const buttonContainer = css({
  display: "flex",
  gap: "md",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
});
