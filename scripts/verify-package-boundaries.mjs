import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const repoRoot = new URL("..", import.meta.url);
const packageRoot = join(repoRoot.pathname, "packages", "autograph-feature");
const forbiddenPatterns = [
  /from\s+["']next-auth(?:\/react)?["']/,
  /import\s+["']next-auth(?:\/react)?["']/,
  /useSession\s*\(/,
  /signIn\s*\(/,
  /signOut\s*\(/,
  /\bauth\s*\(/,
];

const allowedFiles = new Set([
  join(packageRoot, "README.md"),
]);

function walk(dir) {
  const paths = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      paths.push(...walk(fullPath));
      continue;
    }

    if (!/\.(ts|tsx|js|jsx|md)$/.test(fullPath)) {
      continue;
    }

    paths.push(fullPath);
  }

  return paths;
}

const violations = [];

for (const filePath of walk(packageRoot)) {
  if (allowedFiles.has(filePath)) {
    continue;
  }

  const source = readFileSync(filePath, "utf8");

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(source)) {
      violations.push(`${filePath}: matched ${pattern}`);
    }
  }
}

if (violations.length > 0) {
  console.error("Auth boundary violation detected in @aartisr/autograph-feature:");
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log("@aartisr/autograph-feature auth boundary is clean.");
