import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        // enable react compiler
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
  build: {
    sourcemap: true,
    target: "esnext",
  },
});
