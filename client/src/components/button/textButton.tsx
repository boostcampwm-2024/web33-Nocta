import { textButtonContainer } from "./textButton.style";

interface TextButtonProps {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
  onClick?: () => void;
}

export const TextButton = ({ variant = "primary", children, onClick }: TextButtonProps) => {
  return (
    <button
      className={textButtonContainer({ variant })}
      onClick={onClick}
      data-onboarding="login-button"
    >
      {children}
    </button>
  );
};
