import NoctaDayIcon from "@assets/icons/noctaDayIcon.svg?react";
// import { noctaNightIcon } from "@assets/icons/noctaNightIcon.svg";
import { iconContainer } from "./MenuIcon.style";

export const MenuIcon = () => {
  // const { isDarkMode } = useThemeStore();

  // const [isSystemDark, setIsSystemDark] = useState(() =>
  //   window.matchMedia('(prefers-color-scheme: dark)').matches
  // );

  // useEffect(() => {
  //   const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  //   const handleChange = (e: MediaQueryListEvent) => {
  //     setIsSystemDark(e.matches);
  //   };

  //   mediaQuery.addEventListener('change', handleChange);
  //   return () => mediaQuery.removeEventListener('change', handleChange);
  // }, []);

  // const currentIcon = (isDarkMode ?? isSystemDark) ? noctaNightIcon : noctaDayIcon;

  return (
    <div className={iconContainer}>
      <NoctaDayIcon />
    </div>
  );
};
