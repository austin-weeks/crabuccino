import { defineConfig } from "tsdown";

export default defineConfig({
  attw: {
    profile: "esm-only",
  },
  banner: {
    dts: `// crabuccino
//
// Distributed under the MPL-2.0 License
// ${new Date().toISOString()}
`,
    js: `// crabuccino
//
// Distributed under the MPL-2.0 License
// ${new Date().toISOString()}
`,
  },
  minify: true,
  dts: {
    tsgo: true,
  },
  exports: true,
});
