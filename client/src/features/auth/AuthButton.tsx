import { useLogoutMutation } from "@apis/auth";
import { TextButton } from "@components/button/textButton";
import { Modal } from "@components/modal/modal";
import { useModal } from "@components/modal/useModal";
import { useCheckLogin } from "@stores/useUserStore";
import { AuthModal } from "./AuthModal";
import { container } from "./AuthButton.style";

export const AuthButton = () => {
  const isLogin = useCheckLogin();

  const {
    isOpen: isAuthModalOpen,
    openModal: openAuthModal,
    closeModal: closeAuthModal,
  } = useModal();

  const {
    isOpen: isLogoutModalOpen,
    openModal: openLogoutModal,
    closeModal: closeLogoutModal,
  } = useModal();

  const { mutate: logout } = useLogoutMutation(closeLogoutModal);

  return (
    <div className={container}>
      {isLogin ? (
        <TextButton onClick={openLogoutModal} variant="secondary">
          로그아웃
        </TextButton>
      ) : (
        <TextButton onClick={openAuthModal} variant="secondary">
          로그인
        </TextButton>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
      <Modal
        isOpen={isLogoutModalOpen}
        primaryButtonLabel="로그아웃"
        primaryButtonOnClick={logout}
        secondaryButtonLabel="취소"
        secondaryButtonOnClick={closeLogoutModal}
      >
        <p>로그아웃 하시겠습니까?</p>
      </Modal>
    </div>
  );
};
