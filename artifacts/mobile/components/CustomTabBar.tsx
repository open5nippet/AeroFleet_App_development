/**
 * CustomTabBar — Neon-Morphism Responsive dual-layout (v6.1)
 *
 * v6.1 changes:
 *  - Fixed vertical SVG path logic for clearer "Side Rail" rendering.
 *  - Improved G-transform for left rail to handle safe area correctly.
 *  - Optimized animation axis handling for seamless rotation.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path, G } from 'react-native-svg';

// ─── Constants ────────────────────────────────────────────────────────────────
const BAR_SIZE     = 76;   // Thickness of the bar (height in P, width in L)
const OVERREACH    = 38;   // Space for the crater curves
const TOTAL_SIZE   = BAR_SIZE + OVERREACH;
const RAIL_THICKNESS = 56; // Narrow rail width for landscape

const NOTCH_HALF_W = 68;
const NOTCH_DEPTH  = 30;

const FLOAT_DIST   = 14;   // Distance active icon floats into the notch

const BAR_COLOR    = '#1A1F3C';
const NEON         = '#00E5FF';
const INACTIVE     = 'rgba(148, 157, 213, 0.55)';

/**
 * Responsive offset for screens to avoid the navigation bar.
 */
export const TAB_BAR_OFFSET = TOTAL_SIZE + 8;

// ─── Custom Icons ─────────────────────────────────────────────────────────────
function CustomMapIcon({ color, size }: { color: string; size: number }) {
  const scale = size / 24;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G scale={scale}>
        <Path
          d="M12,2 C8.13,2 5,5.13 5,9 C5,14.25 12,22 12,22 C12,22 19,14.25 19,9 C19,5.13 15.87,2 12,2 Z M12,13 C9.79,13 8,11.21 8,9 C8,6.79 9.79,5 12,5 C14.21,5 16,6.79 16,9 C16,11.21 14.21,13 12,13 Z"
          fill={color}
          fillRule="evenodd"
        />
      </G>
    </Svg>
  );
}

// ─── Tab metadata ─────────────────────────────────────────────────────────────
type TabDef = { lib: 'ionicons' | 'feather' | 'custom'; icon: string; label: string };
const TABS: Record<string, TabDef> = {
  dashboard: { lib: 'ionicons', icon: 'speedometer-outline', label: 'Dashboard' },
  camera:    { lib: 'feather',  icon: 'video',               label: 'Camera'    },
  map:       { lib: 'custom',   icon: 'custom-map',          label: 'Map'       },
  events:    { lib: 'ionicons', icon: 'warning-outline',     label: 'Events'    },
  profile:   { lib: 'feather',  icon: 'user',                label: 'Profile'   },
};

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const def = TABS[name];
  if (!def) return <Ionicons name="help-circle-outline" size={size} color={color} />;
  if (def.lib === 'custom') return <CustomMapIcon color={color} size={size} />;
  if (def.lib === 'feather') return <Feather name={def.icon as any} size={size} color={color} />;
  return <Ionicons name={def.icon as any} size={size} color={color} />;
}

// ─── SVG Path Builders ────────────────────────────────────────────────────────
function buildHorizontalPath(cx: number, screenW: number, extraB: number): string {
  const top = OVERREACH;
  const deep = top + NOTCH_DEPTH;
  const w = NOTCH_HALF_W;
  const lx = cx - w;
  const rx = cx + w;
  const bot = TOTAL_SIZE + extraB;

  return [
    `M 0 ${bot} L 0 ${top} L ${lx} ${top}`,
    `C ${lx + w * 0.45} ${top}, ${cx - w * 0.18} ${deep}, ${cx} ${deep}`,
    `C ${cx + w * 0.18} ${deep}, ${rx - w * 0.45} ${top}, ${rx} ${top}`,
    `L ${screenW} ${top} L ${screenW} ${bot} Z`,
  ].join(' ');
}

