import { css } from "@styled-system/css";

export const menuItemWrapper = css({
  display: "flex",
  gap: "lg",
  alignItems: "center",
  borderRightRadius: "md",
  width: "300px",
  padding: "md",
  boxShadow: "sm",
});

export const imageBox = css({
  borderRadius: "sm",
  width: "50px",
  height: "50px",
  overflow: "hidden",
});

export const textBox = css({
  textStyle: "display-medium20",
  color: "gray.900",
});
