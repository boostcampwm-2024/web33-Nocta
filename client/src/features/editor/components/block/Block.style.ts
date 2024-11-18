import { cva } from "@styled-system/css";

const baseBlockStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  position: "relative",
  width: "full",
  minHeight: "16px",
  backgroundColor: "transparent",
};

export const blockContainerStyle = cva({
  base: {
    ...baseBlockStyle,
  },
  variants: {
    isActive: {
      true: {
        opacity: 0.9,
      },
      false: {
        backgroundColor: "transparent",
      },
    },
  },
  defaultVariants: {
    isActive: false,
  },
});

export const contentWrapperStyle = cva({
  base: {
    display: "flex",
    position: "relative",
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
});

const baseTextStyle = {
  textStyle: "display-medium16",
  flex: "1 1 auto", // 변경: flex-grow: 1, flex-shrink: 1, flex-basis: auto
  minWidth: "0", // 추가: flex item의 최소 너비를 0으로 설정
  outline: "none",
  borderRadius: "xs",
  width: "full",
  minHeight: "spacing.lg",
  margin: "spacing.sm 0",
  padding: "spacing.sm",
  color: "gray.900",
  backgroundColor: "transparent",
  display: "flex",
  alignItems: "center",
};

export const textContainerStyle = cva({
  base: {
    ...baseTextStyle,
    position: "relative",
    "&:empty::before": {
      color: "gray.300",
      pointerEvents: "none",
    },
  },
  variants: {
    type: {
      p: {
        textStyle: "display-medium16",
        fontWeight: "bold",
        "&:empty::before": {
          content: '"텍스트를 입력하세요..."',
        },
      },
      h1: {
        textStyle: "display-medium24",
        fontWeight: "bold",
        "&:empty::before": {
          content: '"제목 1"',
        },
      },
      h2: {
        textStyle: "display-medium20",
        fontWeight: "bold",
        "&:empty::before": {
          content: '"제목 2"',
        },
      },
      h3: {
        textStyle: "display-medium16",
        fontWeight: "bold",
        "&:empty::before": {
          content: '"제목 3"',
        },
      },
      ul: {
        textStyle: "display-medium16",
        listStyleType: "disc",
        "&:empty::before": {
          content: '"리스트를 입력하세요..."',
        },
      },
      li: {},
      ol: {
        listStyleType: "decimal",
        "&:empty::before": {
          content: '"번호 리스트를 입력하세요..."',
        },
      },
      blockquote: {
        borderLeft: "4px solid token(colors.gray.300)",
        paddingLeft: "spacing.md",
        color: "gray.500",
        fontStyle: "italic",
        "&:empty::before": {
          content: '"텍스트를 입력하세요..."',
        },
      },
      checkbox: {
        "&:empty::before": {
          content: '"텍스트를 입력하세요..."',
        },
      },
    },
  },
  defaultVariants: {
    type: "p",
  },
});