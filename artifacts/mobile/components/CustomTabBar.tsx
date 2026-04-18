/**
 * CustomTabBar — Neon-Morphism Floating Notch (v4)
 *
 * v4 changes:
 *  - Text always visible (inactive = lavender, active = neon cyan)
 *  - Scale spring animation on text when tab is tapped
 *  - Float height capped so icon stays within dark bar background
 *  - High zIndex + elevation to always render on top of app content
 *  - Exports TAB_BAR_BOTTOM_OFFSET for use in screen paddingBottom
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

// ─── Constants (exported so screens can set correct paddingBottom) ─────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BAR_HEIGHT   = 76;   // bar body height
const OVERREACH    = 38;   // canvas space above bar that the crater curve uses
const TOTAL_SVG_H  = BAR_HEIGHT + OVERREACH;  // = 114

// Geometry: the icon float must NOT exceed this so it stays on the dark bg.
// Crater deepest point is at (OVERREACH + NOTCH_DEPTH) = 68 from SVG top.
// Icon center at rest is at TOTAL_SVG_H/2 ≈ 57 from rowContainer top + OVERREACH from SVG top = ~95.
// Safe float = 95 - (68 + half_icon_height=13) = 14px max.
const FLOAT_Y      = -14;  // safe upward float — stays inside the dark crater

// Curve geometry
const NOTCH_HALF_W = 68;
const NOTCH_DEPTH  = 30;

// Brand palette — always dark, never changes with theme
const BAR_COLOR  = '#1A1F3C';
const NEON       = '#00E5FF';
const INACTIVE   = 'rgba(148, 157, 213, 0.55)';

/**
 * Exported constant — add this as paddingBottom to your screen ScrollViews
 * so content doesn't scroll under the nav bar.
 * Usage:  contentContainerStyle={{ paddingBottom: TAB_BAR_BOTTOM_OFFSET }}
 */
export const TAB_BAR_BOTTOM_OFFSET = TOTAL_SVG_H + 8; // 122px

// ─── Tab metadata ─────────────────────────────────────────────────────────────
type TabDef = { lib: 'ionicons' | 'feather'; icon: string; label: string };
const TABS: Record<string, TabDef> = {
  dashboard: { lib: 'ionicons', icon: 'speedometer-outline', label: 'Dashboard' },
  camera:    { lib: 'feather',  icon: 'video',               label: 'Camera'    },
  map:       { lib: 'ionicons', icon: 'map-outline',         label: 'Map'       },
  events:    { lib: 'ionicons', icon: 'warning-outline',     label: 'Events'    },
  profile:   { lib: 'feather',  icon: 'user',                label: 'Profile'   },
};

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const def = TABS[name];
  if (!def) return <Ionicons name="help-circle-outline" size={size} color={color} />;
  if (def.lib === 'feather') return <Feather name={def.icon as any} size={size} color={color} />;
  return <Ionicons name={def.icon as any} size={size} color={color} />;
}

