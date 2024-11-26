import { cva } from "@styled-system/css";

const baseBlockStyle = {
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  position: "relative",
  width: "full",
  minHeight: "16px",
  backgroundColor: "transparent",
  "&:hover .menu_block, .menu_block.option_modal_open": {
    opacity: 1,
  },
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
    width: "100%",
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
  display: "inline",
  alignItems: "center",
  letterSpacing: "1.5px",
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
        fontWeight: "normal",
      },
      h1: {
        textStyle: "display-medium24",
        fontWeight: "normal",
      },
      h2: {
        textStyle: "display-medium20",
        fontWeight: "normal",
      },
      h3: {
        textStyle: "display-medium16",
        fontWeight: "normal",
      },
      ul: {
        textStyle: "display-medium16",
        listStyleType: "disc",
      },
      li: {},
      ol: {
        listStyleType: "decimal",
      },
      blockquote: {
        borderLeft: "4px solid token(colors.gray.300)",
        paddingLeft: "spacing.md",
        color: "gray.500",
        fontStyle: "italic",
      },
      checkbox: {},
    },
    isLast: {
      true: {},
      false: {},
    },
  },
  defaultVariants: {
    type: "p",
    isLast: false,
  },
  compoundVariants: [
    {
      type: "p",
      isLast: true,
      css: {
        "&:empty::before": {
          content: '"텍스트를 입력하세요..."',
        },
      },
    },
    {
      type: "h1",
      isLast: true,
      css: {
        "&:empty::before": {
          content: '"제목 1"',
        },
      },
    },
    {
      type: "h2",
      isLast: true,
      css: {
        "&:empty::before": {
          content: '"제목 2"',
        },
      },
    },
    {
      type: "h3",
      isLast: true,
      css: {
        "&:empty::before": {
          content: '"제목 3"',
        },
      },
    },
    {
      type: "ul",
      isLast: true,
      css: {
        "&:empty::before": {
          content: '"리스트를 입력하세요..."',
        },
      },
    },
    {
      type: "ol",
      isLast: true,
      css: {
        "&:empty::before": {
          content: '"번호 리스트를 입력하세요..."',
        },
      },
    },
    {
      type: "blockquote",
      isLast: true,
      css: {
        "&:empty::before": {
          content: '"텍스트를 입력하세요..."',
        },
      },
    },
    {
      type: "checkbox",
      isLast: true,
      css: {
        "&:empty::before": {
          content: '"텍스트를 입력하세요..."',
        },
      },
    },
  ],
});
