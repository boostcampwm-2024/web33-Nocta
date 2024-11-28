import { defineGlobalStyles } from "@pandacss/dev";

export const globalStyles = defineGlobalStyles({
  "@font-face": {
    fontFamily: "Pretendard",
    src: 'url("./assets/fonts/Pretendard-Medium.woff2") format("woff2")',
    fontWeight: 500,
    fontStyle: "normal",
  },

  "html, body": {
    backgroundImage: 'url("./assets/images/background.png")',
    backgroundSize: "cover",
    fontFamily: "Pretendard, sans-serif",
  },
  // 스크롤바 전체
  "::-webkit-scrollbar": {
    width: "8px",
  },

  // 스크롤바 전체 영역
  "::-webkit-scrollbar-track": {
    background: "transparent",
    marginBottom: "12px",
  },

  // 스크롤바 핸들
  "::-webkit-scrollbar-thumb": {
    background: "white/50",
    borderRadius: "lg",
  },

  "input:-webkit-autofill": {
    transition: "background-color 5000s ease-in-out 0s",
  },
});
