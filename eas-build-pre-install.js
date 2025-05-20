// eas-build-pre-install.js
const { execSync } = require("child_process");

console.log("Running npm ci with --legacy-peer-deps");
execSync("npm ci --legacy-peer-deps", { stdio: "inherit" });
