import { cva, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const textButtonContainer = ({ variant }: { variant: "primary" | "secondary" }) => {
  return cx(glassContainer({ border: "lg" }), textButton({ variant }));
};

const textButton = cva({
  base: {
    borderRadius: "md",
    width: "50%",
    paddingY: "4px",
    cursor: "pointer",
  },
  variants: {
    variant: {
      primary: {
        background: "white/35",
        _hover: {
          background: "white/40",
        },
      },
      secondary: {
        background: "transparent",
        _hover: {
          background: "white/10",
        },
      },
    },
  },
  defaultVariants: {
    variant: "primary",
  },
});
