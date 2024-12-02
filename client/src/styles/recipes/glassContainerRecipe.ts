import { defineRecipe } from "@pandacss/dev";

export const glassContainerRecipe = defineRecipe({
  className: "glassContainer",
  base: {
    borderRadius: "md",
    background: "linear-gradient(180deg, token(colors.white/60), token(colors.white/0))",
    boxShadow: "lg",
    backdropFilter: "blur(20px)",
  },
  variants: {
    borderRadius: {
      top: {
        borderBottomRadius: "none",
      },
      bottom: {
        borderTopRadius: "none",
      },
      right: {
        borderLeftRadius: "none",
      },
      left: {
        borderRightRadius: "none",
      },
    },

    border: {
      md: {
        border: "1px solid token(colors.white/40)",
      },
      lg: {
        border: "2px solid token(colors.white/40)",
      },
    },
    background: {
      none: {
        background: "token(colors.white/95)",
      },
    },
    boxShadow: {
      all: {
        boxShadow: "lg",
      },
      top: {
        boxShadow: "0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      bottom: {
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      left: {
        boxShadow: "-4px 0 6px -1px rgb(0 0 0 / 0.1), -2px 0 4px -2px rgb(0 0 0 / 0.1)",
      },
      right: {
        boxShadow: "4px 0 6px -1px rgb(0 0 0 / 0.1), 2px 0 4px -2px rgb(0 0 0 / 0.1)",
      },
    },
  },
});
