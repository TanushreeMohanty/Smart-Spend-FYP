const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace roots
const projectRoot = __dirname;
// This goes up from apps/mobile to the root of your project
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Force Metro to resolve modules from both local and workspace node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Ensure Metro can find the shared package specifically
config.resolver.disableHierarchicalLookup = true;

// apps/mobile/metro.config.js
config.resolver.alias = {
  'lucide-react': 'lucide-react-native',
};

module.exports = config;