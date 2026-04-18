import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url).pathname;

const requiredFiles = [
  "README.md",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "LICENSE",
  ".github/CODEOWNERS",
  ".github/workflows/ci.yml",
  ".github/workflows/release-readiness.yml",
];

const packageFiles = [
  "package.json",
  "apps/autograph-exchange/package.json",
  "packages/autograph-feature/package.json",
  "packages/autograph-core/package.json",
  "packages/autograph-contract/package.json",
];

const violations = [];

for (const file of requiredFiles) {
  if (!existsSync(join(repoRoot, file))) {
    violations.push(`Missing required repository file: ${file}`);
  }
}

for (const file of packageFiles) {
  const fullPath = join(repoRoot, file);
  if (!existsSync(fullPath)) {
    violations.push(`Missing package metadata file: ${file}`);
    continue;
  }

  const pkg = JSON.parse(readFileSync(fullPath, "utf8"));

  if (pkg.author !== "aartisr (Aarti Sri Ravikumar)") {
    violations.push(`${file} must declare the owner as author.`);
  }

  if (pkg.license !== "UNLICENSED") {
    violations.push(`${file} must declare license UNLICENSED.`);
  }
}

if (violations.length > 0) {
  console.error("Repository hygiene violations detected:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("Repository hygiene is clean.");
