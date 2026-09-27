// The pictures of Your Progress (C17): one quiet scene per tab, drawn from
// the same records as the page, with no React so scripts/test_progress.js
// can check them.
//
// A scene is a plain list of shapes in a 100 by 160 box, anchored to the
// bottom of the empty tab screen, so components/ProgressPicture.tsx only
// draws and this file decides everything. Placement comes from a hash of
// each thing's name or day, so the same records always draw the same
// picture and a new record adds a piece without moving the others. Home
// and Reports have no picture: Reports keeps no record, and Home is where
// the person's chosen cards live. No text is ever drawn into a scene, and
// nothing in one shrinks or wilts; a finished or past thing is drawn
// fainter, never taken away while its record exists.
import { daysBetween } from './eatingVariety';
import {
  distinctByName,
  type ProgressBand,
  type ProgressInputs,
  type ProgressTabPath,
  sameName,
  type TimedMark,
  weekOf,
} from './progress';

export const SCENE_WIDTH = 100;
export const SCENE_HEIGHT = 160;

export type SceneShape =
  | { type: 'circle'; cx: number; cy: number; r: number; fill: string; opacity: number }
  | { type: 'rect'; x: number; y: number; w: number; h: number; rx: number; fill: string; opacity: number }
  | { type: 'path'; d: string; stroke: string | null; fill: string | null; strokeWidth: number; opacity: number };

export type ProgressScene = { tab: ProgressTabPath; shapes: SceneShape[] };

/** A stable number in [0, 1) from any text (FNV-1a). */
export function hashUnit(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) / 4294967296;
}

const r1 = (n: number) => Math.round(n * 10) / 10;

// Muted colours that read over a photo and over the plain backgrounds.
const JAR_COLOURS = ['#c9a86a', '#8fb07a', '#d98c6a', '#b58fc2', '#e0c35c', '#7fa8c9', '#c77b7b', '#9c8a6e', '#a3c4a0', '#d7a1b5'];
const WOOD = '#8a6a4a';
const SOIL = '#6b4f36';
const LEAF = '#6f9a5a';
const LEAF_PAST = '#9aa58f';
const STAR = '#f4ecd0';
const MEAL_DOT = '#e0b25c';
const DOSE_DOT = '#8fb8d9';

/** How many pieces (a jar, a dot, a tick) a picture draws before it stops
 *  adding more. A piece can take two shapes, a jar and its lid. A scene
 *  with nothing recorded behind it draws nothing at all. */
export const SCENE_PIECE_LIMIT = 160;

function colourFor(key: string): string {
  return JAR_COLOURS[Math.floor(hashUnit(key) * JAR_COLOURS.length)];
}

/** Food: a jar on the pantry shelves for every different whole food eaten,
 *  coloured by its food group, and a crock for every ferment. */
function pantryScene(food: ProgressInputs['food']): SceneShape[] {
  const shapes: SceneShape[] = [];
  const jars = distinctByName(food.wholeFoods)
    .sort((a, b) => (a.day === b.day ? a.name.localeCompare(b.name) : a.day.localeCompare(b.day)))
    .slice(0, SCENE_PIECE_LIMIT);
  if (jars.length === 0 && food.ferments.length === 0) return shapes;
  const perShelf = 16;
  const maxShelves = 8;
  const shelves = Math.min(maxShelves, Math.max(1, Math.ceil(jars.length / perShelf)));
  const shelfGap = 14;
  const bottom = SCENE_HEIGHT - 6;
  for (let s = 0; s < shelves; s += 1) {
    shapes.push({ type: 'rect', x: 4, y: bottom - s * shelfGap, w: 92, h: 1.6, rx: 0.4, fill: WOOD, opacity: 0.9 });
  }
  jars.forEach((jar, index) => {
    const shelf = Math.floor(index / perShelf);
    if (shelf >= maxShelves) return;
    const slot = index % perShelf;
    const tall = 7 + hashUnit(`h:${jar.name}`) * 4;
    const x = 5.5 + slot * 5.6;
    const y = bottom - shelf * shelfGap - tall;
    shapes.push({ type: 'rect', x: r1(x), y: r1(y), w: 4.4, h: r1(tall), rx: 1, fill: colourFor(`g:${jar.group ?? jar.name}`), opacity: 0.85 });
    shapes.push({ type: 'rect', x: r1(x + 0.6), y: r1(y - 1.2), w: 3.2, h: 1.4, rx: 0.3, fill: WOOD, opacity: 0.9 });
  });
  const crockBase = bottom - shelves * shelfGap - 1;
  food.ferments.slice(0, 12).forEach((batch, index) => {
    const x = 8 + index * 7.5;
    const going = batch.stage !== 'finished';
    shapes.push({
      type: 'path',
      d: `M${r1(x)} ${crockBase} q-3 -9 1.5 -11 h3 q4.5 2 1.5 11 z`,
      stroke: null,
      fill: going ? '#b98a5e' : '#a89a88',
      strokeWidth: 0,
      opacity: going ? 0.9 : 0.55,
    });
  });
  return shapes;
}

