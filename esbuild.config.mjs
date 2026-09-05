import esbuild from "esbuild";
import process from "process";
import fs from "fs";
import path from "path";
import builtinModules from "builtin-modules";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const prod = process.argv[2] !== "dev";

const vaultPluginDir = path.resolve("../Obsidian WorkOS/.obsidian/plugins/workos-dashboard");
const localDistDir = path.resolve("./dist");

[vaultPluginDir, localDistDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Compile Tailwind CSS to styles.css
async function buildCss() {
  const cssSourcePath = path.resolve("./src/styles/tailwind.css");
  if (!fs.existsSync(cssSourcePath)) return;

  const css = fs.readFileSync(cssSourcePath, "utf8");
  const result = await postcss([tailwindcss, autoprefixer]).process(css, {
    from: cssSourcePath,
  });

  [vaultPluginDir, localDistDir].forEach(targetDir => {
    fs.writeFileSync(path.join(targetDir, "styles.css"), result.css, "utf8");
  });
  console.log("Tailwind CSS compiled successfully to styles.css!");
}

// Copy manifest.json
function copyManifest() {
  const manifestSrc = fs.existsSync(path.resolve("./manifest.json"))
    ? path.resolve("./manifest.json")
    : path.resolve("./src/manifest.json");
  if (fs.existsSync(manifestSrc)) {
    let content = fs.readFileSync(manifestSrc, "utf8");
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    [vaultPluginDir, localDistDir].forEach(targetDir => {
      fs.writeFileSync(path.join(targetDir, "manifest.json"), content, "utf8");
    });
  }
}

await buildCss();
copyManifest();

const context = await esbuild.context({
  banner: {
    js: `/* WorkOS Dashboard Plugin */\n`,
  },
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtinModules
  ],
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: path.join(vaultPluginDir, "main.js"),
});

if (prod) {
  await context.rebuild();
  await context.dispose();
  if (fs.existsSync(path.join(vaultPluginDir, "main.js"))) {
    fs.copyFileSync(path.join(vaultPluginDir, "main.js"), path.join(localDistDir, "main.js"));
  }
  console.log("Dashboard production build finished successfully!");
} else {
  await context.watch();
  console.log("Watching for changes...");
}
