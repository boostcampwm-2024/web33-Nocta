import { Player } from "@lottiefiles/react-lottie-player";
import loadingAnimation from "@assets/lotties/loadingSpinner.json";

export const LoadingSpinner = ({ size = 200 }) => {
  return (
    <div style={{ width: size, height: size }}>
      <Player autoplay loop src={loadingAnimation} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};
