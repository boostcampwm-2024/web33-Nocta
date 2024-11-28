import { defineConfig } from "@pandacss/dev";
import { radii } from "./src/styles/tokens/radii";
import { colors } from "./src/styles/tokens/color";
import { shadows } from "./src/styles/tokens/shadow";
import { spacing } from "./src/styles/tokens/spacing";
import { sizes } from "./src/styles/tokens/sizes";
import { textStyles } from "./src/styles/typography";
import { globalStyles } from "./src/styles/global";
import { glassContainerRecipe } from "./src/styles/recipes/glassContainerRecipe";

export default defineConfig({
  preflight: true,
  include: ["./src/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],
  exclude: [],
  globalCss: globalStyles,
  theme: {
    extend: {
      tokens: {
        sizes,
        colors,
        radii,
        shadows,
        spacing,
        fonts: {
          pretendard: { value: "Pretendard, sans-serif" },
        },
      },
      recipes: {
        glassContainer: glassContainerRecipe,
      },
      textStyles,
    },
  },
  outdir: "styled-system",
});
