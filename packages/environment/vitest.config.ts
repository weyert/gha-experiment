import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
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
