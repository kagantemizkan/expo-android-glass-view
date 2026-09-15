import type { ReactNode, RefObject } from 'react';
import type { View } from 'react-native';

export type AndroidGlassMenuItem = {
  /** Stable, unique identifier returned by onSelect. */
  id: string;
  title: string;
  /** A nested action list, shown with a trailing chevron. */
  children?: readonly AndroidGlassMenuItem[];
  /** Native line icon displayed before the title. */
  icon?:
    | 'grid'
    | 'heart'
    | 'adjustments'
    | 'photo'
    | 'video'
    | 'screenshot'
    | 'album'
    | 'zoom-in'
    | 'zoom-out'
    | 'aspect'
    | 'people';
  /** A compact row inside a submenu. */
  compact?: boolean;
  /** Optional muted section heading above this item. */
  sectionTitle?: string;
  /** Update an option without dismissing the menu. */
  keepsMenuPresented?: boolean;
  checked?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  /** Draw a separator before this item. */
  separator?: boolean;
};

export type AndroidGlassMenuProps = {
  visible: boolean;
  /** A non-collapsible View wrapping the trigger, measured in window coordinates. */
  anchorRef: RefObject<Pick<View, 'measureInWindow'> | null>;
  /** Standard native rows. Ignored when children are supplied. */
  items?: readonly AndroidGlassMenuItem[];
  onSelect?: (id: string) => void;
  /** Custom React content replacing the native rows. Interactive children stay live. */
  children?: ReactNode;
  /** Custom panel height in dp (including padding). Default 240; clamped to available space. */
  contentHeight?: number;
  /** Set visible to false here. Called on selection, outside press, and Android back. */
  onDismiss: () => void;
  /** Called after the closing animation has returned to the trigger. */
  onDismissed?: () => void;
  /** Trigger glyph retained by the native surface during its morph. */
  sourceIcon?: 'sort';
  /** Default 250 dp, clamped to the provider's available width. */
  width?: number;
  /** Default overlap: expands over its trigger, like the reference menu. */
  placement?: 'overlap' | 'below';
  /** Shared glass material. Default light, independent of the system. */
  theme?: 'light' | 'dark';
  /** Padding inside the provider bounds, e.g. safe-area insets. Default 12 on all sides. */
  insets?: { top?: number; right?: number; bottom?: number; left?: number };
};

export type GlassMenuPanelProps = {
  children?: ReactNode;
  customHeight?: number;
  items: readonly AndroidGlassMenuItem[];
  expanded: boolean;
  dark: boolean;
  originX: number;
  originY: number;
  rowHeight: number;
  sourceIcon?: 'sort';
  backRequest: number;
  onNavigate: (depth: number) => void;
  onDismissRequest: () => void;
  onSelect: (id: string) => void;
  onClosed: () => void;
};
