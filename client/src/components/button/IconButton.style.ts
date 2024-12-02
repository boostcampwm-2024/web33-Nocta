import { cva } from "@styled-system/css";

export const iconButtonContainer = cva({
  base: {
    display: "flex",
    flexShrink: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "xs",
    background: "white",
    "&:hover": {
      cursor: "pointer",
    },
  },
  variants: {
    size: {
      sm: {
        width: "44px",
        height: "44px",
        boxShadow: "sm",
      },
      md: {
        width: "52px",
        height: "52px",
        boxShadow: "md",
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export const iconBox = cva({
  variants: {
    size: {
      sm: {
        fontSize: "24px",
      },
      md: {
        fontSize: "30px",
      },
    },
  },
  defaultVariants: {
    size: "md",
  },
});
