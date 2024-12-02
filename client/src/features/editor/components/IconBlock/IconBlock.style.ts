// IconBlock.style.ts
import { css, cva } from "@styled-system/css";

export const iconContainerStyle = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minWidth: "24px",
  marginRight: "8px",
});

export const iconStyle = cva({
  base: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "gray.600",
    fontSize: "14px",
  },
  variants: {
    type: {
      ul: {
        fontSize: "6px", // bullet point size
      },
      ol: {
        paddingRight: "4px",
      },
      checkbox: {
        borderRadius: "2px",
        width: "16px",
        height: "16px",
        backgroundColor: "white",
      },
    },
    isChecked: {
      true: {
        color: "white",
        backgroundColor: "#7272FF",
      },
      false: {
        color: "gray.600",
        backgroundColor: "white",
      },
    },
  },
});
