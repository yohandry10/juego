import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [
          { name: "react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          { name: "validation", test: /node_modules[\\/]zod[\\/]/ },
          { name: "world-data", test: /src[\\/]data[\\/]world-(actors|organizations)\.json/ },
        ] },
      },
    },
  },
});
