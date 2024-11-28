import { css, cva } from "@styled-system/css";

export const content = css({
  position: "relative",
  padding: "md",
});

export const workSpaceContainer = cva({
  base: {
    display: "flex",
    transition: "opacity 0.3s ease-in-out",
  },
  variants: {
    visibility: {
      visible: {
        visibility: "visible",
      },
      hidden: {
        visibility: "hidden",
      },
    },
    opacity: {
      1: {
        opacity: 1,
      },
      0: {
        opacity: 0,
      },
    },
  },
});
