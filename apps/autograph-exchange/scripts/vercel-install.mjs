import { spawn } from "node:child_process";

const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm";
const PUBLIC_NPM_REGISTRY = "https://registry.npmjs.org/";

function createSanitizedEnv() {
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
  env.NPM_CONFIG_USERCONFIG = "/dev/null";
  env.npm_config_userconfig = "/dev/null";
  env.NPM_CONFIG_GLOBALCONFIG = "/dev/null";
  env.npm_config_globalconfig = "/dev/null";
  env.NPM_CONFIG_CACHE = "/tmp/.npm";
  env.npm_config_cache = "/tmp/.npm";
  env.NPM_CONFIG_REGISTRY = PUBLIC_NPM_REGISTRY;
  env.npm_config_registry = PUBLIC_NPM_REGISTRY;
  env.NPM_CONFIG_ALWAYS_AUTH = "false";
  env.npm_config_always_auth = "false";

  return env;
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env,
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

const env = createSanitizedEnv();

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
