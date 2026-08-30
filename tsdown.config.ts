import { defineConfig } from "tsdown";

export default defineConfig({
  minify: true,
  dts: {
    tsgo: true,
  },
  exports: true,
  // ...config options
});
