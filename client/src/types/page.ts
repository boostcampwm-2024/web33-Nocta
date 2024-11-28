import { serializedEditorDataProps, PageIconType } from "@noctaCrdt/Interfaces";

export interface Page {
  id: string;
  title: string;
  icon: PageIconType;
  x: number;
  y: number;
  zIndex: number;
  isActive: boolean;
  isVisible: boolean;
  isLoaded: boolean;
  serializedEditorData: serializedEditorDataProps | null;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}
