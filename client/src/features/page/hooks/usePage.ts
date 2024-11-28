import { useEffect, useState } from "react";
import { PAGE, SIDE_BAR } from "@constants/size";
import { SPACING } from "@constants/spacing";
import { Position, Size } from "@src/types/page";
import { useIsSidebarOpen } from "@stores/useSidebarStore";

const PADDING = SPACING.MEDIUM * 2;
export const DIRECTIONS = [
  "top",
  "bottom",
  "left",
  "right",
  "topLeft",
  "topRight",
  "bottomLeft",
  "bottomRight",
] as const;

type Direction = (typeof DIRECTIONS)[number];

export const usePage = ({ x, y }: Position) => {
  const [position, setPosition] = useState<Position>({ x, y });
  const [size, setSize] = useState<Size>({
    width: PAGE.WIDTH,
    height: PAGE.HEIGHT,
  });

  const isSidebarOpen = useIsSidebarOpen();

  const getSidebarWidth = () => (isSidebarOpen ? SIDE_BAR.WIDTH : SIDE_BAR.MIN_WIDTH);

  useEffect(() => {
    // x 범위 넘어가면 x 위치 조정
    const sidebarWidth = getSidebarWidth();
    if (position.x > window.innerWidth - size.width - sidebarWidth - PADDING) {
      // 만약 최대화 상태라면(사이드바 열었을때, 사이드바가 화면을 가린다면), 포지션 0으로 바꾸고 width도 재조정
      // 만약 최대화가 아니라면, 포지션만 조정하고, 사이즈는 그대로
      if (size.width > window.innerWidth - sidebarWidth - PADDING) {
        setPosition({ x: 0, y: position.y });
        setSize({
          width: window.innerWidth - sidebarWidth - PADDING,
          height: size.height,
        });
      } else {
        setPosition({
          x: position.x - sidebarWidth + PADDING,
          y: position.y,
        });
        setSize({
          width: size.width,
          height: size.height,
        });
      }
    }
  }, [isSidebarOpen]);

  const pageDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleDragMove = (e: PointerEvent) => {
      const newX = Math.max(
        0,
        Math.min(window.innerWidth - size.width - getSidebarWidth() - PADDING, e.clientX - startX),
      );
      const newY = Math.max(
        0,
        Math.min(window.innerHeight - size.height - PADDING, e.clientY - startY),
      );
      setPosition({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      document.removeEventListener("pointermove", handleDragMove);
      document.removeEventListener("pointerup", handleDragEnd);
    };

    document.addEventListener("pointermove", handleDragMove);
    document.addEventListener("pointerup", handleDragEnd);
  };

  const pageResize = (e: React.MouseEvent, direction: Direction) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;
    const startPosition = { x: position.x, y: position.y };

    const resize = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosition.x;
      let newY = startPosition.y;

      switch (direction) {
        case "right": {
          newWidth = Math.min(
            window.innerWidth - startPosition.x - getSidebarWidth() - PADDING,
            Math.max(PAGE.MIN_WIDTH, startWidth + deltaX),
          );
          break;
        }

        case "left": {
          newWidth = Math.min(
            startPosition.x + startWidth,
            Math.max(PAGE.MIN_WIDTH, startWidth - deltaX),
          );
          newX = Math.max(0, startPosition.x + startWidth - newWidth);
          break;
        }

        case "bottom": {
          newHeight = Math.min(
            window.innerHeight - startPosition.y - PADDING,
            Math.max(PAGE.MIN_HEIGHT, startHeight + deltaY),
          );
          break;
        }

        case "top": {
          newHeight = Math.min(
            startPosition.y + startHeight,
            Math.max(PAGE.MIN_HEIGHT, startHeight - deltaY),
          );
          newY = Math.max(0, startPosition.y + startHeight - newHeight);
          break;
        }

        case "topLeft": {
          newHeight = Math.min(
            startPosition.y + startHeight,
            Math.max(PAGE.MIN_HEIGHT, startHeight - deltaY),
          );
          newY = Math.max(0, startPosition.y + startHeight - newHeight);

          newWidth = Math.min(
            startPosition.x + startWidth,
            Math.max(PAGE.MIN_WIDTH, startWidth - deltaX),
          );
          newX = Math.max(0, startPosition.x + startWidth - newWidth);
          break;
        }

        case "topRight": {
          newHeight = Math.min(
            startPosition.y + startHeight,
            Math.max(PAGE.MIN_HEIGHT, startHeight - deltaY),
          );
          newY = Math.max(0, startPosition.y + startHeight - newHeight);

          newWidth = Math.min(
            window.innerWidth - startPosition.x - getSidebarWidth() - PADDING,
            Math.max(PAGE.MIN_WIDTH, startWidth + deltaX),
          );
          break;
        }

        case "bottomLeft": {
          newHeight = Math.min(
            window.innerHeight - startPosition.y - PADDING,
            Math.max(PAGE.MIN_HEIGHT, startHeight + deltaY),
          );

          newWidth = Math.min(
            startPosition.x + startWidth,
            Math.max(PAGE.MIN_WIDTH, startWidth - deltaX),
          );
          newX = Math.max(0, startPosition.x + startWidth - newWidth);
          break;
        }

        case "bottomRight": {
          newHeight = Math.min(
            window.innerHeight - startPosition.y - PADDING,
            Math.max(PAGE.MIN_HEIGHT, startHeight + deltaY),
          );

          newWidth = Math.min(
            window.innerWidth - startPosition.x - getSidebarWidth() - PADDING,
            Math.max(PAGE.MIN_WIDTH, startWidth + deltaX),
          );
          break;
        }
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    };

    const stopResize = () => {
      document.removeEventListener("mousemove", resize);
      document.removeEventListener("mouseup", stopResize);
    };

    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", stopResize);
  };

  const pageMinimize = () => {
    setSize({
      width: PAGE.MIN_WIDTH,
      height: PAGE.MIN_HEIGHT,
    });
  };

  const pageMaximize = () => {
    setPosition({ x: 0, y: 0 });
    setSize({
      width: window.innerWidth - getSidebarWidth() - PADDING,
      height: window.innerHeight - PADDING,
    });
  };

  return {
    position,
    size,
    pageDrag,
    pageResize,
    pageMinimize,
    pageMaximize,
  };
};
