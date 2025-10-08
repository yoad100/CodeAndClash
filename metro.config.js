// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Minimal fix for SHA-1 issue without breaking functionality
config.resolver = {
  ...config.resolver,
  symlinks: false,
};

module.exports = config;
