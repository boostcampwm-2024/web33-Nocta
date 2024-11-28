import { PageIconType } from "@noctaCrdt/Interfaces";
import { iconComponents, IconConfig } from "@src/constants/PageIconButton.config";
import { iconButtonContainer } from "./IconButton.style";

interface IconButtonProps {
  icon: PageIconType | "plus";
  size: "sm" | "md";
  onClick?: () => void;
}

export const IconButton = ({ icon, size, onClick }: IconButtonProps) => {
  const { icon: IconComponent, color: defaultColor }: IconConfig = iconComponents[icon];

  return (
    <button className={iconButtonContainer({ size })} onClick={onClick}>
      <IconComponent color={defaultColor} size="24px" />
    </button>
  );
};
