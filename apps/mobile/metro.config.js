const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo so changes to packages/shared hot-reload.
config.watchFolders = [workspaceRoot];

// Resolve modules from the app first, then the workspace root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Don't try to resolve symlinks (npm workspaces hoists, no symlinks needed).
config.resolver.disableHierarchicalLookup = true;

module.exports = withNativeWind(config, {
  input: "./global.css",
});
