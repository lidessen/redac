import { build, emptyDir } from "dnt/mod.ts";
import { VERSION } from "../version.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts", "./react.ts", "./preact.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  importMap: "./import_map.json",
  packageManager: "pnpm",
  test: false,
  compilerOptions: {
    lib: ["dom", "esnext"],
  },
  package: {
    name: "redac",
    version: VERSION,
    description: "React to your data and actions",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/ztytotoro/redac.git",
    },
    bugs: {
      url: "https://github.com/ztytotoro/redac/issues",
    },
    devDependencies: {
      "@types/react": "^18.0.17",
    },
  },
});

Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
