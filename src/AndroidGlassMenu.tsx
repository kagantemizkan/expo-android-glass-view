import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  BackHandler,
  Pressable,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import type { AndroidGlassMenuProps, AndroidGlassMenuItem } from './AndroidGlassMenu.types';
import GlassMenuPanel from './GlassMenuPanel';
import { menuLayout } from './menuLayout';

const EMPTY_ITEMS: readonly AndroidGlassMenuItem[] = [];

type Entry = AndroidGlassMenuProps & { id: string };
type Portal = { set: (entry: Entry) => void; remove: (id: string) => void };
const Context = createContext<Portal | null>(null);

/** Place above your navigator, in the same window as the content being sampled. */
export function AndroidGlassMenuProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [frame, setFrame] = useState<{
    id: string;
    left: number;
    top: number;
    width: number;
    height: number;
    originX: number;
    originY: number;
    availableHeight: number;
  } | null>(null);
  const root = useRef<View>(null);
  const depth = useRef(0);
  const [backRequest, setBackRequest] = useState(0);
  const [closedId, setClosedId] = useState<string | null>(null);
  const hidden = !!entry && !entry.visible && closedId === entry.id;
  const panelId = useRef<string | null>(null);
  const { width: windowWidth, height: windowHeight, fontScale } = useWindowDimensions();
  const rowHeight = Math.max(48, 48 * fontScale);
  const portal = useMemo<Portal>(
    () => ({
      set: (next) => {
        if (next.visible) setClosedId(null);
        setEntry((current) => {
          if (next.visible) return next;
          if (current?.id !== next.id) return current;
          // Closing before measurement completed must not leave a back-button blocker.
          return panelId.current === next.id ? next : null;
        });
      },
      remove: (id) => {
        if (panelId.current === id) panelId.current = null;
        setEntry((current) => (current?.id === id ? null : current));
        setFrame((current) => (current?.id === id ? null : current));
      },
    }),
    []
  );

  useEffect(() => {
    depth.current = 0;
  }, [entry?.id]);

  const dismissOrCollapse = () => {
    if (depth.current > 0) setBackRequest((value) => value + 1);
    else entry?.onDismiss();
  };

  useEffect(() => {
    if (!entry?.visible) return;
    if (!entry.anchorRef.current) {
      entry.onDismiss();
      return;
    }
    let cancelled = false;
    root.current?.measureInWindow((rootX, rootY, rootWidth, rootHeight) => {
      entry.anchorRef.current?.measureInWindow((x, y, anchorWidth, anchorHeight) => {
        if (cancelled || rootWidth <= 0 || rootHeight <= 0) return;
        panelId.current = entry.id;
        const layout = menuLayout(
          { x: rootX, y: rootY, width: rootWidth, height: rootHeight },
          { x, y, width: anchorWidth, height: anchorHeight },
          entry.items ?? EMPTY_ITEMS,
          rowHeight,
          entry.width,
          entry.insets,
          entry.placement,
          fontScale,
          entry.children != null ? Math.max(48, entry.contentHeight ?? 240) : undefined
        );
        setFrame({
          id: entry.id,
          ...layout,
          availableHeight: Math.max(1, rootHeight - layout.top - (entry.insets?.bottom ?? 12)),
        });
      });
    });
    return () => {
      cancelled = true;
    };
  }, [entry, windowWidth, windowHeight, rowHeight, fontScale]);

  useEffect(() => {
    if (!entry || hidden) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (depth.current > 0) setBackRequest((value) => value + 1);
      else entry.onDismiss();
      return true;
    });
    return () => subscription.remove();
  }, [entry, hidden]);

  return (
    <Context.Provider value={portal}>
      <View ref={root} collapsable={false} style={styles.root}>
        <View
          style={styles.root}
          importantForAccessibility={entry?.visible ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={!!entry?.visible}>
          {children}
        </View>
        {entry && frame?.id === entry.id && (
          <View
            style={[styles.overlay, hidden && styles.hidden]}
            pointerEvents={hidden ? 'none' : 'auto'}
            accessibilityViewIsModal={!hidden}
            importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
            accessibilityElementsHidden={hidden}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={dismissOrCollapse}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            />
            <View
              style={[
                styles.panel,
                {
                  left: frame.left,
                  top: frame.top,
                  width: frame.width,
                  height: Platform.OS === 'android' ? frame.availableHeight : frame.height,
                },
              ]}>
              <GlassMenuPanel
                key={entry.id}
                items={entry.children != null ? EMPTY_ITEMS : (entry.items ?? EMPTY_ITEMS)}
                customHeight={entry.children != null ? frame.height : 0}
                children={entry.children}
                expanded={entry.visible}
                dark={entry.theme === 'dark'}
                originX={frame.originX}
                originY={frame.originY}
                rowHeight={rowHeight}
                sourceIcon={entry.sourceIcon}
                backRequest={backRequest}
                onNavigate={(value) => {
                  depth.current = value;
                }}
                onDismissRequest={dismissOrCollapse}
                onClosed={() => {
                  if (!entry.visible) {
                    entry.onDismissed?.();
                    // Keep the Compose layer and its GPU programs warm for the next opening.
                    setClosedId(entry.id);
                  }
                }}
                onSelect={(id) => {
                  if (!entry.visible) return;
                  const findItem = (
                    items: readonly AndroidGlassMenuItem[]
                  ): AndroidGlassMenuItem | undefined => {
                    for (const item of items) {
                      if (item.id === id) return item;
                      const child = item.children && findItem(item.children);
                      if (child) return child;
                    }
                    return undefined;
                  };
                  const item = findItem(entry.items ?? EMPTY_ITEMS);
                  if (!item || item.disabled) return;
                  if (!item.keepsMenuPresented) entry.onDismiss();
                  entry.onSelect?.(id);
                }}
              />
            </View>
          </View>
        )}
      </View>
    </Context.Provider>
  );
}

/** Controlled anchored menu. Its panel is rendered above the provider's content. */
export default function AndroidGlassMenu(props: AndroidGlassMenuProps) {
  const portal = useContext(Context);
  const id = useId();
  if (!portal)
    throw new Error('AndroidGlassMenu requires AndroidGlassMenuProvider above the navigator.');
  const {
    children,
    contentHeight,
    visible,
    anchorRef,
    items,
    onSelect,
    onDismiss,
    onDismissed,
    sourceIcon,
    width,
    theme,
    insets,
    placement,
  } = props;
  useEffect(() => {
    portal.set({
      id,
      children,
      contentHeight,
      visible,
      anchorRef,
      items,
      onSelect,
      onDismiss,
      onDismissed,
      sourceIcon,
      width,
      theme,
      insets,
      placement,
    });
  }, [
    portal,
    id,
    children,
    contentHeight,
    visible,
    anchorRef,
    items,
    onSelect,
    onDismiss,
    onDismissed,
    sourceIcon,
    width,
    theme,
    insets,
    placement,
  ]);
  useEffect(() => () => portal.remove(id), [portal, id]);
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000 },
  panel: { position: 'absolute' },
  hidden: { opacity: 0 },
});
