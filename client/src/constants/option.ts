import { AnimationType, ElementType, TextStyleType } from "@noctaCrdt/Interfaces";

export const OPTION_CATEGORIES = {
  TYPE: {
    id: "type",
    label: "전환",
    options: [
      { id: "p", label: "기본" },
      { id: "h1", label: "제목 1" },
      { id: "h2", label: "제목 2" },
      { id: "h3", label: "제목 3" },
      { id: "ul", label: "리스트" },
      { id: "ol", label: "순서 리스트" },
      { id: "checkbox", label: "체크박스" },
      { id: "blockquote", label: "인용문" },
      { id: "hr", label: "구분선" },
    ] as { id: ElementType; label: string }[],
  },
  ANIMATION: {
    id: "animation",
    label: "애니메이션",
    options: [
      { id: "none", label: "없음" },
      { id: "highlight", label: "하이라이트" },
      { id: "gradation", label: "그라데이션" },
    ] as { id: AnimationType; label: string }[],
  },
  DUPLICATE: {
    id: "duplicate",
    label: "복제",
    options: null,
  },
  DELETE: {
    id: "delete",
    label: "삭제",
    options: null,
  },
};

export const TEXT_OPTION_CATEGORIES = {
  TYPE: {
    id: "textType",
    label: "글자",
    options: [
      { id: "bold", label: "굵게" },
      { id: "italic", label: "기울임" },
      { id: "underline", label: "밑줄" },
      { id: "strikethrough", label: "취소선" },
    ] as { id: TextStyleType; label: string }[],
  },
};

export type OptionCategory = keyof typeof OPTION_CATEGORIES;
export type TextOptionCategory = keyof typeof TEXT_OPTION_CATEGORIES;
