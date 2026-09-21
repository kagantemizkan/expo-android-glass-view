import { createElement } from 'react';

import { serializeMenuItems } from '../menuItemSerialization';

test('keeps custom icons out of JSON and indexes nested rows in React child order', () => {
  const first = createElement('Icon', { name: 'first' });
  const nested = createElement('Icon', { name: 'nested' });
  const { itemsJson, icons } = serializeMenuItems([
    { id: 'first', title: 'First', icon: first },
    {
      id: 'parent',
      title: 'Parent',
      icon: 'grid',
      children: [{ id: 'nested', title: 'Nested', icon: nested }],
    },
  ]);

  expect(icons).toEqual([first, nested]);
  expect(JSON.parse(itemsJson)).toEqual([
    { id: 'first', title: 'First', icon: '', iconViewIndex: 0, children: [] },
    {
      id: 'parent',
      title: 'Parent',
      icon: 'grid',
      iconViewIndex: -1,
      children: [{ id: 'nested', title: 'Nested', icon: '', iconViewIndex: 1, children: [] }],
    },
  ]);
});
