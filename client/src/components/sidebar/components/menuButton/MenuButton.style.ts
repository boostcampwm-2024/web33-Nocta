import { css } from "@styled-system/css";

export const menuItemWrapper = css({
  display: "flex",
  gap: "32px",
  alignItems: "center",
  width: "250px",
  padding: "md",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "gray.100",
  },
});

export const textBox = css({
  color: "gray.700",
  fontSize: "md",
  fontWeight: "medium",
});

export const menuButtonContainer = css({
  position: "relative",
  _before: {
    position: "absolute",
    top: "100%",
    left: 0,
    width: "100%",
    height: "4px",
    content: '""',
  },
});

export const nameWrapper = css({
  display: "flex",
  gap: "1",
  flexDirection: "column",
  borderColor: "gray.200",
  borderRadius: "md",
  borderWidth: "1px",
  padding: "sm",
  borderStyle: "solid",
  _hover: {
    borderColor: "gray.300", // hover 시 테두리 색상 변경
  },
});
export const workspaceInfo = css({
  display: "flex",
  gap: "0.5",
  flexDirection: "column",
});

export const workspaceHeader = css({
  display: "flex",
  gap: "2",
  alignItems: "center",
});

export const currentWorkspaceNameBox = css({
  color: "gray.600",
  fontSize: "sm",
  fontWeight: "medium",
});

export const workspaceRole = css({
  color: "gray.500",
  fontSize: "xs",
});

export const userCount = css({
  color: "gray.500",
  fontSize: "xs",
});
