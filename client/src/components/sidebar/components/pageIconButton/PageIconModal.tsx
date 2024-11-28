import { PageIconType } from "@noctaCrdt/Interfaces";
import { RiCloseLine } from "react-icons/ri";
import { iconGroups, iconComponents } from "@constants/PageIconButton.config";
import { css } from "@styled-system/css";
import { IconModal, IconModalContainer, IconModalClose, IconButton } from "./pageIconModal.style";

export interface PageIconModalProps {
  isOpen: boolean;
  onClose: (e: React.MouseEvent) => void;
  onSelect: (e: React.MouseEvent, type: PageIconType) => void;
  currentType: PageIconType;
}

export const PageIconModal = ({ onClose, onSelect, currentType }: PageIconModalProps) => {
  return (
    <div className={IconModal} onClick={onClose}>
      <div className={IconModalContainer} onClick={onClose}>
        <button onClick={onClose} className={IconModalClose}>
          <RiCloseLine width={16} height={16} />
        </button>
        <div>
          {iconGroups.map((group) => (
            <div
              key={group.title}
              className={css({
                marginBottom: "12px",
              })}
            >
              <div
                className={css({
                  display: "grid",
                  gap: "12px",
                  gridTemplateColumns: "repeat(3, 1fr)",
                })}
              >
                {group.icons.map((iconType) => {
                  const { icon: IconComponent, color } = iconComponents[iconType];
                  const isSelected = currentType === iconType;

                  return (
                    <button
                      key={iconType}
                      onClick={(e) => onSelect(e, iconType)}
                      className={IconButton(isSelected)}
                    >
                      <IconComponent color={color} size="24px" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
