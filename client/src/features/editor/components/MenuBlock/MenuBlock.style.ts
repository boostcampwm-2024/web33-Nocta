import { css } from "@styled-system/css";

export const menuBlockStyle = css({
  display: "flex",
  zIndex: 1,
  position: "absolute",
  top: 0,
  left: 0,
  justifyContent: "center",
  alignItems: "center",
  width: "20px",
  height: "20px",
  marginLeft: "-20px",
  opacity: 0,
  transition: "opacity 0.2s ease-in-out",
  cursor: "grab",
  _active: {
    cursor: "grabbing",
  },
});

export const dragHandleIconStyle = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  height: "100%",
});
