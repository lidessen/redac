import { build, emptyDir } from "https://deno.land/x/dnt@0.30.0/mod.ts";
import { VERSION } from "../version.ts";

await emptyDir("./npm");

await build({
  entryPoints: ["./mod.ts"],
  outDir: "./npm",
  shims: {
    deno: true,
  },
  packageManager: "pnpm",
  test: false,
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
      "@types/use-sync-external-store": "^0.0.3",
    },
  },
  mappings: {
    "https://esm.sh/use-sync-external-store@1.2.0/shim": {
      name: "use-sync-external-store",
      version: "^1.2.0",
      subPath: "shim",
      peerDependency: true,
    },
  },
});

Deno.copyFileSync("LICENSE", "npm/LICENSE");
Deno.copyFileSync("README.md", "npm/README.md");
