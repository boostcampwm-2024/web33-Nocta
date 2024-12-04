import { css } from "@styled-system/css";

export const container = css({
  display: "flex",
  gap: "lg",
  flexDirection: "column",
  justifyContent: "space-between",
  width: "100%",
  height: "360px",
});

export const title = css({
  textStyle: "display-medium32",
  color: "white",
  textAlign: "center",
  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
});

export const errorWrapper = css({
  display: "flex",
  justifyContent: "center",
  width: "100%",
  height: "20px",
  paddingBottom: "40px",
});
export const toggleButton = css({
  marginBottom: "md",
  color: "white",
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline",
  },
});
export const errorContainer = css({
  display: "flex",
  position: "relative",
  alignContent: "center",
  alignItems: "center",
  color: "red",
});
export const formContainer = css({
  display: "flex",
  gap: "md",
  flexDirection: "column",
});
