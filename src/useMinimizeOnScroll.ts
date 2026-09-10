import { useCallback, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/** Within this distance from the top of the list, the bar is always expanded. */
const TOP_ZONE = 24;
/** Smallest scroll step between two events that counts as a direction. */
const MIN_STEP = 3;

export type MinimizeOnScroll = {
  /** Pass to `AndroidGlassBottomTabs`' `minimized`. */
  minimized: boolean;
  /** Pass to `AndroidGlassBottomTabs`' `onMinimizedChange`. Can also force a state. */
  setMinimized: (minimized: boolean) => void;
  /** Pass to the main list's `onScroll`, together with `scrollEventThrottle={16}`. */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

/**
 * Minimizes `AndroidGlassBottomTabs` while the user scrolls down a list, and expands it when they
 * scroll up or get back to the top, like iOS 26 tab bars. Works with ScrollView, FlatList,
 * SectionList and any list that reports `onScroll`. JS only decides the state; the animation
 * runs natively.
 */
export function useMinimizeOnScroll(): MinimizeOnScroll {
  const [minimized, setMinimizedState] = useState(false);
  const current = useRef(false);
  const previousY = useRef(0);

  const setMinimized = useCallback((next: boolean) => {
    // Scroll events arrive every frame; only a change re-renders.
    if (current.current !== next) {
      current.current = next;
      setMinimizedState(next);
    }
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Clamped to the scrollable range, so overscroll can't flip the direction for a frame.
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const maxY = Math.max(contentSize.height - layoutMeasurement.height, 0);
      const y = Math.min(Math.max(contentOffset.y, 0), maxY);
      const step = y - previousY.current;
      previousY.current = y;
      if (y < TOP_ZONE) setMinimized(false);
      else if (step > MIN_STEP) setMinimized(true);
      else if (step < -MIN_STEP) setMinimized(false);
    },
    [setMinimized]
  );

  return { minimized, setMinimized, onScroll };
}
