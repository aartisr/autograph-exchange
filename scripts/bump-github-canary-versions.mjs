import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PACKAGE_PATHS = [
  "packages/autograph-contract/package.json",
  "packages/autograph-core/package.json",
  "packages/autograph-feature/package.json",
];

function loadJson(relativePath) {
  const absolute = path.join(ROOT, relativePath);
  return {
    absolute,
    json: JSON.parse(fs.readFileSync(absolute, "utf8")),
  };
}

function saveJson(absolutePath, json) {
  fs.writeFileSync(absolutePath, `${JSON.stringify(json, null, 2)}\n`, "utf8");
}

function toCanaryVersion(version, runNumber, sha) {
  const base = version.split("-")[0];
  return `${base}-main.${runNumber}.${sha}`;
}

function main() {
  const runNumber = process.env.GITHUB_RUN_NUMBER ?? String(Date.now());
  const sha = (process.env.GITHUB_SHA ?? "local").slice(0, 7);

  for (const relativePath of PACKAGE_PATHS) {
    const { absolute, json } = loadJson(relativePath);
    const original = json.version;
    json.version = toCanaryVersion(original, runNumber, sha);
    saveJson(absolute, json);
    console.log(`[github-canary] ${json.name}: ${original} -> ${json.version}`);
  }
}

main();
