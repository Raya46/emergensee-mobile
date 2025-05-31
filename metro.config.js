const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const {
  wrapWithReanimatedMetroConfig,
} = require("react-native-reanimated/metro-config");

const config = getDefaultConfig(__dirname);

const windConfig = withNativeWind(config, { input: "./global.css" });
const finalConfig = wrapWithReanimatedMetroConfig(windConfig);

module.exports = finalConfig;
