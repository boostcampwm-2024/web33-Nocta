import { PageIconType } from "@noctaCrdt/Interfaces";
import { IconType } from "react-icons";
import { CgGym } from "react-icons/cg";
import { MdOutlinePlace } from "react-icons/md";
import {
  // 기본 문서 타입
  RiFileTextLine, // docs: 일반 문서
  RiStickyNoteLine, // note: 필기/메모
  RiBookReadLine, // wiki: 지식 베이스

  // 업무 관련
  RiProjectorLine, // project: 프로젝트
  RiTeamLine, // meeting: 회의록
  RiTaskLine, // task: 할일/작업

  // 개인 활동
  RiBookMarkedLine, // diary: 일기/저널
  RiQuillPenLine, // blog: 블로그

  // 학습 관련
  RiBookOpenLine, // study: 학습
  RiSearchLine, // research: 연구/조사
  RiBookmarkLine,

  // 협업 관련
  RiGroupLine, // team: 팀 문서
  RiDiscussLine, // feedback: 피드백
  RiAddFill, // plus: 추가
} from "react-icons/ri";

export interface IconConfig {
  icon: IconType;
  color: string;
}

export const iconComponents: Record<PageIconType | "plus", IconConfig> = {
  // 기본 문서 타입
  Docs: {
    icon: RiFileTextLine,
    color: "#2B4158",
  },
  Note: {
    icon: RiStickyNoteLine,
    color: "#FEA642",
  },
  Wiki: {
    icon: RiBookReadLine,
    color: "#A142FE",
  },

  // 업무 관련
  Project: {
    icon: RiProjectorLine,
    color: "#1BBF44",
  },
  Meeting: {
    icon: RiTeamLine,
    color: "#4E637C",
  },
  Task: {
    icon: RiTaskLine,
    color: "#F24150",
  },

  // 개인 활동
  Diary: {
    icon: RiBookMarkedLine,
    color: "#FF69B4",
  },
  Blog: {
    icon: RiQuillPenLine,
    color: "#99AFCA",
  },
  Entertain: {
    icon: CgGym,
    color: "#9ACD32",
  },

  // 학습 관련
  Study: {
    icon: RiBookOpenLine,
    color: "#4285F4",
  },
  Research: {
    icon: RiSearchLine,
    color: "#2B4158",
  },
  Book: {
    icon: RiBookmarkLine,
    color: "#8B4513",
  },

  // 협업 관련
  Team: {
    icon: RiGroupLine,
    color: "#FF8C00",
  },
  Shared: {
    icon: MdOutlinePlace,
    color: "#4285F4",
  },
  Feedback: {
    icon: RiDiscussLine,
    color: "#A142FE",
  },

  plus: {
    icon: RiAddFill,
    color: "#2B4158",
  },
};

export const iconGroups = [
  {
    title: "기본 문서",
    icons: ["Docs", "Note", "Wiki"] as PageIconType[],
  },
  {
    title: "업무 관련",
    icons: ["Project", "Meeting", "Task"] as PageIconType[],
  },
  {
    title: "개인 활동",
    icons: ["Diary", "Blog", "Entertain"] as PageIconType[],
  },
  {
    title: "학습 관련",
    icons: ["Study", "Research", "Book"] as PageIconType[],
  },
  {
    title: "협업 관련",
    icons: ["Team", "Shared", "Feedback"] as PageIconType[],
  },
];