/** Garden: a plant for every different crop ever grown, full while it is
 *  growing and faint once it is past, a basket for what was harvested, and
 *  a heap for every compost pile. */
function gardenScene(garden: ProgressInputs['garden']): SceneShape[] {
  const shapes: SceneShape[] = [];
  if (garden.plantings.length === 0 && garden.harvests.length === 0 && garden.piles.length === 0) return shapes;
  const ground = SCENE_HEIGHT - 14;
  shapes.push({ type: 'rect', x: 0, y: ground, w: SCENE_WIDTH, h: 14, rx: 0, fill: SOIL, opacity: 0.75 });
  const crops = new Map<string, { name: string; planted: string; growing: boolean }>();
  for (const planting of garden.plantings) {
    const key = sameName(planting.name);
    const growing = planting.status === 'growing' && !planting.areaRetired;
    const held = crops.get(key);
    if (!held) crops.set(key, { name: planting.name, planted: planting.planted, growing });
    else if (growing) held.growing = true;
  }
  const plants = [...crops.values()].sort((a, b) => a.planted.localeCompare(b.planted)).slice(0, 60);
  plants.forEach((plant, index) => {
    const x = 4 + ((index * 37 + Math.floor(hashUnit(plant.name) * 11)) % 92);
    const height = 12 + hashUnit(`t:${plant.name}`) * 26;
    const leaf = plant.growing ? LEAF : LEAF_PAST;
    const opacity = plant.growing ? 0.9 : 0.4;
    shapes.push({ type: 'path', d: `M${x} ${ground} v-${r1(height)}`, stroke: leaf, fill: null, strokeWidth: 0.9, opacity });
    for (let l = 1; l <= 3; l += 1) {
      const ly = ground - (height * l) / 4;
      const side = l % 2 === 0 ? 1 : -1;
      shapes.push({
        type: 'path',
        d: `M${x} ${r1(ly)} q${side * 4} -3 ${side * 5} -1 q${side * -2} 3 ${side * -5} 1 z`,
        stroke: null,
        fill: leaf,
        strokeWidth: 0,
        opacity,
      });
    }
  });
  const harvested = distinctByName(garden.harvests).length;
  if (harvested > 0) {
    shapes.push({ type: 'path', d: `M70 ${ground + 1} h22 l-2.5 9 h-17 z`, stroke: null, fill: WOOD, strokeWidth: 0, opacity: 0.85 });
    for (let i = 0; i < Math.min(harvested, 14); i += 1) {
      shapes.push({
        type: 'circle',
        cx: r1(73 + (i % 7) * 2.6),
        cy: r1(ground + 0.5 - Math.floor(i / 7) * 2.4),
        r: 1.4,
        fill: JAR_COLOURS[i % JAR_COLOURS.length],
        opacity: 0.9,
      });
    }
  }
  garden.piles.slice(0, 4).forEach((pile, index) => {
    const size = Math.min(12, 4 + Math.sqrt(pile.additions) * 1.5);
    const x = 6 + index * 16;
    shapes.push({
      type: 'path',
      d: `M${x} ${ground + 12} q${r1(size)} -${r1(size * 1.4)} ${r1(size * 2)} 0 z`,
      stroke: null,
      fill: '#5a4230',
      strokeWidth: 0,
      opacity: pile.status === 'finished' ? 0.5 : 0.9,
    });
  });
  return shapes;
}

/** Life: a room whose window lights a pane for each week something was
 *  kept up, and whose shelves hold a candle per routine, a tool per upkeep
 *  job and a mat per kind of movement. An unlit pane is simply a pane. */
