// This week's plan as a notification (H10, 2026-09-28). Once a week, on the
// day and at the time the person picks, the meals planned for the seven days
// starting that day, one line a day, in place of the emailed weekly plan a
// meal-planning service sends, which would need a server this app does not
// have. Pure: no I/O, so scripts/test_week_plan_notice.js can check it.
//
// A notification is written when the reminders are reconciled, not when it
// fires, so its last line says when the plan was read. A meal added after
// that is missing from it until the app is next opened, and the line says so
// rather than letting the list pass for the current plan.

export const WEEK_PLAN_NOTIFICATION_TITLE = "This week's meals";

export type WeekPlanMeal = {
  // 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DD', as schedule_items stores it.
  scheduledFor: string;
  title: string;
  status: string;
};

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function localDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// The seven local days starting on the day the notification fires.
export function weekPlanDays(fireAt: Date): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(fireAt.getFullYear(), fireAt.getMonth(), fireAt.getDate() + i);
    days.push(localDay(day));
  }
  return days;
}

function dayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return DAY_SHORT[new Date(y, m - 1, d).getDay()];
}

function readAt(now: Date): string {
  const hours = now.getHours();
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${DAY_SHORT[now.getDay()]} ${now.getDate()} ${MONTH_SHORT[now.getMonth()]}, ${h12}:${pad(now.getMinutes())}${hours < 12 ? 'am' : 'pm'}`;
}

// One line a day, "Mon: Oatmeal, Lentil soup". A skipped meal is left out,
// since it is not going to be eaten; a meal already eaten or missed stays,
// since the list is what was planned. The same dish twice in a day is named
// once with a count. An empty day reads "nothing planned", and a week with
// nothing planned at all says where a plan is made instead of listing seven
// empty days.
export function buildWeekPlanBody(meals: WeekPlanMeal[], fireAt: Date, now: Date): string {
  const days = weekPlanDays(fireAt);
  const byDay = new Map<string, string[]>(days.map((day) => [day, []]));
  for (const meal of meals) {
    if (meal.status === 'skipped') continue;
    const list = byDay.get(meal.scheduledFor.slice(0, 10));
    const title = meal.title.trim();
    if (list && title) list.push(title);
  }
  const footer = `As planned on ${readAt(now)}.`;
  if (days.every((day) => (byDay.get(day) ?? []).length === 0)) {
    return `Nothing is planned for the next seven days. Schedules > Meal Plan can fill a week. ${footer}`;
  }
  const lines = days.map((day) => {
    const titles = byDay.get(day) ?? [];
    if (titles.length === 0) return `${dayLabel(day)}: nothing planned`;
    const counts = new Map<string, number>();
    for (const title of titles) counts.set(title, (counts.get(title) ?? 0) + 1);
    const named = [...counts].map(([title, count]) => (count > 1 ? `${title} (${count})` : title));
    return `${dayLabel(day)}: ${named.join(', ')}`;
  });
  return [...lines, footer].join('\n');
}
