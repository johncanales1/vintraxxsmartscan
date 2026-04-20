// Modern radial light-ray scanning animation for VinTraxx SmartScan
// Renders tapered colored rays emanating from the centre, paired with a pulsing
// radial glow, to suggest an active scanning / radar sweep behind the star.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

interface RadialLightRaysProps {
  size?: number;
  // Inner radius (distance from centre where the ray base starts).
  innerRadius?: number;
  // How far the rays extend from the centre.
  rayReach?: number;
  active?: boolean;
}

const PRIMARY_PALETTE = [
  '#FFD700', // gold
  '#DC2626', // red
  '#2563EB', // blue
  '#60A5FA', // light blue
  '#F59E0B', // amber
  '#10B981', // teal
];

const ACCENT_PALETTE = [
  '#FFFFFF',
  '#60A5FA',
  '#FFD700',
  '#F59E0B',
];

const PRIMARY_RAY_COUNT = 12;
const ACCENT_RAY_COUNT = 12;

export const RadialLightRays: React.FC<RadialLightRaysProps> = ({
  size = 240,
  innerRadius = 42,
  rayReach,
  active = true,
}) => {
  const rotationSlow = useRef(new Animated.Value(0)).current;
  const rotationFast = useRef(new Animated.Value(0)).current;

  // Three staggered pulses for a continuous outward-sweep feel.
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  const half = size / 2;
  const reach = rayReach ?? half - 12;

  useEffect(() => {
    if (!active) {
      return;
    }

    const slow = Animated.loop(
      Animated.timing(rotationSlow, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const fast = Animated.loop(
      Animated.timing(rotationFast, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const makePulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const p1 = makePulse(pulse1, 0);
    const p2 = makePulse(pulse2, 600);
    const p3 = makePulse(pulse3, 1200);

    slow.start();
    fast.start();
    p1.start();
    p2.start();
    p3.start();

    return () => {
      slow.stop();
      fast.stop();
      p1.stop();
      p2.stop();
      p3.stop();
      rotationSlow.setValue(0);
      rotationFast.setValue(0);
      pulse1.setValue(0);
      pulse2.setValue(0);
      pulse3.setValue(0);
    };
  }, [active, rotationSlow, rotationFast, pulse1, pulse2, pulse3]);

  const slowRotate = rotationSlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const fastRotate = rotationFast.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const renderRaysSvg = (
    palette: string[],
    rayCount: number,
    rayWidth: number,
    baseOpacity: number,
    idPrefix: string,
  ) => {
    const rayLength = reach - innerRadius;
    return (
      <Svg width={size} height={size}>
        <Defs>
          {palette.map((color, idx) => (
            <LinearGradient
              key={`${idPrefix}-grad-${idx}`}
              id={`${idPrefix}-grad-${idx}`}
              x1="0.5"
              y1="1"
              x2="0.5"
              y2="0"
            >
              <Stop offset="0" stopColor={color} stopOpacity="0.95" />
              <Stop offset="0.55" stopColor={color} stopOpacity="0.35" />
              <Stop offset="1" stopColor={color} stopOpacity="0" />
            </LinearGradient>
          ))}
        </Defs>
        {Array.from({ length: rayCount }).map((_, i) => {
          const angle = (i * 360) / rayCount;
          const gradIdx = i % palette.length;
          return (
            <G key={`${idPrefix}-ray-${i}`} transform={`rotate(${angle} ${half} ${half})`}>
              <Rect
                x={half - rayWidth / 2}
                y={half - reach}
                width={rayWidth}
                height={rayLength}
                rx={rayWidth / 2}
                ry={rayWidth / 2}
                fill={`url(#${idPrefix}-grad-${gradIdx})`}
                opacity={baseOpacity}
              />
            </G>
          );
        })}
      </Svg>
    );
  };

  const renderPulse = (val: Animated.Value, key: string) => {
    // scale: 0.2 → 1.15, opacity: 0.75 → 0 (fades out as it expands)
    const scale = val.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.15] });
    const opacity = val.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.75, 0] });
    return (
      <Animated.View
        key={key}
        style={[StyleSheet.absoluteFill, { transform: [{ scale }], opacity }]}
        pointerEvents="none"
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient
              id={`pulse-grad-${key}`}
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="50%"
              fy="50%"
            >
              <Stop offset="0" stopColor="#FFD700" stopOpacity="0.55" />
              <Stop offset="0.45" stopColor="#DC2626" stopOpacity="0.28" />
              <Stop offset="0.8" stopColor="#2563EB" stopOpacity="0.12" />
              <Stop offset="1" stopColor="#2563EB" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={half} cy={half} r={half} fill={`url(#pulse-grad-${key})`} />
        </Svg>
      </Animated.View>
    );
  };

  return (
    <View
      style={[styles.container, { width: size, height: size }]}
      pointerEvents="none"
    >
      {/* Staggered outward pulses */}
      {renderPulse(pulse1, 'p1')}
      {renderPulse(pulse2, 'p2')}
      {renderPulse(pulse3, 'p3')}

      {/* Slow clockwise primary rays */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: slowRotate }] }]}
        pointerEvents="none"
      >
        {renderRaysSvg(PRIMARY_PALETTE, PRIMARY_RAY_COUNT, 10, 1, 'primary')}
      </Animated.View>

      {/* Fast counter-clockwise accent rays (narrower, softer) */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ rotate: fastRotate }] }]}
        pointerEvents="none"
      >
        {renderRaysSvg(ACCENT_PALETTE, ACCENT_RAY_COUNT, 4, 0.55, 'accent')}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
