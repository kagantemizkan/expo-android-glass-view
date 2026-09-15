import { menuLayout, menuItemHeight } from '../menuLayout';

const items = [
  { id: 'a', title: 'A' },
  { id: 'b', title: 'B', separator: true },
];
const root = { x: 0, y: 24, width: 400, height: 760 };

test('places below the trigger in provider coordinates and includes separators', () => {
  const frame = menuLayout(
    root,
    { x: 300, y: 74, width: 60, height: 40 },
    items,
    52,
    260,
    {},
    'below'
  );
  expect(frame).toMatchObject({ left: 100, top: 98, width: 260, height: 132, originY: 0 });
  expect(frame.originX).toBeCloseTo(230 / 260);
});

test('flips above a bottom trigger and animates from its lower edge', () => {
  const frame = menuLayout(
    root,
    { x: 300, y: 720, width: 60, height: 40 },
    items,
    52,
    260,
    {},
    'below'
  );
  expect(frame.top).toBe(556);
  expect(frame.originY).toBe(1);
});

test('clamps a wide, tall menu to safe bounds at large font sizes', () => {
  const frame = menuLayout(
    { x: 30, y: 50, width: 220, height: 300 },
    { x: 32, y: 60, width: 40, height: 40 },
    Array.from({ length: 10 }, (_, id) => ({ id: String(id), title: 'Item' })),
    100,
    500,
    { top: 30, bottom: 40, left: 16, right: 16 }
  );
  expect(frame).toMatchObject({ left: 16, top: 30, width: 188, height: 230 });
  expect(frame.originX).toBeGreaterThanOrEqual(0);
  expect(frame.originX).toBeLessThanOrEqual(1);
});

test('clamps a trigger at the left edge without placing the menu off screen', () => {
  const frame = menuLayout(
    root,
    { x: 0, y: 100, width: 40, height: 40 },
    items,
    52,
    260,
    {},
    'below'
  );
  expect(frame.left).toBe(12);
  expect(frame.left + frame.width).toBeLessThanOrEqual(root.width - 12);
});

test('overlaps the trigger and keeps the opening origin at its centre', () => {
  const frame = menuLayout(root, { x: 300, y: 74, width: 40, height: 40 }, items, 48);
  expect(frame).toMatchObject({ left: 93, top: 50, width: 250, height: 124 });
  expect(frame.originX).toBeCloseTo(227 / 250);
  expect(frame.originY).toBeCloseTo(20 / 124);
});

test('two-line reference labels get the extra line height, including large text', () => {
  expect(menuItemHeight({ id: 'sort', title: 'Son Eklenen’e\nGöre Sırala' }, 48)).toBe(62);
  expect(menuItemHeight({ id: 'sort', title: 'A\nB' }, 96, 2)).toBe(124);
});

test('compact rows keep the subtitle line height when text is enlarged', () => {
  expect(menuItemHeight({ id: 'a', title: 'A\nB', compact: true }, 96, 2)).toBe(112);
});

test('section headings and their separator both reserve space above the row', () => {
  const frame = menuLayout(
    root,
    { x: 300, y: 74, width: 40, height: 40 },
    [{ id: 'a', title: 'A', compact: true, separator: true, sectionTitle: 'Show:' }],
    48
  );
  expect(frame.height).toBe(100);
});

test('custom React content height participates in placement and bottom-edge flipping', () => {
  const frame = menuLayout(
    { x: 0, y: 0, width: 400, height: 800 },
    { x: 320, y: 700, width: 40, height: 40 },
    [],
    48,
    250,
    {},
    'below',
    1,
    320
  );
  expect(frame.height).toBe(320);
  expect(frame.top).toBe(372);
});

test('oversized custom content is clamped to the safe area for scrolling', () => {
  const frame = menuLayout(
    { x: 0, y: 0, width: 400, height: 800 },
    { x: 320, y: 100, width: 40, height: 40 },
    [],
    48,
    250,
    { top: 24, bottom: 30 },
    'overlap',
    1,
    1400
  );
  expect(frame.height).toBe(746);
  expect(frame.top).toBe(24);
});
