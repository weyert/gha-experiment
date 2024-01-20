import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    reporters: ["junit", "verbose"],
    outputFile: {
      junit: "./coverage/junit.xml",
    },
    coverage: {
      reporter: ["json", "clover"],
      provider: "v8", // or 'v8'
      reportsDirectory: "./coverage",
      skipFull: true,
    },
  },
});
