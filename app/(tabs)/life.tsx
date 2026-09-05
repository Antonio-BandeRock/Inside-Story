import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppActionSheet, type AppActionSheetAction } from '../../components/AppActionSheet';
import { AppTextInput } from '../../components/AppTextInput';
import { FinanceHealthSection } from '../../components/FinanceHealthSection';
import { FinanceMoneySection } from '../../components/FinanceMoneySection';
import { useRegisterScreenHelp } from '../../components/CurrentPageHelp';
import { GatedTabContent } from '../../components/GatedTabContent';
import type { HelpSection } from '../../components/HelpButton';
import { useInfoAlert } from '../../components/InfoAlert';
import { LensHub, type LensOption } from '../../components/LensHub';
import { MyItemsHub } from '../../components/MyItemsHub';
import { PageIdentityLabel } from '../../components/PageIdentityLabel';
import { PopoverSelect } from '../../components/PopoverSelect';
import { SwipeableTabScreen } from '../../components/SwipeableTabScreen';
import { VoiceInputButton } from '../../components/VoiceInputButton';
import { BUTTON_SHADOW, colors } from '../../constants/colors';
import { useFloatingButtonScrollPadding } from '../../constants/floatingButton';
import { textShadow, typography } from '../../constants/typography';
import { useAutoOpenLensHubSignal } from '../../hooks/useAutoOpenLensHubSignal';
import {
  expenseCategoriesByGroup,
  financeCategoriesFor,
  financeCategoryLabel,
  type FinanceDirection,
} from '../../lib/financeCategories';
import {
  buildMonthPicture,
  describeDaysAway,
  describeMonthPicture,
  formatFinanceMoney,
  itemMonthly,
  summarizeRecurring,
  upcomingBills,
  type RecurringItem,
} from '../../lib/financeCore';
import {
  WEEKDAY_NAMES,
  WEEK_OF_MONTH_LABELS,
  describeDueRule,
  describeDueRuleShort,
  describeMissingPiece,
  nextOccurrence,
  occurrencesPerYear,
  parseDate,
  type DueRule,
  type WeekOfMonth,
  type Weekday,
} from '../../lib/financeSchedule';
import { budgetProgress, formatAccountMoney, isLiability, sinkingFund } from '../../lib/financeAccounts';
import {
  listAccounts,
  listBudgets,
  removeBudget,
  setBudget,
  type AccountRecord,
  type BudgetRecord,
} from '../../lib/financeAccountsDb';
import {
  createEntry,
  createRecurring,
  deleteEntry,
  deleteRecurring,
  getFinanceMonth,
  setRecurringActive,
  updateRecurring,
  type FinanceEntryRecord,
  type FinanceRecurringRecord,
} from '../../lib/financeDb';
import { parsePriceInput } from '../../lib/groceryList';

// The 10th tab, added 2026-09-04, and its first real area, added
// 2026-09-05. Direct request: "Let's start with Finances... Finances is
// much larger than just tracking a few numbers. Match life against
// finances in a logical way, setup for the average person and the average
// things they would have for bills and charges."
//
// STRUCTURE, AND WHY IT IS ONE LENS RATHER THAN FOUR.
//
// Life is going to hold "a ton of things", so its lens list has to read as
// a list of AREAS, not as a flat pile of every view every area needs. Four
// lenses called Overview / Bills / Spending / Coming Up would make Life
// look like a money tab, and would leave nowhere obvious for the second
// area to go. So Finances is one lens with its own sections inside it,
// which is the pattern Digest already uses (a lens picks a category, then
// a menu picks a topic within it), rendered with the pill row this app
// uses for sub-navigation everywhere else.
//
// THE DESIGN, IN ONE LINE: a plan and a record are different things.
//
// finance_recurring is what is supposed to happen every month. Entries,
// grocery lines and therapy sessions are what actually did. Every other
// budgeting tool collapses those two and then cannot answer the only
// question that matters, which is whether they match. Overview shows them
// side by side and neither stands in for the other.
//
// WHAT IS NOT HERE, DELIBERATELY:
//
// No bank connection. This app holds health data on one device with no
// backend, and handing a bank credential to anything would give that up on
// the least defensible possible grounds. Money is typed in, or it is read
// from what this app already collected.
//
// No invented savings figure for garden and ferment produce. The app knows
// which grocery lines were covered from the kitchen instead of bought,
// because those lines carry sourced_from_kitchen and deliberately carry no
// price. What that produce would have cost is genuinely unknown, and
// turning it into a dollar saving would be exactly the invented number
// this app refuses everywhere else. It is reported as a count of lines
// that did not have to be bought, which is a fact.

const TAB_COLOR = colors.tabLife;

type LifeLens = 'finances';
type FinanceSection = 'overview' | 'health' | 'recurring' | 'spending' | 'upcoming' | 'money';

const SECTIONS: { key: FinanceSection; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'health', label: 'Health' },
  { key: 'recurring', label: 'Bills & Income' },
  { key: 'spending', label: 'Spending' },
  { key: 'upcoming', label: 'Coming Up' },
  { key: 'money', label: 'Accounts' },
];

const UPCOMING_WINDOW_DAYS = 30;

const LIFE_HELP_SECTIONS: HelpSection[] = [
  {
    heading: 'What this tab is for',
    body: 'Everything about your life that is not food, not a symptom, and not a lab result. Finances is its first area; more will be added, and each one becomes its own entry on the corner button.',
  },
  {
    heading: 'A plan and a record are different things',
    body: 'Bills & Income is what is supposed to happen every month. Spending is what actually did. Overview shows them next to each other, and neither is allowed to stand in for the other, because whether they match is the only question worth asking.',
  },
  {
    heading: 'Money this app already knows about',
    body: 'Grocery trips you priced in the shop and hands-on therapy sessions you recorded a cost for are counted automatically. They are read from where they already live rather than copied here, so correcting a grocery price fixes it everywhere at once. Do not enter them again by hand.',
  },
  {
    heading: 'Weekly is not four times a month',
    body: 'There are 52 weeks in a year, so anything weekly costs 4.33 times its amount each month, not 4. Every two weeks is 26 payments a year and twice a month is 24, which is a genuine two-payment difference. The monthly figures here use the real numbers, which is why they may read slightly higher than you expect.',
  },
  {
    heading: 'Two orders for paying off debt',
    body: 'Highest rate first always costs less in interest, and that is arithmetic. Smallest balance first clears individual debts sooner, which many people find easier to keep going with. Accounts shows what each one costs and how long it takes, and does not pick for you, because which one you will actually stick to is not something an app can know.',
  },
  {
    heading: 'What is not here',
    body: 'No bank connection, and that is a choice rather than a gap. This app keeps everything on your device with no server behind it, and asking for a bank login would give that up. Nothing here leaves your phone.',
  },
];

