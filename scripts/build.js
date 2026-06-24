import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist", "unpacked");

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

cpSync(join(ROOT, "manifest.json"), join(OUT, "manifest.json"));
cpSync(join(ROOT, "src"), join(OUT, "src"), { recursive: true });

console.log("Built → dist/unpacked/");
