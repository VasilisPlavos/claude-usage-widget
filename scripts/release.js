import { readFileSync, writeFileSync, createWriteStream } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import archiver from "archiver";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

const bumpType = process.argv[2] ?? null;
if (bumpType !== null && !["null", "patch", "minor", "major"].includes(bumpType)) {
  console.error("Usage: npm run release [null|patch|minor|major]");
  process.exit(1);
}

const pkgPath = join(ROOT, "package.json");
const manifestPath = join(ROOT, "manifest.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const shouldBump = bumpType && bumpType !== "null";
if (shouldBump) {
  const newVersion = bumpVersion(pkg.version, bumpType);
  pkg.version = newVersion;
  manifest.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Bumped to ${newVersion}`);
}

const version = pkg.version;
execSync("node scripts/build.js", { cwd: ROOT, stdio: "inherit" });

const zipPath = join(ROOT, "dist", `claude-usage-pip-v${version}.zip`);
const output = createWriteStream(zipPath);
const archive = archiver("zip", { zlib: { level: 9 } });
archive.on("error", (err) => { throw err; });
archive.pipe(output);
archive.directory(join(ROOT, "dist", "unpacked"), false);
output.on("close", () =>
  console.log(`dist/claude-usage-pip-v${version}.zip  (${archive.pointer()} bytes)`)
);
archive.finalize();
