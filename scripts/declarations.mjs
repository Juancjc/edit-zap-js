import { writeFileSync } from "node:fs";
for (const [name, path] of Object.entries({
  index: "editor",
  core: "core",
  vue: "vue",
  react: "react",
}))
  writeFileSync(
    `dist/${name}.d.ts`,
    `export * from './types/${path}/src/index.js';\n`,
  );
