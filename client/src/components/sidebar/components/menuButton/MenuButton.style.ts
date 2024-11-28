import { css } from "@styled-system/css";

export const menuItemWrapper = css({
  display: "flex",
  gap: "lg",
  alignItems: "center",
  borderRightRadius: "md",
  width: "300px",
  padding: "md",
  boxShadow: "sm",
  cursor: "pointer",
});

export const textBox = css({
  textStyle: "display-medium20",
  color: "gray.900",
});

export const menuDropdown = css({
  zIndex: "dropdown",
  position: "absolute",
  top: "100%",
  right: "0",
  borderRadius: "md",
  width: "100px",
  marginTop: "sm",
  boxShadow: "md",
});
