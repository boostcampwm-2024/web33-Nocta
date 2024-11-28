import { defineTextStyles } from "@pandacss/dev";

export const textStyles = defineTextStyles({
  "display-medium16": {
    value: {
      fontFamily: "pretendard",
      fontWeight: "500",
      fontSize: "16px",
      lineHeight: "24px",
      letterSpacing: "0",
      textDecoration: "None",
      textTransform: "None",
    },
  },

  "display-medium20": {
    value: {
      fontFamily: "pretendard",
      fontWeight: "500",
      fontSize: "20px",
      lineHeight: "28px",
      letterSpacing: "0",
      textDecoration: "None",
      textTransform: "None",
    },
  },

  "display-medium24": {
    value: {
      fontFamily: "pretendard",
      fontWeight: "500",
      fontSize: "24px",
      lineHeight: "32px",
      letterSpacing: "0",
      textDecoration: "None",
      textTransform: "None",
    },
  },

  "display-medium28": {
    value: {
      fontFamily: "pretendard",
      fontWeight: "700",
      fontSize: "28px",
      lineHeight: "36px",
      letterSpacing: "-0.2px",
      textDecoration: "None",
      textTransform: "None",
    },
  },

  "display-medium32": {
    value: {
      fontFamily: "pretendard",
      fontWeight: "700",
      fontSize: "32px",
      lineHeight: "40px",
      letterSpacing: "-0.2px",
      textDecoration: "None",
      textTransform: "None",
    },
  },

  bold: {
    value: {
      fontWeight: "bold",
    },
  },
  italic: {
    value: {
      fontStyle: "italic",
    },
  },
  underline: {
    value: {
      textDecoration: "underline",
    },
  },
  strikethrough: {
    value: {
      textDecoration: "line-through",
    },
  },
  "underline-strikethrough": {
    value: {
      textDecoration: "underline line-through",
    },
  },
});
