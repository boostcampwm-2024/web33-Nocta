import { ElementType } from "@noctaCrdt/Interfaces";
import { iconContainerStyle, iconStyle } from "./IconBlock.style";

interface IconBlockProps {
  type: ElementType;
  index: number | undefined;
  indent?: number;
}

export const IconBlock = ({ type, index = 1, indent = 0 }: IconBlockProps) => {
  const getIcon = () => {
    switch (type) {
      case "ul":
        return (
          <span className={iconStyle({ type: "ul" })}>
            {indent === 0 && "●"}
            {indent === 1 && "○"}
            {indent === 2 && "■"}
          </span>
        );
      case "ol":
        return <span className={iconStyle({ type: "ol" })}>{`${index}.`}</span>;
      case "checkbox":
        return <span className={iconStyle({ type: "checkbox" })} />;
      default:
        return null;
    }
  };

  const icon = getIcon();
  if (!icon) return null;

  return <div className={iconContainerStyle}>{icon}</div>;
};
