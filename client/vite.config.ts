import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr()],
  resolve: {
    alias: { "@noctaCrdt": path.resolve(__dirname, "../@noctaCrdt") },
  },
  publicDir: "public",
});
