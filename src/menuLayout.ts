import type { AndroidGlassMenuItem, AndroidGlassMenuProps } from './AndroidGlassMenu.types';

type Rect = { x: number; y: number; width: number; height: number };

/** Window coordinates must be converted to provider coordinates before placing the overlay. */
export function menuLayout(
  root: Rect,
  anchor: Rect,
  items: readonly AndroidGlassMenuItem[],
  rowHeight: number,
  requestedWidth = 250,
  insets: AndroidGlassMenuProps['insets'] = {},
  placement: AndroidGlassMenuProps['placement'] = 'overlap',
  fontScale = 1,
  customHeight?: number
) {
  const { top = 12, left = 12, right = 12, bottom = 12 } = insets;
  const width = Math.max(1, Math.min(requestedWidth, root.width - left - right));
  const naturalHeight =
    16 +
    items.reduce(
      (sum, item) =>
        sum +
        menuItemHeight(item, rowHeight, fontScale) +
        (item.separator ? 12 : 0) +
        (item.sectionTitle ? 30 * fontScale : 0),
      0
    );
  const height = Math.max(1, Math.min(customHeight ?? naturalHeight, root.height - top - bottom));
  const anchorX = anchor.x - root.x;
  const anchorY = anchor.y - root.y;
  const panelLeft = Math.max(
    left,
    Math.min(
      anchorX + anchor.width + (placement === 'overlap' ? 3 : 0) - width,
      root.width - right - width
    )
  );
  const below = placement === 'overlap' ? anchorY : anchorY + anchor.height + 8;
  const panelTop = Math.max(
    top,
    Math.min(
      below + height <= root.height - bottom ? below : anchorY - height - 8,
      root.height - bottom - height
    )
  );
  return {
    left: panelLeft,
    top: panelTop,
    width,
    height,
    originX: Math.max(0, Math.min(1, (anchorX + anchor.width / 2 - panelLeft) / width)),
    originY: Math.max(0, Math.min(1, (anchorY + anchor.height / 2 - panelTop) / height)),
  };
}

export function menuItemHeight(item: AndroidGlassMenuItem, rowHeight: number, fontScale = 1) {
  return rowHeight * (item.compact ? 0.875 : 1) + (item.title.includes('\n') ? 14 * fontScale : 0);
}
