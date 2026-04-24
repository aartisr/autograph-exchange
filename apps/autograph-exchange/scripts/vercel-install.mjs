import { spawn } from "node:child_process";
import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm";
const PUBLIC_NPM_REGISTRY = "https://registry.npmjs.org/";
const TEMP_CONFIG_DIR = "/tmp/vercel-npm-config";

async function prepareTempNpmConfig() {
  await mkdir(TEMP_CONFIG_DIR, { recursive: true });

  const userConfigPath = path.join(TEMP_CONFIG_DIR, "user.npmrc");
  const globalConfigPath = path.join(TEMP_CONFIG_DIR, "global.npmrc");

  await Promise.all([
    writeFile(userConfigPath, "", "utf8"),
    writeFile(globalConfigPath, "", "utf8"),
  ]);

  return { userConfigPath, globalConfigPath };
}

function createSanitizedEnv({
  userConfigPath,
  globalConfigPath,
}) {
  const env = { ...process.env };

  for (const key of [
    "NPM_TOKEN",
    "NODE_AUTH_TOKEN",
    "NPM_RC",
    "NPM_CONFIG_USERCONFIG",
    "npm_config_userconfig",
    "NPM_CONFIG_GLOBALCONFIG",
    "npm_config_globalconfig",
    "NPM_CONFIG__AUTH",
    "npm_config__auth",
    "NPM_CONFIG__AUTHTOKEN",
    "npm_config__authtoken",
  ]) {
    delete env[key];
  }

  env.HOME = "/tmp";
  env.NPM_CONFIG_USERCONFIG = userConfigPath;
  env.npm_config_userconfig = userConfigPath;
  env.NPM_CONFIG_GLOBALCONFIG = globalConfigPath;
  env.npm_config_globalconfig = globalConfigPath;
  env.NPM_CONFIG_CACHE = "/tmp/.npm";
  env.npm_config_cache = "/tmp/.npm";
  env.NPM_CONFIG_REGISTRY = PUBLIC_NPM_REGISTRY;
  env.npm_config_registry = PUBLIC_NPM_REGISTRY;
  env.NPM_CONFIG_ALWAYS_AUTH = "false";
  env.npm_config_always_auth = "false";

  return env;
}

function run(command, args, env, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env,
      cwd: options.cwd,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? "unknown"}`));
    });
  });
}

async function pathExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveWorkspaceRoot() {
  const candidate = path.resolve(process.cwd(), "../..");
  const requiredFiles = [
    "package.json",
    "apps/autograph-exchange/package.json",
    "packages/autograph-contract/package.json",
    "packages/autograph-core/package.json",
    "packages/autograph-feature/package.json",
  ];

  for (const relativePath of requiredFiles) {
    if (!(await pathExists(path.join(candidate, relativePath)))) {
      return null;
    }
  }

  return candidate;
}

const tempConfig = await prepareTempNpmConfig();
const env = createSanitizedEnv(tempConfig);
const workspaceRoot = await resolveWorkspaceRoot();

if (workspaceRoot) {
  console.log(`[vercel-install] Installing Autograph workspace from ${workspaceRoot}`);
  await run(
    NPM_COMMAND,
    [
      "install",
      "--workspaces",
      "--include-workspace-root",
      "--include=dev",
      "--no-audit",
      "--no-fund",
      "--registry",
      PUBLIC_NPM_REGISTRY,
    ],
    env,
    { cwd: workspaceRoot },
  );
} else {
  console.log("[vercel-install] Workspace root not found; installing standalone app dependencies.");
  await run(
    NPM_COMMAND,
    [
      "install",
      "--include=dev",
      "--no-audit",
      "--no-fund",
      "--registry",
      PUBLIC_NPM_REGISTRY,
    ],
    env,
  );
}
