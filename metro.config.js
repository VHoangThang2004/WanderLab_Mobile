const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Sửa lỗi import.meta từ các thư viện ESM (như zustand, react-query)
config.resolver.sourceExts.push('mjs');

module.exports = config;
