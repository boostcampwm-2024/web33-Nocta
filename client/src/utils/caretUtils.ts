import { BlockLinkedList, TextLinkedList } from "@noctaCrdt/LinkedList";
import { BlockId } from "@noctaCrdt/NodeId";

interface SetCaretPositionProps {
  blockId: BlockId;
  linkedList: BlockLinkedList | TextLinkedList;
  clientX?: number;
  clientY?: number;
  position?: number; // Used to set the caret at a specific position
  pageId: string; // Add rootElement to scope the query
}

export const getAbsoluteCaretPosition = (element: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection?.focusNode) return 0;

  // 실제 텍스트 내용만 추출하여 위치를 계산하는 함수
  const collectTextNodes = (root: Node): Text[] => {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        // 실제 텍스트 노드만 수집
        if (node.nodeType === Node.TEXT_NODE && node.textContent) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    });

    let node: Node | null;
    while ((node = walker.nextNode())) {
      nodes.push(node as Text);
    }
    return nodes;
  };

  // 모든 텍스트 노드 수집
  const textNodes = collectTextNodes(element);

  // focusNode가 텍스트 노드인 경우
  if (selection.focusNode.nodeType === Node.TEXT_NODE) {
    let position = 0;

    for (const node of textNodes) {
      if (node === selection.focusNode) {
        return position + selection.focusOffset;
      }
      position += node.textContent?.length || 0;
    }
  }

  // focusNode가 element인 경우
  if (selection.focusNode === element) {
    return selection.focusOffset;
  }

  // focusNode가 span인 경우
  if (selection.focusNode.nodeType === Node.ELEMENT_NODE) {
    let position = 0;
    const focusElement = selection.focusNode;

    for (const node of textNodes) {
      if (focusElement.contains(node)) {
        if (position + (node.textContent?.length || 0) >= selection.focusOffset) {
          return position + selection.focusOffset;
        }
        position += node.textContent?.length || 0;
      }
    }
  }

  return 0;
};

export const setCaretPosition = ({
  blockId,
  linkedList,
  position,
  pageId,
}: SetCaretPositionProps): void => {
  try {
    if (position === undefined) return;
    const selection = window.getSelection();
    if (!selection) return;

    const currentPage = document.getElementById(pageId);

    const blockElements = Array.from(
      currentPage?.querySelectorAll('.d_flex.pos_relative.w_full[data-group="true"]') || [],
    );

    const currentIndex = linkedList.spread().findIndex((b) => b.id === blockId);
    const targetElement = blockElements[currentIndex];
    if (!targetElement) return;

    const editableDiv = targetElement.querySelector('[contenteditable="true"]') as HTMLDivElement;
    if (!editableDiv) return;

    editableDiv.focus();

    let currentPosition = 0;
    let targetNode: Node | null = null;
    let targetOffset = 0;

    const walker = document.createTreeWalker(editableDiv, NodeFilter.SHOW_TEXT, {
      acceptNode: (node): number => {
        return node.nodeType === Node.TEXT_NODE && node.textContent !== "\n"
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_SKIP;
      },
    });

    let node: Node | null;
    while ((node = walker.nextNode())) {
      const length = node.textContent?.length || 0;
      if (currentPosition + length >= position) {
        targetNode = node;
        targetOffset = position - currentPosition;
        break;
      }
      currentPosition += length;
    }

    if (!targetNode) {
      // 마지막 텍스트 노드 찾기
      const textNodes = Array.from(editableDiv.querySelectorAll("*"))
        .flatMap((element) => Array.from(element.childNodes))
        .filter((node): node is Text => node.nodeType === Node.TEXT_NODE);

      const lastTextNode = textNodes.length > 0 ? textNodes[textNodes.length - 1] : editableDiv;

      targetNode = lastTextNode;
      targetOffset = lastTextNode.textContent?.length || 0;
    }

    // targetOffset이 targetNode의 텍스트 길이를 초과하지 않도록 보장
    if (targetNode.nodeType === Node.TEXT_NODE) {
      const textLength = targetNode.textContent?.length || 0;
      if (targetOffset > textLength) {
        targetOffset = textLength;
      }
    }

    const range = document.createRange();
    range.setStart(targetNode, targetOffset);
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  } catch (error) {
    console.error("Error setting caret position:", error);
  }
};
