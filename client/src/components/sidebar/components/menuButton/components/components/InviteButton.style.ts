import { css } from "@styled-system/css";

export const inviteButtonStyle = css({
  display: "flex",
  gap: "32px",
  alignItems: "center",
  borderTop: "1px solid",
  borderColor: "gray.200",

  width: "100%",
  padding: "12px 16px",
  color: "gray.600",
  backgroundColor: "transparent",
  transition: "all 0.2s",
  cursor: "pointer",
  _hover: {
    backgroundColor: "gray.200",
  },
});
