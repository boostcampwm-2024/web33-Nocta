import { useUserInfo } from "@stores/useUserStore";
import { menuItemWrapper, textBox } from "./MenuButton.style";
import { MenuIcon } from "./components/MenuIcon";

export const MenuButton = () => {
  const { name } = useUserInfo();

  return (
    <>
      <button className={menuItemWrapper}>
        <MenuIcon />
        <p className={textBox}>{name ?? "Nocta"}</p>
      </button>
    </>
  );
};
