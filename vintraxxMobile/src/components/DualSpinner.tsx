import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface DualSpinnerProps {
  size?: number;
  color?: string;
}

export const DualSpinner: React.FC<DualSpinnerProps> = ({ 
  size = 80, 
  color = colors.background.dark 
}) => {
  const outerSpinValue = useRef(new Animated.Value(0)).current;
  const innerSpinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Outer spinner - clockwise
    const outerSpin = Animated.loop(
      Animated.timing(outerSpinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );

    // Inner spinner - counter-clockwise
    const innerSpin = Animated.loop(
      Animated.timing(innerSpinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );

    outerSpin.start();
    innerSpin.start();

    return () => {
      outerSpin.stop();
      innerSpin.stop();
    };
  }, [outerSpinValue, innerSpinValue]);

  const outerSpinInterpolate = outerSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const innerSpinInterpolate = innerSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'], // Reverse direction
  });

  const outerSize = size;
  const innerSize = size * 0.6;
  const strokeWidth = size * 0.08;

  return (
    <View style={[styles.container, { width: outerSize, height: outerSize }]}>
      {/* Outer Spinner */}
      <Animated.View
        style={[
          styles.spinner,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            borderWidth: strokeWidth,
            borderTopColor: color,
            borderRightColor: color,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate: outerSpinInterpolate }],
          },
        ]}
      />
      
      {/* Inner Spinner */}
      <Animated.View
        style={[
          styles.spinner,
          styles.innerSpinner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            borderWidth: strokeWidth * 0.8,
            borderTopColor: 'transparent',
            borderRightColor: 'transparent',
            borderBottomColor: `${color}A0`,
            borderLeftColor: `${color}A0`,
            transform: [{ rotate: innerSpinInterpolate }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    position: 'absolute',
  },
  innerSpinner: {
    // Inner spinner is positioned absolutely and centered
  },
});
