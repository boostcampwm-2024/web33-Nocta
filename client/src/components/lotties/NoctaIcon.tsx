import { Player } from "@lottiefiles/react-lottie-player";
import noctaIcon from "@assets/lotties/noctaDayIcon.json";

export const NoctaIcon = ({ size = 200 }) => {
  return (
    <div style={{ width: size, height: size }}>
      <Player autoplay loop src={noctaIcon} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};
