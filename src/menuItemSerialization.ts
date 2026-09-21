import type { ReactElement } from 'react';

import type { AndroidGlassMenuItem } from './AndroidGlassMenu.types';

/** Keep React elements in the native child tree, never in the JSON row payload. */
export function serializeMenuItems(items: readonly AndroidGlassMenuItem[]) {
  const icons: ReactElement[] = [];
  const serialize = (rows: readonly AndroidGlassMenuItem[]): object[] =>
    rows.map(({ icon, children, ...item }) => {
      const iconViewIndex = typeof icon === 'string' || icon == null ? -1 : icons.push(icon) - 1;
      return {
        ...item,
        icon: typeof icon === 'string' ? icon : '',
        iconViewIndex,
        children: children ? serialize(children) : [],
      };
    });
  return { itemsJson: JSON.stringify(serialize(items)), icons };
}