function buildVerticalPath(cy: number, screenH: number): string {
  const left = OVERREACH; 
  const right = TOTAL_SIZE;

  // In landscape (narrow rail), use a simple straight edge instead of curved notch
  // This gives a cleaner, modern look for the narrow vertical rail
  return [
    `M ${right} 0 L ${left} 0 L ${left} ${screenH} L ${right} ${screenH} Z`,
  ].join(' ');
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { state: any; descriptors: any; navigation: any; }

export const CustomTabBar = ({ state, descriptors, navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isLandscape = screenW > screenH;
  
  const n = state.routes.length;
  const itemSize = isLandscape ? screenH / n : screenW / n;

  const notchPos = useRef(new Animated.Value(state.index * itemSize + itemSize / 2)).current;
  const floatAnims = useRef<Animated.Value[]>(
    state.routes.map((_: any, i: number) => new Animated.Value(i === state.index ? FLOAT_DIST : 0))
  ).current;
  const labelScale = useRef<Animated.Value[]>(
    state.routes.map((_: any) => new Animated.Value(1))
  ).current;

  const [svgPath, setSvgPath] = React.useState('');

  useEffect(() => {
    const updatePath = (pos: number) => {
      if (isLandscape) {
        setSvgPath(buildVerticalPath(pos, screenH));
      } else {
        setSvgPath(buildHorizontalPath(pos, screenW, insets.bottom));
      }
    };
    const id = notchPos.addListener(({ value }) => updatePath(value));
    updatePath(state.index * itemSize + itemSize / 2);
    return () => notchPos.removeListener(id);
  }, [isLandscape, screenW, screenH, insets.bottom, itemSize]);

  const prevIndex = useRef(state.index);

  useEffect(() => {
    const next = state.index;
    const prev = prevIndex.current;
    notchPos.stopAnimation();
    if (prev === next) {
      notchPos.setValue(next * itemSize + itemSize / 2);
    } else {
      Animated.spring(notchPos, {
        toValue: next * itemSize + itemSize / 2,
        damping: 20, stiffness: 130, mass: 0.9, useNativeDriver: false,
      }).start();
      Animated.spring(floatAnims[prev], { toValue: 0, damping: 14, stiffness: 110, useNativeDriver: true }).start();
      Animated.spring(floatAnims[next], { toValue: FLOAT_DIST, damping: 14, stiffness: 110, useNativeDriver: true }).start();
      Animated.sequence([
        Animated.timing(labelScale[next], { toValue: 0.88, duration: 80, useNativeDriver: true }),
        Animated.spring(labelScale[next], { toValue: 1, damping: 10, stiffness: 180, useNativeDriver: true }),
      ]).start();
    }
    prevIndex.current = next;
  }, [state.index, itemSize, isLandscape]);

  return (
    <View
      style={[
        styles.wrapper,
        isLandscape 
          ? { top: insets.top, bottom: 0, left: 0, width: TOTAL_SIZE + insets.left }
          : { bottom: 0, left: 0, right: 0, height: TOTAL_SIZE + insets.bottom }
      ]}
    >
      <Svg
        width={isLandscape ? TOTAL_SIZE + insets.left : screenW}
        height={isLandscape ? screenH : TOTAL_SIZE + insets.bottom}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <G transform={isLandscape ? `translate(${insets.left}, 0) scale(-1, 1) translate(-${TOTAL_SIZE}, 0)` : ''}>
           <Path d={svgPath} fill="rgba(0,0,0,0.3)" transform={isLandscape ? 'translate(-3, 0)' : 'translate(0, 3)'} />
           <Path d={svgPath} fill={BAR_COLOR} />
        </G>
      </Svg>

      <View
        style={[
          isLandscape ? styles.colContainer : styles.rowContainer,
          isLandscape 
            ? { paddingLeft: insets.left, paddingTop: insets.top, width: RAIL_THICKNESS + insets.left }
            : { paddingBottom: insets.bottom, height: BAR_SIZE + insets.bottom }
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const label = TABS[route.name]?.label ?? route.name;
          const activeColor = isFocused ? NEON : INACTIVE;

          return (
            <Pressable 
              key={route.key} 
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }} 
              style={styles.tabItem}
            >
              <Animated.View
                style={[
                  styles.iconSlot,
                  { 
                    transform: [
                      isLandscape ? { translateX: floatAnims[index] } : { translateY: Animated.multiply(floatAnims[index], -1) }
                    ] 
                  },
                ]}
              >
                <TabIcon name={route.name} color={activeColor} size={isFocused ? 26 : 22} />
              </Animated.View>
              {!isLandscape && (
                <Animated.Text
                  style={[
                    styles.label,
                    { color: activeColor, transform: [{ scale: labelScale[index] }], fontWeight: isFocused ? '700' : '400' },
                  ]}
                >
                  {label}
                </Animated.Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', zIndex: 9999, elevation: 24, backgroundColor: 'transparent', overflow: 'visible' },
  rowContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', overflow: 'visible' },
  colContainer: { position: 'absolute', left: 0, top: 0, bottom: 0, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'visible' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%', padding: 10, overflow: 'visible' },
  iconSlot: { alignItems: 'center', justifyContent: 'center', width: 44, height: 44 },
  label: { fontSize: 10, letterSpacing: 0.4, textTransform: 'capitalize', marginTop: 3 },
});