function roomScene(life: ProgressInputs['life']): SceneShape[] {
  const shapes: SceneShape[] = [];
  const kept = [life.routineDays, life.markDays, life.upkeepDays, life.workDays, life.routines, life.upkeep, life.movement];
  if (kept.every((list) => list.length === 0)) return shapes;
  const floor = SCENE_HEIGHT - 8;
  shapes.push({ type: 'rect', x: 0, y: floor, w: SCENE_WIDTH, h: 8, rx: 0, fill: WOOD, opacity: 0.7 });
  const weeks = new Set([...life.routineDays, ...life.markDays, ...life.upkeepDays, ...life.workDays].map(weekOf)).size;
  const panes = Math.min(weeks, 24);
  for (let i = 0; i < 24; i += 1) {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const lit = i < panes;
    shapes.push({ type: 'rect', x: 26 + col * 8, y: 40 + row * 8, w: 7, h: 7, rx: 0.5, fill: lit ? '#f1d68a' : '#4a5a6a', opacity: lit ? 0.8 : 0.3 });
  }
  const things: { name: string; kind: 'routine' | 'upkeep' | 'movement' }[] = [
    ...distinctByName(life.routines).map((item) => ({ name: item.name, kind: 'routine' as const })),
    ...distinctByName(life.upkeep).map((item) => ({ name: item.name, kind: 'upkeep' as const })),
    ...distinctByName(life.movement).map((item) => ({ name: item.name, kind: 'movement' as const })),
  ].slice(0, 36);
  things.forEach((thing, index) => {
    const shelf = Math.floor(index / 12);
    const x = 5 + (index % 12) * 7.6;
    const base = floor - 2 - shelf * 20;
    if (index % 12 === 0) shapes.push({ type: 'rect', x: 3, y: base, w: 94, h: 1.4, rx: 0.3, fill: WOOD, opacity: 0.85 });
    const tint = colourFor(thing.name);
    if (thing.kind === 'routine') {
      shapes.push({ type: 'rect', x: r1(x + 1.5), y: base - 8, w: 2.4, h: 8, rx: 0.4, fill: '#efe6d2', opacity: 0.9 });
      shapes.push({ type: 'circle', cx: r1(x + 2.7), cy: base - 9.4, r: 1, fill: '#f2b85c', opacity: 0.9 });
    } else if (thing.kind === 'upkeep') {
      shapes.push({ type: 'rect', x: r1(x + 2.2), y: base - 9, w: 1.2, h: 9, rx: 0.3, fill: WOOD, opacity: 0.9 });
      shapes.push({ type: 'rect', x: r1(x + 0.5), y: base - 10, w: 4.6, h: 2.4, rx: 0.5, fill: tint, opacity: 0.9 });
    } else {
      shapes.push({ type: 'rect', x: r1(x), y: base - 3.5, w: 5.6, h: 3.5, rx: 1.6, fill: tint, opacity: 0.85 });
    }
  });
  return shapes;
}

/** Signals: a star for every day a check-in was made, never for what the
 *  check-in said, so a hard week draws the same sky as an easy one. */
function skyScene(signals: ProgressInputs['signals']): SceneShape[] {
  const days = [...new Set(signals.checkinDays)].sort().slice(-365);
  return days.map((day) => ({
    type: 'circle' as const,
    cx: r1(3 + hashUnit(`x:${day}`) * 94),
    cy: r1(8 + hashUnit(`y:${day}`) * 110),
    r: r1(0.4 + hashUnit(`r:${day}`) * 0.7),
    fill: STAR,
    opacity: r1(0.55 + hashUnit(`o:${day}`) * 0.4),
  }));
}

/** Schedules: the day as an arc from midnight through noon to midnight,
 *  with a dot at the hour of each meal and each dose marked taken. */
function dayArcScene(marks: TimedMark[]): SceneShape[] {
  const shapes: SceneShape[] = [];
  if (marks.length === 0) return shapes;
  const cx = 50;
  const cy = SCENE_HEIGHT - 20;
  const radius = 42;
  shapes.push({ type: 'path', d: `M${cx - radius} ${cy} A${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`, stroke: '#e8dcc0', fill: null, strokeWidth: 0.6, opacity: 0.6 });
  const recent = [...marks].sort((a, b) => b.day.localeCompare(a.day)).slice(0, SCENE_PIECE_LIMIT);
  for (const mark of recent) {
    const angle = Math.PI - (Math.min(24, Math.max(0, mark.hour)) / 24) * Math.PI;
    const spread = (hashUnit(`${mark.day}:${mark.hour}:${mark.kind}`) - 0.5) * 4;
    const rr = radius + (mark.kind === 'meal' ? -4 : 4) + spread;
    shapes.push({
      type: 'circle',
      cx: r1(cx + Math.cos(angle) * rr),
      cy: r1(cy - Math.sin(angle) * rr),
      r: 0.9,
      fill: mark.kind === 'meal' ? MEAL_DOT : DOSE_DOT,
      opacity: 0.8,
    });
  }
  return shapes;
}

