import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginLess } from "@rsbuild/plugin-less";
export default defineConfig({
  source: {
    transformImport: [
      {
        libraryName: "antd",
        libraryDirectory: "es",
        style: true,
      },
    ],
  },
  plugins: [
    pluginLess(),
    pluginReact({
      swcReactOptions: {
        runtime: "classic",
      },
    }),
  ],
});
