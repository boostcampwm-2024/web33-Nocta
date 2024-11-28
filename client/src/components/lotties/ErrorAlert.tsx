import { Player } from "@lottiefiles/react-lottie-player";
import errorAlert from "@assets/lotties/errorAlert.json";

export const ErrorAlert = ({ size = 200 }) => {
  return (
    <div style={{ width: size, height: size }}>
      <Player autoplay loop src={errorAlert} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};