/** Insights: a lens with a facet lit for each analysis that now has what
 *  it needs to answer. */
function lensScene(ready: number, total: number, tint: string): SceneShape[] {
  const shapes: SceneShape[] = [];
  if (ready === 0) return shapes;
  const cx = 50;
  const cy = SCENE_HEIGHT - 50;
  const facets = Math.max(6, total);
  shapes.push({ type: 'circle', cx, cy, r: 30, fill: '#dfe8ef', opacity: 0.18 });
  for (let i = 0; i < facets; i += 1) {
    const a1 = (i / facets) * Math.PI * 2;
    const a2 = ((i + 1) / facets) * Math.PI * 2;
    const lit = i < ready;
    shapes.push({
      type: 'path',
      d: `M${cx} ${cy} L${r1(cx + Math.cos(a1) * 28)} ${r1(cy + Math.sin(a1) * 28)} L${r1(cx + Math.cos(a2) * 28)} ${r1(cy + Math.sin(a2) * 28)} z`,
      stroke: '#eef3f6',
      fill: lit ? tint : '#dfe8ef',
      strokeWidth: 0.3,
      opacity: lit ? 0.6 : 0.12,
    });
  }
  shapes.push({ type: 'path', d: `M${cx + 20} ${cy + 20} l14 14`, stroke: WOOD, fill: null, strokeWidth: 3, opacity: 0.8 });
  return shapes;
}

/** Trends: a timeline that reaches further across the screen the longer
 *  the records run, with a tick for each week something was recorded. */
function timelineScene(recordDays: string[], today: string, tint: string): SceneShape[] {
  const shapes: SceneShape[] = [];
  if (recordDays.length === 0) return shapes;
  const first = [...recordDays].sort()[0];
  const span = Math.max(1, daysBetween(first, today));
  // Quickly at first and slower after, so one year and three both fit.
  const length = Math.min(90, 8 + Math.log2(span + 1) * 8);
  const y = SCENE_HEIGHT - 16;
  shapes.push({ type: 'path', d: `M5 ${y} h${r1(length)}`, stroke: tint, fill: null, strokeWidth: 1.2, opacity: 0.85 });
  const weeks = [...new Set(recordDays.map(weekOf))].sort();
  for (const week of weeks.slice(-SCENE_PIECE_LIMIT)) {
    const at = 5 + (Math.max(0, daysBetween(first, week)) / span) * length;
    shapes.push({ type: 'rect', x: r1(at), y: y - 3, w: 0.5, h: 3, rx: 0, fill: tint, opacity: 0.7 });
  }
  return shapes;
}

/** The tabs that have a picture. */
export const PICTURE_TABS: readonly ProgressTabPath[] = ['/food', '/schedule', '/log', '/insights', '/trends', '/garden', '/life'];

export function buildProgressScene(tab: ProgressTabPath, inputs: ProgressInputs, bands: ProgressBand[], tint: string): ProgressScene | null {
  switch (tab) {
    case '/food':
      return { tab, shapes: pantryScene(inputs.food) };
    case '/garden':
      return { tab, shapes: gardenScene(inputs.garden) };
    case '/life':
      return { tab, shapes: roomScene(inputs.life) };
    case '/log':
      return { tab, shapes: skyScene(inputs.signals) };
    case '/schedule':
      return { tab, shapes: dayArcScene(inputs.schedules.marks) };
    case '/insights': {
      const lines = bands.flatMap((band) => band.ready).filter((line) => line.ready !== null);
      return { tab, shapes: lensScene(lines.filter((line) => line.ready).length, lines.length, tint) };
    }
    case '/trends':
      return { tab, shapes: timelineScene(inputs.trends.recordDays, inputs.today, tint) };
    default:
      return null;
  }
}
