import { css } from "@styled-system/css";

export const formGroup = css({
  position: "relative",
});

export const inputContainer = css({
  position: "relative",
  border: "1px solid white",
  borderRadius: "md",
  padding: "1",
  background: "white/30",
});

export const inputBox = css({
  width: "100%",
  padding: "2",
  paddingLeft: "4",
  paddingRight: "12",
  color: "gray.700",
  "&:focus": {
    outline: "none",
  },
  "&:placeholder": {
    color: "gray.500",
  },
});

export const iconBox = css({
  position: "absolute",
  top: "50%",
  right: "4",
  transform: "translateY(-50%)",
  width: "6",
  height: "6",
  color: "white",
});
