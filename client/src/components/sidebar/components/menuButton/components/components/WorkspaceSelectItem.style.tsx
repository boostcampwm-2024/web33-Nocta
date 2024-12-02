// WorkspaceSelectItem.style.ts
import { css } from "@styled-system/css";

export const itemContainer = css({
  display: "flex",
  position: "relative", // 부모 요소에 relative 추가
  justifyContent: "space-between",
  alignItems: "center",
  borderLeft: "3px solid transparent", // 활성화되지 않았을 때 border 공간 확보
  width: "100%",
  padding: "8px 16px",
  transition: "all 0.2s",
  cursor: "pointer",
  _hover: { backgroundColor: "gray.200" },
});

export const informBox = css({
  display: "flex",
  gap: "16px",
  justifyContent: "center",
  alignItems: "center",
  marginLeft: "14px",
});
export const pencilButton = css({
  display: "flex",
  position: "absolute", // relative 대신 absolute 사용
  top: "50%", // 중앙 정렬을 위해
  right: "5%", // left 대신 right 사용
  transform: "translateY(-50%)", // 정확한 세로 중앙 정렬
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "6px",
  padding: "1",
  opacity: "0",
  backgroundColor: "gray.200",
  transition: "all",
  _hover: {
    backgroundColor: "gray.100",
  },
  _groupHover: {
    opacity: "100",
  },
  "& svg": {
    // SVG 스타일 추가
    width: "4",
    height: "4",
    color: "green",
  },
});
export const itemContent = css({
  display: "flex",
  flex: 1,
  gap: "4",
  alignItems: "center",
});

export const activeItem = css({
  borderLeft: "3px solid", // 왼쪽 하이라이트 바
  borderLeftColor: "blue", // 포인트 컬러
  backgroundColor: "rgba(0, 0, 0, 0.05)", // 약간 어두운 배경
  _hover: {
    backgroundColor: "rgba(0, 0, 0, 0.08)", // 호버 시 약간 더 어둡게
  },
});

export const itemIcon = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "xl",
  width: "8",
  height: "8",
  fontSize: "sm",
  backgroundColor: "gray.100",
});

export const itemInfo = css({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
});

export const itemName = css({
  fontSize: "sm",
  fontWeight: "medium",
});

export const itemRole = css({
  color: "gray.500",
  fontSize: "xs",
});

export const itemMemberCount = css({
  color: "gray.500",
  fontSize: "xs",
});
