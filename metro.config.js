// Metro configuration for Expo SDK 54
// - Ensures nested expo node_modules are watched (Windows/OneDrive friendly)
// - Uses Expo defaults otherwise
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const expoNodeModules = path.join(projectRoot, 'node_modules', 'expo', 'node_modules');

const config = getDefaultConfig(projectRoot);

config.watchFolders = Array.from(
  new Set([...(config.watchFolders || []), projectRoot, expoNodeModules])
);

module.exports = config;