const LIFE_LENSES: LensOption<LifeLens>[] = [
  { key: 'finances', label: 'Finances', icon: 'wallet-outline', help: LIFE_HELP_SECTIONS },
];

const DIRECTION_OPTIONS = [
  { label: 'Money going out', value: 'expense' },
  { label: 'Money coming in', value: 'income' },
];

// One picker answers "how often", and the shape of the answer decides what
// else the form needs to ask. Keeping frequency as a single opaque key
// here, rather than an interval plus a unit, keeps the form from being
// able to represent a combination the rule type does not allow.
type Frequency = 'w1' | 'w2' | 'w3' | 'w4' | 'twice' | 'm1' | 'm3' | 'm6' | 'm12';

const FREQUENCY_OPTIONS: { label: string; value: Frequency }[] = [
  { label: 'Every week', value: 'w1' },
  { label: 'Every 2 weeks', value: 'w2' },
  { label: 'Every 3 weeks', value: 'w3' },
  { label: 'Every 4 weeks', value: 'w4' },
  { label: 'Twice a month', value: 'twice' },
  { label: 'Every month', value: 'm1' },
  { label: 'Every 3 months', value: 'm3' },
  { label: 'Every 6 months', value: 'm6' },
  { label: 'Once a year', value: 'm12' },
];

const WEEKS_FOR: Record<string, 1 | 2 | 3 | 4> = { w1: 1, w2: 2, w3: 3, w4: 4 };
const MONTHS_FOR: Record<string, 1 | 3 | 6 | 12> = { m1: 1, m3: 3, m6: 6, m12: 12 };

const WEEKDAY_OPTIONS = WEEKDAY_NAMES.map((name, index) => ({ label: name, value: String(index) }));
const WEEK_OPTIONS = [
  { label: WEEK_OF_MONTH_LABELS['1'], value: '1' },
  { label: WEEK_OF_MONTH_LABELS['2'], value: '2' },
  { label: WEEK_OF_MONTH_LABELS['3'], value: '3' },
  { label: WEEK_OF_MONTH_LABELS['4'], value: '4' },
  { label: WEEK_OF_MONTH_LABELS.last, value: 'last' },
];
const MONTH_MODE_OPTIONS = [
  { label: 'On a date', value: 'date' },
  { label: 'On a weekday', value: 'weekday' },
];

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function currentMonth(): string {
  return todayLocal().slice(0, 7);
}

function monthLabel(month: string): string {
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const [year, m] = month.split('-').map(Number);
  return `${names[m - 1]} ${year}`;
}

function shortDate(dateStr: string): string {
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [, m, d] = dateStr.split('-').map(Number);
  return `${names[m - 1]} ${d}`;
}

type RecurringForm = {
  editingId: string | null;
  direction: FinanceDirection;
  name: string;
  category: string;
  amount: string;
  frequency: Frequency;
  // Which day of the week, for anything repeating in weeks and for the
  // "2nd Tuesday" shape.
  weekday: Weekday;
  // The date it last landed on, which is what makes "every 2 weeks"
  // answerable at all.
  weekAnchor: string;
  // For month-based rules: land on a date, or on a weekday.
  monthMode: 'date' | 'weekday';
  day: string;
  day2: string;
  week: WeekOfMonth;
  // Which month a cycle longer than a month counts from.
  anchorMonth: string;
  notes: string;
  // Which account this leaves from, and for a debt payment, which account
  // it pays down. Empty string means not linked, which is the default.
  paidFromAccountId: string;
  paidToAccountId: string;
};

function blankRecurringForm(): RecurringForm {
  return {
    editingId: null,
    direction: 'expense',
    name: '',
    category: 'housing',
    amount: '',
    frequency: 'm1',
    weekday: 5,
    weekAnchor: todayLocal(),
    monthMode: 'date',
    day: '1',
    day2: '15',
    week: 1,
    anchorMonth: currentMonth(),
    notes: '',
    paidFromAccountId: '',
    paidToAccountId: '',
  };
}

/**
 * The form's answers as a rule, or a plain sentence saying what is still
 * missing. Returning the reason rather than just null is what lets the
 * screen tell someone which field to fix instead of refusing silently.
 */
function buildRule(form: RecurringForm): { rule: DueRule } | { problem: string } {
  const dayNumber = (raw: string): number | null => {
    const n = Number(raw.trim());
    return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
  };

  if (form.frequency in WEEKS_FOR) {
    if (!parseDate(form.weekAnchor)) {
      return { problem: 'Enter a valid date it last landed on (YYYY-MM-DD), so the app knows which week it falls in.' };
    }
    return {
      rule: { kind: 'everyNWeeks', weeks: WEEKS_FOR[form.frequency], weekday: form.weekday, anchor: form.weekAnchor },
    };
  }

  if (form.frequency === 'twice') {
    const a = dayNumber(form.day);
    const b = dayNumber(form.day2);
    if (a == null || b == null) return { problem: 'Both days have to be whole numbers from 1 to 31.' };
    if (a === b) return { problem: 'The two days need to be different, or this happens once a month rather than twice.' };
    return { rule: { kind: 'twiceMonthly', day1: a, day2: b } };
  }

  const months = MONTHS_FOR[form.frequency];
  const anchorMonth = months > 1 ? form.anchorMonth.trim() : null;
  if (months > 1 && !parseDate(`${anchorMonth?.slice(0, 7)}-01`)) {
    return { problem: 'Enter the month the next one falls in (YYYY-MM), since this only comes round a few times a year.' };
  }

  if (form.monthMode === 'weekday') {
    return { rule: { kind: 'nthWeekday', months, week: form.week, weekday: form.weekday, anchorMonth } };
  }
  const day = dayNumber(form.day);
  if (day == null) return { problem: 'The day of the month has to be a whole number from 1 to 31.' };
  return { rule: { kind: 'dayOfMonth', months, day, anchorMonth } };
}

/** The reverse, so editing an existing bill opens on its own answers. */
function formFromRule(rule: DueRule | null, base: RecurringForm): RecurringForm {
  if (!rule) return base;
  switch (rule.kind) {
    case 'everyNWeeks':
      return { ...base, frequency: (`w${rule.weeks}` as Frequency), weekday: rule.weekday, weekAnchor: rule.anchor };
    case 'twiceMonthly':
      return { ...base, frequency: 'twice', day: String(rule.day1), day2: String(rule.day2) };
    case 'dayOfMonth':
      return {
        ...base,
        frequency: (`m${rule.months}` as Frequency),
        monthMode: 'date',
        day: String(rule.day),
        anchorMonth: rule.anchorMonth ?? base.anchorMonth,
      };
    case 'nthWeekday':
      return {
        ...base,
        frequency: (`m${rule.months}` as Frequency),
        monthMode: 'weekday',
        week: rule.week,
        weekday: rule.weekday,
        anchorMonth: rule.anchorMonth ?? base.anchorMonth,
      };
  }
}

