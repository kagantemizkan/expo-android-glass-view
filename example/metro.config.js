const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
const repositoryRoot = path.resolve(__dirname, '..');
config.watchFolders = [repositoryRoot];
config.resolver.nodeModulesPaths = [
  path.join(__dirname, 'node_modules'),
  path.join(repositoryRoot, 'node_modules'),
];

// Use one React / React Native instance even when the library has its own dev dependencies.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  ...Array.from(config.resolver.blockList ?? []),
  ...['react', 'react-native'].map(
    (name) => new RegExp(`${escapeRegex(path.join(repositoryRoot, 'node_modules', name))}[/\\\\].*`)
  ),
];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-android-glass-view') {
    return { type: 'sourceFile', filePath: path.join(repositoryRoot, 'src/index.ts') };
  }
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