// ─── SVG Path Builder ─────────────────────────────────────────────────────────
function buildNotchPath(cx: number, extraBottom: number = 0): string {
  const top  = OVERREACH;
  const deep = top + NOTCH_DEPTH;
  const w    = NOTCH_HALF_W;
  const lx   = cx - w;
  const rx   = cx + w;
  const bot  = TOTAL_SVG_H + extraBottom;

  // Wide Bezier control points → smooth wave, not sharp bite
  const cpL_x1 = lx + w * 0.45;  const cpL_y1 = top;
  const cpL_x2 = cx - w * 0.18;  const cpL_y2 = deep;
  const cpR_x1 = cx + w * 0.18;  const cpR_y1 = deep;
  const cpR_x2 = rx - w * 0.45;  const cpR_y2 = top;

  return [
    `M 0 ${bot}`,
    `L 0 ${top}`,
    `L ${lx} ${top}`,
    `C ${cpL_x1} ${cpL_y1}, ${cpL_x2} ${cpL_y2}, ${cx} ${deep}`,
    `C ${cpR_x1} ${cpR_y1}, ${cpR_x2} ${cpR_y2}, ${rx} ${top}`,
    `L ${SCREEN_WIDTH} ${top}`,
    `L ${SCREEN_WIDTH} ${bot}`,
    `Z`,
  ].join(' ');
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props { state: any; descriptors: any; navigation: any; }

export const CustomTabBar = ({ state, descriptors, navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const n      = state.routes.length;
  const TAB_W  = SCREEN_WIDTH / n;

  // Notch X position — drives the SVG path rebuild frame by frame
  const notchX = useRef(
    new Animated.Value(state.index * TAB_W + TAB_W / 2)
  ).current;

  // Per-icon: upward float into crater
  const floatY = useRef<Animated.Value[]>(
    state.routes.map((_: any, i: number) =>
      new Animated.Value(i === state.index ? FLOAT_Y : 0)
    )
  ).current;

  // Per-icon: label scale for tactile tap spring
  const labelScale = useRef<Animated.Value[]>(
    state.routes.map(() => new Animated.Value(1))
  ).current;

  // Live SVG path string (rebuilt on every notchX frame)
  const [svgPath, setSvgPath] = React.useState(() =>
    buildNotchPath(state.index * TAB_W + TAB_W / 2, insets.bottom)
  );

  const prevIndex = useRef(state.index);

  // Rebuild SVG path as notchX animates
  useEffect(() => {
    const id = notchX.addListener(({ value }) => {
      setSvgPath(buildNotchPath(value, insets.bottom));
    });
    return () => notchX.removeListener(id);
  }, [insets.bottom]);

  // Animate on tab change
  useEffect(() => {
    const prev = prevIndex.current;
    const next = state.index;
    if (prev === next) return;
    prevIndex.current = next;

    // Slide notch along bar top edge
    Animated.spring(notchX, {
      toValue: next * TAB_W + TAB_W / 2,
      damping: 20,
      stiffness: 130,
      mass: 0.9,
      useNativeDriver: false,
    }).start();

    // Previous icon: drop back down
    Animated.spring(floatY[prev], {
      toValue: 0,
      damping: 14,
      stiffness: 110,
      useNativeDriver: true,
    }).start();

    // New active icon: float up to safe height
    Animated.spring(floatY[next], {
      toValue: FLOAT_Y,
      damping: 14,
      stiffness: 110,
      useNativeDriver: true,
    }).start();

    // Tactile scale spring on NEW tab label
    Animated.sequence([
      Animated.timing(labelScale[next], {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(labelScale[next], {
        toValue: 1,
        damping: 10,
        stiffness: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [state.index]);

  return (
    <View
      style={[
        styles.wrapper,
        { height: TOTAL_SVG_H + insets.bottom, bottom: 0 },
      ]}
    >
      {/* ── SVG bar shape ── */}
      <Svg
        width={SCREEN_WIDTH}
        height={TOTAL_SVG_H + insets.bottom}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {/* depth shadow */}
        <Path d={svgPath} fill="rgba(0,0,0,0.3)" translateY={3} />
        {/* main fill */}
        <Path d={svgPath} fill={BAR_COLOR} />
      </Svg>

      {/* ── Tab buttons ── */}
      <View
        style={[
          styles.rowContainer,
          // At least 14px bottom padding even on devices with no home bar
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const label     = TABS[route.name]?.label ?? route.name;
          const iconColor = isFocused ? NEON : INACTIVE;
          const textColor = isFocused ? NEON : INACTIVE;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              hitSlop={{ top: 12, bottom: 12, left: 6, right: 6 }}
            >
              {/* Icon — translateY moves it up into crater; stays on dark bg */}
              <Animated.View
                style={[
                  styles.iconSlot,
                  { transform: [{ translateY: floatY[index] }] },
                ]}
              >
                <TabIcon
                  name={route.name}
                  color={iconColor}
                  size={isFocused ? 26 : 22}
                />
              </Animated.View>

              {/* Label — always visible, color reflects focus state */}
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color: textColor,
                    transform: [{ scale: labelScale[index] }],
                    fontWeight: isFocused ? '700' : '400',
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,        // always on top
    elevation: 24,       // Android — above all app content
    backgroundColor: 'transparent',
    overflow: 'visible', // allow icon to float above container bounds
  },
  rowContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TOTAL_SVG_H,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    overflow: 'visible',
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    // Completely bare — no background, no border, no shadow container
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.4,
    textTransform: 'capitalize',
    marginTop: 3,
  },
});
