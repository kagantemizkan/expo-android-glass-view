import * as React from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, Platform } from 'react-native';

/** Within this distance from the top of the list, the bar is always expanded. */
const TOP_ZONE = 24;
/** Smallest scroll step between two events that counts as a direction. */
const MIN_STEP = 3;

type ScrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
type SetMinimized = (minimized: boolean) => void;
type MinimizedState = { minimized: boolean; setMinimized: SetMinimized };

export type MinimizeOnScroll = {
  /** Pass to `AndroidGlassBottomTabs`' `minimized`. */
  minimized: boolean;
  /** Pass to `AndroidGlassBottomTabs`' `onMinimizedChange`. Can also force a state. */
  setMinimized: SetMinimized;
  /** Pass to the list's `onScroll`, together with `scrollEventThrottle={16}`. */
  onScroll: ScrollHandler;
};

// Two contexts: lists only need the (stable) setter, so a minimize doesn't re-render screens.
const SetMinimizedContext = React.createContext<SetMinimized | null>(null);
/** Read by AndroidGlassBottomTabs; not part of the public API. */
export const MinimizedStateContext = React.createContext<MinimizedState | null>(null);

/** Minimize state whose setter only re-renders on a change (scroll events arrive every frame). */
function useMinimizedState(): MinimizedState {
  const [minimized, setState] = React.useState(false);
  const current = React.useRef(false);
  const setMinimized = React.useCallback((next: boolean) => {
    if (current.current !== next) {
      current.current = next;
      setState(next);
    }
  }, []);
  return React.useMemo(() => ({ minimized, setMinimized }), [minimized, setMinimized]);
}

/** Minimizes on scroll down; expands on scroll up and near the top. */
function useScrollHandler(setMinimized: SetMinimized): ScrollHandler {
  const previousY = React.useRef(0);
  return React.useCallback(
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
}

/**
 * Shares one minimize state between the tab bar and any number of lists, e.g. around a
 * navigator's tabs, where the bar and the screens are different components. Inside it,
 * `AndroidGlassBottomTabs` follows the shared state unless it gets a `minimized` prop.
 */
export function MinimizeOnScrollProvider({ children }: { children?: React.ReactNode }) {
  const state = useMinimizedState();
  return (
    <SetMinimizedContext.Provider value={state.setMinimized}>
      <MinimizedStateContext.Provider value={state}>{children}</MinimizedStateContext.Provider>
    </SetMinimizedContext.Provider>
  );
}

/**
 * `onScroll` for a list inside `MinimizeOnScrollProvider`: scrolling down minimizes the tab bar,
 * scrolling up (or reaching the top) expands it. Each list tracks its own position, and the
 * component isn't re-rendered when the bar minimizes. Returns `undefined` outside a provider and
 * on iOS and web, where the bar doesn't minimize, so the list sends no scroll events for nothing.
 */
export function useMinimizeOnScrollHandler(): ScrollHandler | undefined {
  const setMinimized = React.useContext(SetMinimizedContext);
  const onScroll = useScrollHandler(setMinimized ?? noop);
  return setMinimized != null && Platform.OS === 'android' ? onScroll : undefined;
}

/**
 * Minimize state plus an `onScroll` for one list. Inside `MinimizeOnScrollProvider` it uses the
 * shared state; outside, its own, which is enough when the list and the tab bar are in the same
 * component.
 */
export function useMinimizeOnScroll(): MinimizeOnScroll {
  const shared = React.useContext(MinimizedStateContext);
  const own = useMinimizedState();
  const { minimized, setMinimized } = shared ?? own;
  const onScroll = useScrollHandler(setMinimized);
  return { minimized, setMinimized, onScroll };
}

function noop() {}
