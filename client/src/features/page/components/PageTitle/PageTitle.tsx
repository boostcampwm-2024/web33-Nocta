import { PageIconType } from "@noctaCrdt/Interfaces";
import { iconComponents } from "@src/constants/PageIconButton.config";
import { pageTitleContainer, pageTitle } from "./PageTitle.style";

interface PageTitleProps {
  title: string;
  icon: PageIconType;
}

export const PageTitle = ({ title, icon }: PageTitleProps) => {
  const { icon: IconComponent, color } = iconComponents[icon];
  return (
    <div className={pageTitleContainer}>
      <IconComponent color={color} size="24px" style={{ flexShrink: 0 }} />
      <p className={pageTitle}>{title || "Title"}</p>
    </div>
  );
};
