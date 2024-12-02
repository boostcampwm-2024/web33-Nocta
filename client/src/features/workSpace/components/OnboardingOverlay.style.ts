import { css, cva } from "@styled-system/css";

export const overlayContainer = css({
  zIndex: 9999,
  position: "fixed",
  inset: 0,
});

export const highlightBox = css({
  position: "absolute",
  borderColor: "rgba(168, 85, 247, 0.5)", // purple-400 with 50% opacity
  borderRadius: "xl",
  borderWidth: "2px",
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  pointerEvents: "none",
});

export const tooltipBox = css({
  zIndex: 10000,
  position: "absolute",
  borderRadius: "xl",
  width: "280px",
  padding: "4",
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  boxShadow: "xl",
  backdropFilter: "blur(4px)",
});

export const tooltipTitle = css({
  marginBottom: "2",
  color: "purple.900",
  fontSize: "lg",
  fontWeight: "semibold",
});

export const tooltipDescription = css({
  marginBottom: "4",
  color: "gray.600",
});
export const closeButton = css({
  position: "absolute",
  top: "2",
  right: "2",
  borderRadius: "8px",
  padding: "1",
  color: "gray.500",
  transition: "all",
  _hover: {
    color: "gray.700",
    backgroundColor: "gray.100",
  },
  "& svg": {
    // SVG 스타일 추가
    width: "4",
    height: "4",
    color: "black",
  },
});
export const IndicatorContainer = css({ display: "flex", gap: "2px" });
export const stepIndicator = cva({
  base: {
    borderRadius: "full",
    width: "5px",
    height: "5px",
    transition: "colors",
  },
  variants: {
    active: {
      true: {
        backgroundColor: "purple.500",
      },
      false: {
        backgroundColor: "gray.300",
      },
    },
  },
});

export const nextButton = cva({
  base: {
    borderRadius: "lg",
    paddingY: "1.5",
    paddingX: "4",
    fontSize: "sm",
    transition: "colors",
  },
  variants: {
    variant: {
      primary: {
        color: "white",
        backgroundColor: "purple.500",
        _hover: {
          backgroundColor: "purple.600",
        },
      },
      secondary: {
        color: "gray.700",
        backgroundColor: "gray.100",
        _hover: {
          backgroundColor: "gray.200",
        },
      },
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});
