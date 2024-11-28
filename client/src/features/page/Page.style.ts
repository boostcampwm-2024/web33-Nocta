import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const pageContainer = cx(
  glassContainer({ border: "lg" }),
  css({
    display: "flex",
    position: "absolute",
    flexDirection: "column",
    width: "450px",
    height: "400px",
  }),
);

export const pageHeader = css({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderTopRadius: "md",
  height: "60px",
  padding: "sm",
  boxShadow: "xs",
  backdropFilter: "blur(30px)",
  "&:hover": {
    cursor: "move",
  },
});

const baseResizeHandle = css({
  zIndex: 1,
  position: "absolute",
});

export const resizeHandles = {
  top: cx(
    baseResizeHandle,
    css({
      top: "-5px",
      left: "5px",
      right: "5px",
      height: "10px",
      cursor: "n-resize",
    }),
  ),

  bottom: cx(
    baseResizeHandle,
    css({
      left: "5px",
      right: "5px",
      bottom: "-5px",
      height: "10px",
      cursor: "s-resize",
    }),
  ),

  left: cx(
    baseResizeHandle,
    css({
      top: "5px",
      left: "-5px",
      bottom: "5px",
      width: "10px",
      cursor: "w-resize",
    }),
  ),

  right: cx(
    baseResizeHandle,
    css({
      top: "5px",
      right: "-5px",
      bottom: "5px",
      width: "10px",
      cursor: "e-resize",
    }),
  ),

  topLeft: cx(
    baseResizeHandle,
    css({
      top: "-10px",
      left: "-10px",
      width: "24px",
      height: "24px",
      cursor: "nw-resize",
    }),
  ),

  topRight: cx(
    baseResizeHandle,
    css({
      top: "-10px",
      right: "-10px",
      width: "24px",
      height: "24px",
      cursor: "ne-resize",
    }),
  ),

  bottomLeft: cx(
    baseResizeHandle,
    css({
      left: "-10px",
      bottom: "-10px",
      width: "24px",
      height: "24px",
      cursor: "sw-resize",
    }),
  ),

  bottomRight: cx(
    baseResizeHandle,
    css({
      right: "-10px",
      bottom: "-10px",
      width: "24px",
      height: "24px",
      cursor: "se-resize",
    }),
  ),
};
