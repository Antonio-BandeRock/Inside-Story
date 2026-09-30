// Reading and writing to-dos (C10). What an answer does is decided in
// lib/todos.ts (planTodoAnswer) with no database; this carries it out. See
// todos and todo_doings in lib/db.ts.

import { getDatabase } from './db';
import type { RepeatConfig } from './repeatRule';
import { planTodoAnswer, type Todo, type TodoAnswerPlan, type TodoArea, type TodoDoingKind } from './todos';

type TodoRow = {
  id: string;
  title: string;
  notes: string | null;
  area: string;
  dueOn: string | null;
  anchorOn: string | null;
  repeatJson: string | null;
  doneAt: string | null;
  closedAs: string | null;
  createdAt: string;
};

const COLUMNS = `id, title, notes, area, due_on AS dueOn, anchor_on AS anchorOn, repeat_json AS repeatJson,
  done_at AS doneAt, closed_as AS closedAs, created_at AS createdAt`;

function parseRepeat(json: string | null): RepeatConfig | null {
  if (!json) return null;
  try {
    const value = JSON.parse(json) as RepeatConfig;
    return value && typeof value.type === 'string' && value.type !== 'none' ? value : null;
  } catch {
    return null;
  }
}

function fromRow(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    area: row.area === 'work' ? 'work' : 'personal',
    dueOn: row.dueOn,
    anchorOn: row.anchorOn,
    repeat: parseRepeat(row.repeatJson),
    doneAt: row.doneAt,
    closedAs: row.closedAs === 'let_go' ? 'let_go' : row.closedAs === 'done' ? 'done' : null,
    createdAt: row.createdAt,
  };
}

/** Every to-do in one area, or both. Done ones from the last 60 days come
 *  too, so the Done fold has something to show without the list growing
 *  for ever; older ones stay in the table as the record. */
export async function listTodos(area: TodoArea | 'everything'): Promise<Todo[]> {
  const db = await getDatabase();
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const where = area === 'everything' ? '' : 'AND area = ?';
  const rows = await db.getAllAsync<TodoRow>(
    `SELECT ${COLUMNS} FROM todos WHERE (done_at IS NULL OR done_at >= ?) ${where} ORDER BY created_at ASC`,
    ...(area === 'everything' ? [since] : [since, area]),
  );
  return rows.map(fromRow);
}

/** The open ones, for reminders and Home. */
export async function listOpenTodos(): Promise<Todo[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<TodoRow>(`SELECT ${COLUMNS} FROM todos WHERE done_at IS NULL ORDER BY created_at ASC`);
  return rows.map(fromRow);
}

export async function getTodo(id: string): Promise<Todo | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<TodoRow>(`SELECT ${COLUMNS} FROM todos WHERE id = ?`, id);
  return row ? fromRow(row) : null;
}

export type TodoInput = {
  title: string;
  notes?: string | null;
  area: TodoArea;
  dueOn: string | null;
  repeat: RepeatConfig | null;
};

export async function addTodo(input: TodoInput): Promise<string> {
  const db = await getDatabase();
  const id = `todo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const repeat = input.repeat && input.repeat.type !== 'none' && input.dueOn ? input.repeat : null;
  const notes = input.notes && input.notes.trim() ? input.notes.trim() : null;
  await db.runAsync(
    `INSERT INTO todos (id, title, notes, area, due_on, anchor_on, repeat_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.title.trim(),
    notes,
    input.area,
    input.dueOn,
    repeat ? input.dueOn : null,
    repeat ? JSON.stringify(repeat) : null,
    now,
    now,
  );
  return id;
}

/** Changes what a to-do says and when. Changing the day or the repeat
 *  starts the pattern again from the new day. */
export async function updateTodo(id: string, input: TodoInput): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const repeat = input.repeat && input.repeat.type !== 'none' && input.dueOn ? input.repeat : null;
  const notes = input.notes && input.notes.trim() ? input.notes.trim() : null;
  await db.runAsync(
    `UPDATE todos SET title = ?, notes = ?, area = ?, due_on = ?, anchor_on = ?, repeat_json = ?, updated_at = ?
      WHERE id = ?`,
    input.title.trim(),
    notes,
    input.area,
    input.dueOn,
    repeat ? input.dueOn : null,
    repeat ? JSON.stringify(repeat) : null,
    now,
    id,
  );
}

/** Answers a to-do: done, or let go. Returns what was decided so the
 *  screen can say it back. */
export async function answerTodo(id: string, kind: TodoDoingKind, today: string): Promise<{ todo: Todo; plan: TodoAnswerPlan } | null> {
  const todo = await getTodo(id);
  if (!todo || todo.doneAt) return null;
  const plan = planTodoAnswer(todo, kind, today);
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    if (plan.doing) {
      await db.runAsync(
        `INSERT INTO todo_doings (id, todo_id, due_on, kind, done_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        `tododoing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        id,
        plan.doing.dueOn,
        plan.doing.kind,
        now,
        now,
        now,
      );
    }
    if (plan.closes) {
      await db.runAsync('UPDATE todos SET done_at = ?, closed_as = ?, updated_at = ? WHERE id = ?', now, kind, now, id);
    } else {
      await db.runAsync('UPDATE todos SET due_on = ?, updated_at = ? WHERE id = ?', plan.nextDueOn, now, id);
    }
  });
  return { todo, plan };
}

/** Done from a reminder's button. */
export async function markTodoDone(id: string, today: string): Promise<void> {
  await answerTodo(id, 'done', today);
}

/** Opens a closed to-do again. Its doings stay: what was done was done. */
export async function reopenTodo(id: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync('UPDATE todos SET done_at = NULL, closed_as = NULL, updated_at = ? WHERE id = ?', now, id);
}

/** Removes a to-do and the record of its doings. Nothing else refers to
 *  either. */
export async function deleteTodo(id: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM todo_doings WHERE todo_id = ?', id);
    await db.runAsync('DELETE FROM todos WHERE id = ?', id);
  });
}