type EntryForm = {
  occurredOn: string; direction: FinanceDirection; amount: string; category: string;
  description: string; paidFromAccountId: string;
};

function blankEntryForm(): EntryForm {
  return { occurredOn: todayLocal(), direction: 'expense', amount: '', category: 'dining_out', description: '', paidFromAccountId: '' };
}

export default function LifeScreen() {
  useRegisterScreenHelp('Life', LIFE_HELP_SECTIONS, '/life');
  const scrollBottomPadding = useFloatingButtonScrollPadding();
  const [lens, setLens] = useState<LifeLens>('finances');
  const [revealed, setRevealed] = useState(false);
  const [myLifeOpen, setMyLifeOpen] = useState(false);
  const [showInfoAlert, infoAlertElement] = useInfoAlert();
  const [confirm, setConfirm] = useState<{ title: string; message?: string; actions: AppActionSheetAction[] } | null>(null);

  const [section, setSection] = useState<FinanceSection>('overview');
  const [recurring, setRecurring] = useState<FinanceRecurringRecord[]>([]);
  const [entries, setEntries] = useState<FinanceEntryRecord[]>([]);
  const [tracked, setTracked] = useState({
    grocerySpend: 0,
    groceryLinesWithoutPrice: 0,
    therapySpend: 0,
    therapySessionsWithoutCost: 0,
    kitchenCoveredLines: 0,
  });
  const [loading, setLoading] = useState(false);
  const [recurringForm, setRecurringForm] = useState<RecurringForm | null>(null);
  const [entryForm, setEntryForm] = useState<EntryForm | null>(null);
  const [budgets, setBudgets] = useState<BudgetRecord[]>([]);
  const [accountList, setAccountList] = useState<AccountRecord[]>([]);
  const [budgetForm, setBudgetForm] = useState<{ category: string; limit: string } | null>(null);
  const autoOpenLensHub = useAutoOpenLensHubSignal();

  const month = currentMonth();

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getFinanceMonth(month), listBudgets(), listAccounts()])
      .then(([data, budgetRows, accountRows]) => {
        setRecurring(data.recurring);
        setEntries(data.entries);
        setTracked(data.tracked);
        setBudgets(budgetRows);
        setAccountList(accountRows);
      })
      .catch((error) => showInfoAlert('Could not load Finances', error instanceof Error ? error.message : String(error)))
      .finally(() => setLoading(false));
  }, [month, showInfoAlert]);

  useFocusEffect(
    useCallback(() => {
      setRevealed(false);
      return () => setRevealed(false);
    }, []),
  );

  useFocusEffect(useCallback(() => { if (revealed) load(); }, [revealed, load]));

  const recurringItems: RecurringItem[] = useMemo(
    () => recurring.map((row) => ({ ...row })),
    [recurring],
  );
  const summary = useMemo(() => summarizeRecurring(recurringItems), [recurringItems]);
  const picture = useMemo(
    () => buildMonthPicture(month, recurringItems, entries, tracked),
    [month, recurringItems, entries, tracked],
  );
  const soon = useMemo(() => upcomingBills(recurringItems, todayLocal(), UPCOMING_WINDOW_DAYS), [recurringItems]);

  // A limit is measured against what has actually been recorded, and what
  // repeating bills already commit is shown beside it rather than added to
  // it. Adding them would double-count the month a bill is both committed
  // and paid, and the two answer different questions anyway.
  const budgetRows = useMemo(
    () =>
      budgets.map((budget) =>
        budgetProgress({
          category: budget.category,
          limit: budget.monthlyLimit,
          spent: picture.byCategory.find((row) => row.category === budget.category)?.monthly ?? 0,
          committed: summary.byCategory.find((row) => row.category === budget.category)?.monthly ?? 0,
        }),
      ),
    [budgets, picture.byCategory, summary.byCategory],
  );

  // Only bills that arrive less often than monthly. A monthly bill needs no
  // setting aside for; it is already part of the monthly rhythm.
  const funds = useMemo(() => {
    const today = todayLocal();
    return recurringItems
      .filter((item) => item.active && item.direction === 'expense' && item.rule && occurrencesPerYear(item.rule) < 12)
      .map((item) => {
        const rule = item.rule as DueRule;
        return sinkingFund({
          name: item.name,
          amount: item.amount,
          monthsBetween: 12 / occurrencesPerYear(rule),
          nextDue: nextOccurrence(rule, today),
          today,
        });
      })
      .sort((a, b) => b.monthlySetAside - a.monthlySetAside);
  }, [recurringItems]);

  const activeLensLabel = LIFE_LENSES.find((option) => option.key === lens)?.label;

  const categoryOptions = useMemo(() => {
    if (recurringForm?.direction === 'income' || entryForm?.direction === 'income') {
      return financeCategoriesFor('income').map((c) => ({ label: c.label, value: c.code }));
    }
    return expenseCategoriesByGroup().flatMap((group) =>
      group.categories.map((c) => ({ label: `${group.label}: ${c.label}`, value: c.code })),
    );
  }, [recurringForm?.direction, entryForm?.direction]);

  // "No account" leads on purpose. Saying where money comes from is worth
  // doing and is not worth blocking a bill over, so the picker opens on
  // the answer that asks for nothing.
  const accountOptions = useMemo(
    () => [
      { label: 'Not linked to an account', value: '' },
      ...accountList.filter((a) => a.active).map((a) => ({ label: a.name, value: a.id })),
    ],
    [accountList],
  );
  const debtAccountOptions = useMemo(
    () => [
      { label: 'Not paying down a debt', value: '' },
      ...accountList.filter((a) => a.active && isLiability(a.kind)).map((a) => ({ label: a.name, value: a.id })),
    ],
    [accountList],
  );

  function openAddRecurring(direction: FinanceDirection) {
    setRecurringForm({ ...blankRecurringForm(), direction, category: direction === 'income' ? 'wages' : 'housing' });
    setEntryForm(null);
  }

  function openEditRecurring(row: FinanceRecurringRecord) {
    setRecurringForm(
      formFromRule(row.rule, {
        ...blankRecurringForm(),
        editingId: row.id,
        direction: row.direction,
        name: row.name,
        category: row.category,
        amount: String(row.amount),
        notes: row.notes ?? '',
        paidFromAccountId: row.paidFromAccountId ?? '',
        paidToAccountId: row.paidToAccountId ?? '',
      }),
    );
    setEntryForm(null);
  }

  async function saveRecurring() {
    if (!recurringForm) return;
    const form = recurringForm;
    if (!form.name.trim()) {
      showInfoAlert('Almost there', 'Give this a name you will recognize, like "Rent" or "Electric".');
      return;
    }
    // Reuses the grocery list's own price parser rather than a second one:
    // it already handles a typed amount, a spoken one, and the shapes
    // people actually say. A second parser would be a second thing to keep
    // correct.
    const amount = parsePriceInput(form.amount);
    if (amount == null || amount <= 0) {
      showInfoAlert('Almost there', 'Enter an amount greater than zero.');
      return;
    }
    const built = buildRule(form);
    if ('problem' in built) {
      showInfoAlert('Almost there', built.problem);
      return;
    }

    try {
      const payload = {
        direction: form.direction,
        name: form.name,
        category: form.category,
        amount,
        rule: built.rule,
        notes: form.notes,
        paidFromAccountId: form.paidFromAccountId || null,
        paidToAccountId: form.paidToAccountId || null,
      };
      if (form.editingId) await updateRecurring(form.editingId, payload);
      else await createRecurring(payload);
      setRecurringForm(null);
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  async function saveEntry() {
    if (!entryForm) return;
    const form = entryForm;
    const amount = parsePriceInput(form.amount);
    if (amount == null || amount <= 0) {
      showInfoAlert('Almost there', 'Enter an amount greater than zero.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.occurredOn)) {
      showInfoAlert('Almost there', 'Enter a valid date (YYYY-MM-DD).');
      return;
    }
    try {
      await createEntry({
        occurredOn: form.occurredOn,
        direction: form.direction,
        amount,
        category: form.category,
        description: form.description,
        paidFromAccountId: form.paidFromAccountId || null,
      });
      setEntryForm(null);
      load();
    } catch (error) {
      showInfoAlert('Could not save', error instanceof Error ? error.message : String(error));
    }
  }

  function confirmDeleteRecurring(row: FinanceRecurringRecord) {
    setConfirm({
      title: `Remove ${row.name}?`,
      message:
        'This deletes it and everything it contributes to your monthly figures. If it has only stopped for a while, pause it instead and it keeps its amount for when it comes back.',
      actions: [
        {
          label: 'Remove',
          destructive: true,
          onPress: async () => {
            setConfirm(null);
            await deleteRecurring(row.id);
            load();
          },
        },
        { label: 'Keep it', onPress: () => setConfirm(null) },
      ],
    });
  }

  // --- Renderers ------------------------------------------------------------

  function renderStat(label: string, value: string, tone?: 'good' | 'warn') {
    return (
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, tone === 'good' && styles.statGood, tone === 'warn' && styles.statWarn]}>{value}</Text>
      </View>
    );
  }

  function renderOverview() {
    const nothingYet = recurring.length === 0 && entries.length === 0 && picture.knownSpendTotal === 0;
    return (
      <>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{monthLabel(month)}</Text>
          <Text style={styles.bodyText}>{describeMonthPicture(picture)}</Text>
        </View>

        {nothingYet ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Start with what repeats</Text>
            <Text style={styles.bodyText}>
              Add what comes in and the bills that go out every month under Bills & Income. That alone answers what is
              left before anything else happens, which is the figure most worth knowing. Day-to-day spending can come
              later, and groceries you priced in the shop are already counted.
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setSection('recurring')}>
              <Text style={styles.primaryButtonText}>Add a bill or income</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Every month, as things stand</Text>
          {renderStat('Coming in', formatFinanceMoney(summary.monthlyIncome))}
          {renderStat('Regular bills', formatFinanceMoney(summary.monthlyCommitted))}
          {summary.monthlySetAside > 0 ? renderStat('Set aside', formatFinanceMoney(summary.monthlySetAside)) : null}
          {renderStat(
            'Left over',
            formatFinanceMoney(summary.monthlyLeftOver),
            summary.monthlyLeftOver < 0 ? 'warn' : 'good',
          )}
          <Text style={styles.footnote}>
            Worked out from {summary.activeCount} active {summary.activeCount === 1 ? 'entry' : 'entries'}, with weekly
            and every-two-weeks amounts converted using the real number of payments in a year rather than four a month.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What has actually gone out this month</Text>
          {renderStat('Recorded spending', formatFinanceMoney(picture.knownSpendTotal))}
          {tracked.grocerySpend > 0 ? renderStat('  from groceries', formatFinanceMoney(tracked.grocerySpend)) : null}
          {tracked.therapySpend > 0 ? renderStat('  from therapies', formatFinanceMoney(tracked.therapySpend)) : null}
          {picture.loggedIncome > 0 ? renderStat('Extra income logged', formatFinanceMoney(picture.loggedIncome)) : null}
          {picture.incompleteRecords > 0 ? (
            <Text style={styles.footnote}>
              {picture.incompleteRecords} {picture.incompleteRecords === 1 ? 'record has' : 'records have'} no amount
              recorded, so this is a floor rather than a total. Nothing is estimated to fill the gap.
            </Text>
          ) : null}
          {tracked.kitchenCoveredLines > 0 ? (
            <Text style={styles.footnote}>
              Your garden and ferments covered {tracked.kitchenCoveredLines}{' '}
              {tracked.kitchenCoveredLines === 1 ? 'line' : 'lines'} you would otherwise have bought. What that produce
              would have cost is not something this app knows, so it is counted rather than priced.
            </Text>
          ) : null}
        </View>

        {summary.byGroup.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Where your regular money goes</Text>
            {summary.byGroup.map((group) => {
              const share = summary.monthlyCommitted + summary.monthlySetAside > 0
                ? group.monthly / (summary.monthlyCommitted + summary.monthlySetAside)
                : 0;
              return (
                <View key={group.group} style={styles.barRow}>
                  <View style={styles.barLabelRow}>
                    <Text style={styles.barLabel}>{financeGroupLabel(group.group)}</Text>
                    <Text style={styles.barValue}>{formatFinanceMoney(group.monthly)}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.max(2, Math.round(share * 100))}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
      </>
    );
  }

  function renderRecurringSection() {
    const income = recurring.filter((row) => row.direction === 'income');
    const expenses = recurring.filter((row) => row.direction === 'expense');

    return (
      <>
        {!recurringForm ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => openAddRecurring('expense')}>
              <Text style={styles.primaryButtonText}>+ Add a bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => openAddRecurring('income')}>
              <Text style={styles.secondaryButtonText}>+ Add income</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {recurringForm ? renderRecurringForm() : null}

        {income.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Coming in</Text>
            {income.map((row) => renderRecurringRow(row))}
          </View>
        ) : null}

        {expenses.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Going out</Text>
            {expenses.map((row) => renderRecurringRow(row))}
          </View>
        ) : null}

        {recurring.length === 0 && !recurringForm ? (
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              Nothing added yet. Rent or mortgage, power, phone, insurance and whatever comes in are the ones worth
              adding first: between them they usually account for most of a month.
            </Text>
          </View>
        ) : null}
      </>
    );
  }

  function renderRecurringRow(row: FinanceRecurringRecord) {
    const monthly = row.active ? itemMonthly({ ...row }) : 0;
    return (
      <View key={row.id} style={[styles.listRow, !row.active && styles.listRowPaused]}>
        <View style={styles.listMain}>
          <Text style={styles.listTitle}>
            {row.name}
            {row.active ? '' : ' · paused'}
          </Text>
          <Text style={styles.listMeta}>
            {financeCategoryLabel(row.category)}
            {row.rule ? ` · ${describeDueRuleShort(row.rule)}` : ''}
          </Text>
          {row.rule ? <Text style={styles.listMeta}>{describeDueRule(row.rule)}</Text> : null}
          {!row.rule && row.active ? (
            <Text style={styles.listNeedsSetup}>Needs a due date before it can show under Coming Up.</Text>
          ) : null}
          {row.rule && row.rule.kind !== 'dayOfMonth' && row.active ? (
            <Text style={styles.listMeta}>{formatFinanceMoney(monthly)} a month</Text>
          ) : row.rule && row.rule.kind === 'dayOfMonth' && row.rule.months !== 1 && row.active ? (
            <Text style={styles.listMeta}>{formatFinanceMoney(monthly)} a month</Text>
          ) : null}
        </View>
        <View style={styles.listRight}>
          <Text style={styles.listAmount}>{formatFinanceMoney(row.amount)}</Text>
          <View style={styles.listActions}>
            <TouchableOpacity onPress={() => openEditRecurring(row)}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                await setRecurringActive(row.id, !row.active);
                load();
              }}
            >
              <Text style={styles.actionText}>{row.active ? 'Pause' : 'Resume'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => confirmDeleteRecurring(row)}>
              <Text style={styles.actionTextRemove}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  function renderRecurringForm() {
    if (!recurringForm) return null;
    const form = recurringForm;
    const isWeekBased = form.frequency in WEEKS_FOR;
    // Built as the form is filled in, so the preview is the real rule
    // rather than a second description of it that could drift from what
    // actually gets saved.
    const built = buildRule(form);
    const previewRule = 'rule' in built ? built.rule : null;
    const previewNext = previewRule ? nextOccurrence(previewRule, todayLocal()) : null;
    return (
      <View style={styles.formCard}>
        <Text style={styles.label}>What kind</Text>
        <PopoverSelect
          options={DIRECTION_OPTIONS}
          selected={form.direction}
          onSelect={(value) =>
            setRecurringForm({
              ...form,
              direction: value as FinanceDirection,
              category: value === 'income' ? 'wages' : 'housing',
            })
          }
          tabColor={TAB_COLOR}
        />

        <View style={styles.labelRow}>
          <Text style={styles.label}>Name</Text>
          <VoiceInputButton onResult={(text) => setRecurringForm({ ...form, name: text })} color={TAB_COLOR} />
        </View>
        <AppTextInput
          style={styles.input}
          placeholder={form.direction === 'income' ? 'e.g. Paycheck' : 'e.g. Rent'}
          value={form.name}
          onChangeText={(text) => setRecurringForm({ ...form, name: text })}
        />

        <Text style={styles.label}>Category</Text>
        <PopoverSelect
          options={categoryOptions}
          selected={form.category}
          onSelect={(value) => setRecurringForm({ ...form, category: value })}
          tabColor={TAB_COLOR}
          searchable
        />

        <Text style={styles.label}>Amount</Text>
        <AppTextInput
          style={[styles.input, styles.shortInput]}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={form.amount}
          onChangeText={(text) => setRecurringForm({ ...form, amount: text })}
        />

        <Text style={styles.label}>How often</Text>
        <PopoverSelect
          options={FREQUENCY_OPTIONS}
          selected={form.frequency}
          onSelect={(value) => setRecurringForm({ ...form, frequency: value as Frequency })}
          tabColor={TAB_COLOR}
        />

        {isWeekBased ? (
          <>
            <Text style={styles.label}>Which day</Text>
            <PopoverSelect
              options={WEEKDAY_OPTIONS}
              selected={String(form.weekday)}
              onSelect={(value) => setRecurringForm({ ...form, weekday: Number(value) as Weekday })}
              tabColor={TAB_COLOR}
            />
            <Text style={styles.label}>A date it landed on</Text>
            <View style={styles.inlineRow}>
              <AppTextInput
                style={[styles.input, styles.shortInput]}
                placeholder="YYYY-MM-DD"
                value={form.weekAnchor}
                onChangeText={(text) => setRecurringForm({ ...form, weekAnchor: text })}
              />
              <TouchableOpacity style={styles.pillSmall} onPress={() => setRecurringForm({ ...form, weekAnchor: todayLocal() })}>
                <Text style={styles.pillTextSmall}>Today</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {form.frequency === 'w1'
                ? 'Any recent one will do, since it happens every week.'
                : 'This is what tells the app which weeks it falls in. Any date in the right week works, and it will be moved onto the day you picked above.'}
            </Text>
          </>
        ) : form.frequency === 'twice' ? (
          <>
            <Text style={styles.label}>Which two days</Text>
            <View style={styles.inlineRow}>
              <AppTextInput
                style={[styles.input, styles.tinyInput]}
                placeholder="1"
                keyboardType="number-pad"
                maxLength={2}
                value={form.day}
                onChangeText={(text) => setRecurringForm({ ...form, day: text })}
              />
              <Text style={styles.bodyText}>and</Text>
              <AppTextInput
                style={[styles.input, styles.tinyInput]}
                placeholder="15"
                keyboardType="number-pad"
                maxLength={2}
                value={form.day2}
                onChangeText={(text) => setRecurringForm({ ...form, day2: text })}
              />
            </View>
            <Text style={styles.helperText}>
              The 1st and 15th is the usual pair. Either day set to 31 lands on the last day of shorter months.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>Lands on</Text>
            <PopoverSelect
              options={MONTH_MODE_OPTIONS}
              selected={form.monthMode}
              onSelect={(value) => setRecurringForm({ ...form, monthMode: value as 'date' | 'weekday' })}
              tabColor={TAB_COLOR}
            />

            {form.monthMode === 'date' ? (
              <>
                <Text style={styles.label}>Day of the month</Text>
                <AppTextInput
                  style={[styles.input, styles.shortInput]}
                  placeholder="e.g. 1"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={form.day}
                  onChangeText={(text) => setRecurringForm({ ...form, day: text })}
                />
                <Text style={styles.helperText}>
                  Set to 31 and it lands on the last day of shorter months rather than being skipped.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.label}>Which one</Text>
                <View style={styles.inlineRow}>
                  <PopoverSelect
                    options={WEEK_OPTIONS}
                    selected={String(form.week)}
                    onSelect={(value) =>
                      setRecurringForm({ ...form, week: (value === 'last' ? 'last' : Number(value)) as WeekOfMonth })
                    }
                    tabColor={TAB_COLOR}
                  />
                  <PopoverSelect
                    options={WEEKDAY_OPTIONS}
                    selected={String(form.weekday)}
                    onSelect={(value) => setRecurringForm({ ...form, weekday: Number(value) as Weekday })}
                    tabColor={TAB_COLOR}
                  />
                </View>
                <Text style={styles.helperText}>
                  For a bill that falls on something like the second Tuesday rather than a fixed date.
                </Text>
              </>
            )}

            {MONTHS_FOR[form.frequency] > 1 ? (
              <>
                <Text style={styles.label}>The next one falls in</Text>
                <AppTextInput
                  style={[styles.input, styles.shortInput]}
                  placeholder="YYYY-MM"
                  maxLength={7}
                  value={form.anchorMonth}
                  onChangeText={(text) => setRecurringForm({ ...form, anchorMonth: text })}
                />
                <Text style={styles.helperText}>
                  Without this the app cannot tell which months are in the cycle, and would show it every month.
                </Text>
              </>
            ) : null}
          </>
        )}

        {accountList.length > 0 ? (
          <>
            <Text style={styles.label}>
              {form.direction === 'income' ? 'Paid into (optional)' : 'Paid from (optional)'}
            </Text>
            <PopoverSelect
              options={accountOptions}
              selected={form.paidFromAccountId}
              onSelect={(value) => setRecurringForm({ ...form, paidFromAccountId: value })}
              tabColor={TAB_COLOR}
              searchable
            />
            <Text style={styles.helperText}>
              Saying which account this moves through lets the app warn you when more is due out of it than is in it.
              Nothing is deducted automatically: what you typed as a balance stays what you typed.
            </Text>

            {form.direction === 'expense' && debtAccountOptions.length > 1 ? (
              <>
                <Text style={styles.label}>Paying down (optional)</Text>
                <PopoverSelect
                  options={debtAccountOptions}
                  selected={form.paidToAccountId}
                  onSelect={(value) => setRecurringForm({ ...form, paidToAccountId: value })}
                  tabColor={TAB_COLOR}
                  searchable
                />
                <Text style={styles.helperText}>
                  For a card or loan payment. This is how the app spots the same payment being counted twice, once here
                  and once as that debt&apos;s minimum payment under Accounts.
                </Text>
              </>
            ) : null}
          </>
        ) : null}

        {previewRule ? (
          <View style={styles.previewBox}>
            <Text style={styles.previewLabel}>This will be due</Text>
            <Text style={styles.previewText}>{describeDueRule(previewRule)}</Text>
            {previewNext ? <Text style={styles.previewText}>Next: {shortDate(previewNext)}</Text> : null}
          </View>
        ) : null}

        <View style={styles.formActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setRecurringForm(null)}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={saveRecurring}>
            <Text style={styles.primaryButtonText}>{form.editingId ? 'Save changes' : 'Add it'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderSpending() {
    return (
      <>
        {!entryForm ? (
          <TouchableOpacity style={styles.primaryButton} onPress={() => setEntryForm(blankEntryForm())}>
            <Text style={styles.primaryButtonText}>+ Record something</Text>
          </TouchableOpacity>
        ) : null}

        {entryForm ? (
          <View style={styles.formCard}>
            <Text style={styles.label}>What kind</Text>
            <PopoverSelect
              options={DIRECTION_OPTIONS}
              selected={entryForm.direction}
              onSelect={(value) =>
                setEntryForm({
                  ...entryForm,
                  direction: value as FinanceDirection,
                  category: value === 'income' ? 'other_income' : 'dining_out',
                })
              }
              tabColor={TAB_COLOR}
            />

            <Text style={styles.label}>Amount</Text>
            <AppTextInput
              style={[styles.input, styles.shortInput]}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={entryForm.amount}
              onChangeText={(text) => setEntryForm({ ...entryForm, amount: text })}
            />

            <Text style={styles.label}>Category</Text>
            <PopoverSelect
              options={categoryOptions}
              selected={entryForm.category}
              onSelect={(value) => setEntryForm({ ...entryForm, category: value })}
              tabColor={TAB_COLOR}
              searchable
            />

            <Text style={styles.label}>Date</Text>
            <View style={styles.inlineRow}>
              <AppTextInput
                style={[styles.input, styles.shortInput]}
                placeholder="YYYY-MM-DD"
                value={entryForm.occurredOn}
                onChangeText={(text) => setEntryForm({ ...entryForm, occurredOn: text })}
              />
              <TouchableOpacity style={styles.pillSmall} onPress={() => setEntryForm({ ...entryForm, occurredOn: todayLocal() })}>
                <Text style={styles.pillTextSmall}>Today</Text>
              </TouchableOpacity>
            </View>

            {accountList.length > 0 ? (
              <>
                <Text style={styles.label}>
                  {entryForm.direction === 'income' ? 'Paid into (optional)' : 'Paid from (optional)'}
                </Text>
                <PopoverSelect
                  options={accountOptions}
                  selected={entryForm.paidFromAccountId}
                  onSelect={(value) => setEntryForm({ ...entryForm, paidFromAccountId: value })}
                  tabColor={TAB_COLOR}
                  searchable
                />
              </>
            ) : null}

            <View style={styles.labelRow}>
              <Text style={styles.label}>Note (optional)</Text>
              <VoiceInputButton onResult={(text) => setEntryForm({ ...entryForm, description: text })} color={TAB_COLOR} />
            </View>
            <AppTextInput
              style={styles.input}
              placeholder="e.g. lunch with Ana"
              value={entryForm.description}
              onChangeText={(text) => setEntryForm({ ...entryForm, description: text })}
            />

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setEntryForm(null)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={saveEntry}>
                <Text style={styles.primaryButtonText}>Record it</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Monthly limits</Text>
          {budgetRows.length === 0 ? (
            <Text style={styles.bodyText}>
              Set a limit on a category you want to keep an eye on, and this shows how much of it is used up. Groceries
              is usually the one worth starting with, since it is already counted for you from what you price in the
              shop.
            </Text>
          ) : (
            budgetRows.map((row) => (
              <View key={row.category} style={styles.barRow}>
                <View style={styles.barLabelRow}>
                  <Text style={styles.barLabel}>{financeCategoryLabel(row.category)}</Text>
                  <Text style={[styles.barValue, row.overspent && styles.statWarn]}>
                    {formatAccountMoney(row.spent)} of {formatAccountMoney(row.limit)}
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      row.overspent && styles.barFillOver,
                      { width: `${Math.max(2, Math.round(row.fraction * 100))}%` },
                    ]}
                  />
                </View>
                <View style={styles.barLabelRow}>
                  <Text style={styles.listMeta}>
                    {row.overspent
                      ? `${formatAccountMoney(row.spent - row.limit)} over`
                      : `${formatAccountMoney(row.remaining)} left`}
                    {row.committed > 0 ? ` · ${formatAccountMoney(row.committed)} already committed by bills` : ''}
                  </Text>
                  <TouchableOpacity
                    onPress={async () => {
                      await removeBudget(row.category);
                      load();
                    }}
                  >
                    <Text style={styles.actionTextRemove}>Remove</Text>
                  </TouchableOpacity>
                </View>
                {row.committedAlone ? (
                  <Text style={styles.listNeedsSetup}>
                    Regular bills in this category already come to more than the limit, so it cannot be met without
                    changing the bills themselves.
                  </Text>
                ) : null}
              </View>
            ))
          )}

          {budgetForm ? (
            <>
              <Text style={styles.label}>Category</Text>
              <PopoverSelect
                options={expenseCategoriesByGroup().flatMap((group) =>
                  group.categories.map((c) => ({ label: `${group.label}: ${c.label}`, value: c.code })),
                )}
                selected={budgetForm.category}
                onSelect={(value) => setBudgetForm({ ...budgetForm, category: value })}
                tabColor={TAB_COLOR}
                searchable
              />
              <Text style={styles.label}>Limit each month</Text>
              <AppTextInput
                style={[styles.input, styles.shortInput]}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={budgetForm.limit}
                onChangeText={(text) => setBudgetForm({ ...budgetForm, limit: text })}
              />
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setBudgetForm(null)}>
                  <Text style={styles.secondaryButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={async () => {
                    const limit = parsePriceInput(budgetForm.limit);
                    if (limit == null || limit <= 0) {
                      showInfoAlert('Almost there', 'Enter a limit greater than zero.');
                      return;
                    }
                    await setBudget(budgetForm.category, limit);
                    setBudgetForm(null);
                    load();
                  }}
                >
                  <Text style={styles.primaryButtonText}>Set it</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.secondaryButton} onPress={() => setBudgetForm({ category: 'groceries', limit: '' })}>
              <Text style={styles.secondaryButtonText}>+ Set a limit</Text>
            </TouchableOpacity>
          )}
        </View>

        {tracked.grocerySpend > 0 || tracked.therapySpend > 0 || tracked.groceryLinesWithoutPrice > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Already counted for you</Text>
            {tracked.grocerySpend > 0 ? renderStat('Groceries', formatFinanceMoney(tracked.grocerySpend)) : null}
            {tracked.therapySpend > 0 ? renderStat('Hands-on therapies', formatFinanceMoney(tracked.therapySpend)) : null}
            <Text style={styles.footnote}>
              Read from your grocery lists and therapy sessions rather than copied here, so a price corrected there is
              corrected everywhere. Do not enter these again by hand.
              {picture.incompleteRecords > 0
                ? ` ${picture.incompleteRecords} of them have no amount recorded and are left out rather than guessed at.`
                : ''}
            </Text>
          </View>
        ) : null}

        {entries.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recorded in {monthLabel(month)}</Text>
            {entries.map((row) => (
              <View key={row.id} style={styles.listRow}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle}>{row.description || financeCategoryLabel(row.category)}</Text>
                  <Text style={styles.listMeta}>
                    {shortDate(row.occurredOn)} · {financeCategoryLabel(row.category)}
                  </Text>
                </View>
                <View style={styles.listRight}>
                  <Text style={[styles.listAmount, row.direction === 'income' && styles.statGood]}>
                    {row.direction === 'income' ? '+' : ''}
                    {formatFinanceMoney(row.amount)}
                  </Text>
                  <TouchableOpacity
                    onPress={async () => {
                      await deleteEntry(row.id);
                      load();
                    }}
                  >
                    <Text style={styles.actionTextRemove}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : !entryForm ? (
          <View style={styles.card}>
            <Text style={styles.bodyText}>
              Nothing recorded by hand this month. This is for the things that are not already tracked somewhere else:
              a meal out, a repair, fuel. Groceries and therapy sessions you have already priced are counted without
              being entered again.
            </Text>
          </View>
        ) : null}
      </>
    );
  }

  function renderUpcoming() {
    return (
      <>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Next {UPCOMING_WINDOW_DAYS} days</Text>
          {soon.bills.length === 0 ? (
            <Text style={styles.bodyText}>
              Nothing with a set date is due in the next {UPCOMING_WINDOW_DAYS} days. Adding a day of the month to a
              bill is what puts it here.
            </Text>
          ) : (
            soon.bills.map(({ item, dueDate, daysAway }) => (
              <View key={item.id} style={styles.listRow}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle}>{item.name}</Text>
                  <Text style={styles.listMeta}>
                    {shortDate(dueDate)} · {describeDaysAway(daysAway)}
                  </Text>
                  {item.rule ? <Text style={styles.listMeta}>{describeDueRule(item.rule)}</Text> : null}
                </View>
                <Text style={styles.listAmount}>{formatFinanceMoney(item.amount)}</Text>
              </View>
            ))
          )}
          {soon.bills.length > 0 ? (
            <Text style={styles.footnote}>Total due in this window: {formatFinanceMoney(soon.total)}</Text>
          ) : null}
        </View>

        {funds.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Worth putting by each month</Text>
            <Text style={styles.bodyText}>
              A bill that lands once or twice a year is the one most likely to wreck a month, because it sits outside
              the monthly rhythm. This is what each would cost if you set it aside a bit at a time instead.
            </Text>
            {funds.map((fund) => (
              <View key={fund.name} style={styles.listRow}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle}>{fund.name}</Text>
                  <Text style={styles.listMeta}>
                    {formatAccountMoney(fund.amount)}
                    {fund.nextDue ? ` due ${shortDate(fund.nextDue)}` : ''}
                    {fund.monthsUntilDue != null
                      ? fund.monthsUntilDue === 0
                        ? ' · this month'
                        : ` · ${fund.monthsUntilDue} ${fund.monthsUntilDue === 1 ? 'month' : 'months'} away`
                      : ''}
                  </Text>
                  {fund.shouldHaveByNow != null && fund.shouldHaveByNow > 0 ? (
                    <Text style={styles.listMeta}>
                      About {formatAccountMoney(fund.shouldHaveByNow)} of it would be put by by now, if you had started
                      right after the last one.
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.listAmount}>{formatAccountMoney(fund.monthlySetAside)}/mo</Text>
              </View>
            ))}
            <Text style={styles.footnote}>
              This app does not move money, so nothing here is set aside for you. It is the figure to aim at.
            </Text>
          </View>
        ) : null}

        {soon.needsSetup.length > 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Needs a due date</Text>
            <Text style={styles.bodyText}>
              These still count toward your monthly figures. They cannot be put on a calendar yet, because each one is
              missing the piece that says when it lands.
            </Text>
            {soon.needsSetup.map((item) => (
              <View key={item.id} style={styles.listRow}>
                <View style={styles.listMain}>
                  <Text style={styles.listTitle}>{item.name}</Text>
                  <Text style={styles.listMeta}>
                    {item.rule
                      ? describeMissingPiece(item.rule)
                      : 'No schedule set yet. Open it under Bills & Income and choose how often it repeats.'}
                  </Text>
                </View>
                <Text style={styles.listAmount}>{formatFinanceMoney(item.amount)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </>
    );
  }

  return (
    <View style={styles.screen}>
      <SwipeableTabScreen enabled={!revealed}>
        <GatedTabContent pageTitle="Life" variant="field" revealed={revealed}>
          <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}>
            {infoAlertElement}
            <AppActionSheet
              visible={confirm !== null}
              onClose={() => setConfirm(null)}
              title={confirm?.title}
              message={confirm?.message}
              actions={confirm?.actions ?? []}
            />

            <View style={styles.sectionPillRow}>
              {SECTIONS.map((entry) => (
                <TouchableOpacity
                  key={entry.key}
                  style={[styles.pill, section === entry.key && styles.pillActive]}
                  onPress={() => setSection(entry.key)}
                >
                  <Text style={[styles.pillText, section === entry.key && styles.pillTextActive]}>{entry.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {loading ? (
              <Text style={[styles.bodyText, styles.panelStandalone]}>Adding things up…</Text>
            ) : section === 'overview' ? (
              renderOverview()
            ) : section === 'health' ? (
              <FinanceHealthSection tabColor={TAB_COLOR} />
            ) : section === 'recurring' ? (
              renderRecurringSection()
            ) : section === 'spending' ? (
              renderSpending()
            ) : section === 'money' ? (
              <FinanceMoneySection tabColor={TAB_COLOR} />
            ) : (
              renderUpcoming()
            )}
          </ScrollView>
        </GatedTabContent>
      </SwipeableTabScreen>

      <PageIdentityLabel title="Life" activeLensLabel={revealed ? activeLensLabel : undefined} />
      <MyItemsHub label="My Life" tabColor={TAB_COLOR} open={myLifeOpen} onOpenChange={setMyLifeOpen} />
      <LensHub
        pageTitle="Life"
        options={LIFE_LENSES}
        selected={revealed ? lens : undefined}
        columns={3}
        autoOpenSignal={autoOpenLensHub}
        extraTile={{ label: 'My Life', icon: 'bookmarks-outline', onPress: () => setMyLifeOpen(true) }}
        onSelect={(key) => {
          setLens(key);
          setRevealed(true);
        }}
      />
    </View>
  );
}

// Kept here rather than exported from financeCategories, since it is only
// ever a display concern for this one screen's own bar chart.
function financeGroupLabel(group: string): string {
  const labels: Record<string, string> = {
    home: 'Home',
    utilities: 'Utilities',
    health: 'Health',
    food: 'Food',
    transport: 'Getting Around',
    debt: 'Money Owed',
    everyday: 'Everyday',
    setAside: 'Set Aside',
    other: 'Other',
  };
  return labels[group] ?? group;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 32 },

  // Every standalone line of text gets a surface, per the standing
  // no-text-on-the-tab-background rule.
  panelStandalone: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  sectionPillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillActive: { backgroundColor: TAB_COLOR, borderColor: TAB_COLOR },
  pillText: { ...typography.caption, color: colors.textPrimary, ...textShadow },
  pillTextActive: { color: colors.textOnPrimary, textShadowColor: 'transparent', textShadowRadius: 0 },
  pillSmall: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillTextSmall: { ...typography.caption, color: colors.textPrimary, ...textShadow },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: TAB_COLOR,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: TAB_COLOR,
  },
  cardTitle: { ...typography.sectionTitle, color: colors.textPrimary, marginBottom: 10, ...textShadow },
  bodyText: { ...typography.body, color: colors.textSecondary, ...textShadow },
  footnote: { ...typography.caption, color: colors.textMuted, marginTop: 10, ...textShadow },
  helperText: { ...typography.caption, color: colors.textMuted, marginTop: 6, marginBottom: 4, ...textShadow },

  label: { ...typography.label, color: colors.menuLabelMuted, marginTop: 12, marginBottom: 4, ...textShadow },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
  },
  shortInput: { maxWidth: 160 },
  tinyInput: { maxWidth: 72 },
  previewBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    borderLeftWidth: 3,
    borderLeftColor: TAB_COLOR,
  },
  previewLabel: { ...typography.caption, color: colors.textMuted, marginBottom: 4, ...textShadow },
  previewText: { ...typography.body, color: colors.textPrimary, ...textShadow },
  listNeedsSetup: { ...typography.caption, color: colors.statusYellowStandalone, marginTop: 2, ...textShadow },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 4, gap: 12 },
  statLabel: { ...typography.body, color: colors.textSecondary, flex: 1, ...textShadow },
  statValue: { ...typography.body, color: colors.textPrimary, fontVariant: ['tabular-nums'], ...textShadow },
  statGood: { color: colors.statusGood },
  statWarn: { color: colors.danger },

  barRow: { marginBottom: 12 },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, gap: 12 },
  barLabel: { ...typography.caption, color: colors.textSecondary, flex: 1, ...textShadow },
  barValue: { ...typography.caption, color: colors.textPrimary, fontVariant: ['tabular-nums'], ...textShadow },
  barTrack: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4, backgroundColor: TAB_COLOR },
  barFillOver: { backgroundColor: colors.danger },

  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  listRowPaused: { opacity: 0.55 },
  listMain: { flex: 1 },
  listRight: { alignItems: 'flex-end' },
  listTitle: { ...typography.body, color: colors.textPrimary, ...textShadow },
  listMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, ...textShadow },
  listAmount: { ...typography.body, color: colors.textPrimary, fontVariant: ['tabular-nums'], ...textShadow },
  listActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionText: { ...typography.caption, color: TAB_COLOR, ...textShadow },
  actionTextRemove: { ...typography.caption, color: colors.danger, ...textShadow },

  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  primaryButton: {
    backgroundColor: colors.buttonColor,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 12,
    ...BUTTON_SHADOW,
  },
  primaryButtonText: { ...typography.body, color: colors.textOnButton, textShadowColor: 'transparent', textShadowRadius: 0 },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { ...typography.body, color: colors.textPrimary, ...textShadow },
});
