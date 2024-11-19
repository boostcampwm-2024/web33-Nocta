import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const sidebarContainer = cx(
  glassContainer({ border: "md", borderRadius: "right" }),
  css({
    display: "flex",
    gap: "lg",
    flexDirection: "column",
    height: "calc(100vh - 40px)",
    marginBlock: "20px",
  }),
);
export const navWrapper = css({
  display: "flex",
  gap: "md",
  flexDirection: "column",
  width: "100%",
  height: "calc(100% - 176px)",
  overflowX: "hidden",
  overflowY: "scroll",
});

export const plusIconBox = css({
  display: "flex",
  position: "absolute",
  bottom: "0px",
  gap: "md",
  alignItems: "center",
  height: "60px",
  paddingInline: "md",
  // background: "white",
  justifyItems: "center",
});

export const sidebarToggleButton = css({
  zIndex: 10,
  position: "absolute",
  top: "4px",
  right: "16px",
  color: "gray.500",
  fontSize: "24px",
  cursor: "pointer",
});
