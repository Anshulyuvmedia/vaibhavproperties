const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config");

const config = getDefaultConfig(__dirname);

// Apply NativeWind first, then wrap with Reanimated
module.exports = wrapWithReanimatedMetroConfig(withNativeWind(config, { input: "./app/globals.css" }));
