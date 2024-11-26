import { TextColorType, BackgroundColorType } from "@noctaCrdt/Interfaces";
import { Block } from "@noctaCrdt/Node";
import { COLOR } from "@src/constants/color";
import { css } from "styled-system/css";

export const TEXT_STYLES: Record<string, string> = {
  bold: "bold",
  italic: "italic",
  underline: "underline",
  strikethrough: "strikethrough",
};

interface SetInnerHTMLProps {
  element: HTMLDivElement;
  block: Block;
}

interface TextStyleState {
  styles: Set<string>;
  color: TextColorType;
  backgroundColor: BackgroundColorType;
}

const textColorMap: Record<TextColorType, string> = {
  black: COLOR.GRAY_900,
  red: COLOR.RED,
  green: COLOR.GREEN,
  blue: COLOR.BLUE,
  yellow: COLOR.YELLOW,
  purple: COLOR.PURPLE,
  brown: COLOR.BROWN,
  white: COLOR.WHITE,
};

const getClassNames = (state: TextStyleState): string => {
  // underline과 strikethrough가 함께 있는 경우 특별 처리
  const baseStyles = {
    textDecoration:
      state.styles.has("underline") && state.styles.has("strikethrough")
        ? "underline line-through"
        : state.styles.has("underline")
          ? "underline"
          : state.styles.has("strikethrough")
            ? "line-through"
            : "none",
    fontWeight: state.styles.has("bold") ? "bold" : "normal",
    fontStyle: state.styles.has("italic") ? "italic" : "normal",
    color: textColorMap[state.color],
  };

  // backgroundColor가 transparent가 아닐 때만 추가
  if (state.backgroundColor !== "transparent") {
    return css({
      ...baseStyles,
      backgroundColor: textColorMap[state.backgroundColor],
    });
  }

  return css(baseStyles);
};

export const setInnerHTML = ({ element, block }: SetInnerHTMLProps): void => {
  const chars = block.crdt.LinkedList.spread();
  if (chars.length === 0) {
    element.innerHTML = "";
    return;
  }

  // 각 위치별 모든 적용된 스타일을 추적
  const positionStyles: TextStyleState[] = chars.map((char) => {
    const styleSet = new Set<string>();

    // 현재 문자의 스타일 수집
    char.style.forEach((style) => styleSet.add(TEXT_STYLES[style]));

    return {
      styles: styleSet,
      color: char.color,
      backgroundColor: char.backgroundColor,
    };
  });

  let html = "";
  let currentState: TextStyleState = {
    styles: new Set<string>(),
    color: "black",
    backgroundColor: "transparent",
  };
  let spanOpen = false;

  chars.forEach((char, index) => {
    const targetState = positionStyles[index];

    // 스타일, 색상, 배경색 변경 확인
    const styleChanged =
      !setsEqual(currentState.styles, targetState.styles) ||
      currentState.color !== targetState.color ||
      currentState.backgroundColor !== targetState.backgroundColor;

    // 변경되었으면 현재 span 태그 닫기
    if (styleChanged && spanOpen) {
      html += "</span>";
      spanOpen = false;
    }

    // 새로운 스타일 조합으로 span 태그 열기
    if (styleChanged) {
      const className = getClassNames(targetState);
      html += `<span class="${className}">`;
      spanOpen = true;
    }

    // 텍스트 추가
    html += sanitizeText(char.value);

    // 다음 문자로 넘어가기 전에 현재 상태 업데이트
    currentState = targetState;

    // 마지막 문자이고 span이 열려있으면 닫기
    if (index === chars.length - 1 && spanOpen) {
      html += "</span>";
      spanOpen = false;
    }
  });

  // DOM 업데이트
  if (element.innerHTML !== html) {
    element.innerHTML = html;
  }
};

/*
const getClassNames = (styles: Set<string>): string => {
  // underline과 strikethrough가 함께 있는 경우 특별 처리
  if (styles.has("underline") && styles.has("strikethrough")) {
    return css({
      textDecoration: "underline line-through",
      fontWeight: styles.has("bold") ? "bold" : "normal",
      fontStyle: styles.has("italic") ? "italic" : "normal",
    });
  }

  // 일반적인 경우
  return css({
    textDecoration: styles.has("underline")
      ? "underline"
      : styles.has("strikethrough")
        ? "line-through"
        : "none",
    // textStyle 속성 대신 직접 스타일 지정
    fontWeight: styles.has("bold") ? "bold" : "normal",
    fontStyle: styles.has("italic") ? "italic" : "normal",
  });
};
*/

/*
export const setInnerHTML = ({ element, block }: SetInnerHTMLProps): void => {
  const chars = block.crdt.LinkedList.spread();
  if (chars.length === 0) {
    element.innerHTML = "";
    return;
  }

  // 각 위치별 모든 적용된 스타일을 추적
  const positionStyles: Set<string>[] = chars.map((_, index) => {
    const styleSet = new Set<string>();

    // 해당 위치에 적용되어야 하는 모든 스타일 수집
    chars.forEach((c, i) => {
      if (i === index) {
        c.style.forEach((style) => styleSet.add(TEXT_STYLES[style]));
      }
    });

    return styleSet;
  });

  let html = "";
  let currentStyles = new Set<string>();
  let spanOpen = false;

  chars.forEach((char, index) => {
    const targetStyles = positionStyles[index];

    // 스타일이 변경되었는지 확인
    const styleChanged = !setsEqual(currentStyles, targetStyles);

    // 스타일이 변경되었으면 현재 span 태그 닫기
    if (styleChanged && spanOpen) {
      html += "</span>";
      spanOpen = false;
    }

    // 새로운 스타일 조합으로 span 태그 열기
    if (styleChanged && targetStyles.size > 0) {
      const className = getClassNames(targetStyles);
      html += `<span class="${className}">`;
      spanOpen = true;
    }

    // 텍스트 추가
    html += sanitizeText(char.value);

    // 다음 문자로 넘어가기 전에 현재 스타일 상태 업데이트
    currentStyles = targetStyles;

    // 마지막 문자이고 span이 열려있으면 닫기
    if (index === chars.length - 1 && spanOpen) {
      html += "</span>";
      spanOpen = false;
    }
  });

  // DOM 업데이트
  if (element.innerHTML !== html) {
    element.innerHTML = html;
  }
};
*/

// Set 비교 헬퍼 함수
const setsEqual = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
};

const sanitizeText = (text: string): string => {
  return text
    .replace(/<br>/g, "&nbsp;")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// 배열 비교 헬퍼 함수
export const arraysEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.sort().every((val, idx) => val === b.sort()[idx]);
};
