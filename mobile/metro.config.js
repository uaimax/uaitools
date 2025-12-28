// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Garantir que react-native-worklets seja resolvido corretamente
config.resolver.sourceExts.push('mjs', 'cjs');

module.exports = config;

