import { defineTheme } from "@astro-cms/theme";

export default defineTheme({
  name: "test-theme",
  layoutsDir: "./layouts",
  blocksDir: "./blocks",
  variables: {
    mainColor: { type: "color", default: "#000" },
    fontSize: { type: "number", default: 16 },
  },
});
