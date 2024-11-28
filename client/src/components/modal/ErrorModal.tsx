import { ErrorAlert } from "@components/lotties/ErrorAlert";
import { errorMessageItem, errorModalWrapper } from "./ErrorModal.style";
import { Modal } from "./modal";

interface ErrorScreenProps {
  errorMessage: string;
}

export const ErrorModal = ({ errorMessage }: ErrorScreenProps) => {
  return (
    <Modal
      isOpen
      primaryButtonLabel="새로고침"
      primaryButtonOnClick={() => {
        window.location.reload();
      }}
    >
      <div className={errorModalWrapper}>
        <ErrorAlert size={200} />
        오류가 발생했습니다.
        <br />
        <p className={errorMessageItem}>{errorMessage}</p>
      </div>
    </Modal>
  );
};

// <div className={overlay}>
//   <div className={`${glassContainer({ border: "lg" })} ${modalWrapper}`}>
//     <div className={animationContainer}>
//       <Player autoplay loop src={errorAlert} style={{ width: "100%", height: "100%" }} />
//     </div>

//     <div className={content}>
//       <h2 className={title}>오류가 발생했습니다.</h2>
//       <p className={message}>{errorMessage}</p>
//       <TextButton onClick={() => window.location.reload()} variant="primary">
//         새로고침
//       </TextButton>
//     </div>
//   </div>
// </div>
