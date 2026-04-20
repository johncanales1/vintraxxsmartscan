module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // react-native-worklets-core transforms `'worklet'`-tagged functions so they
  // can run on the vision-camera frame-processor thread. Required by the
  // text-recognition frame processor plugin.
  plugins: [
    'react-native-worklets-core/plugin',
  ],
};
