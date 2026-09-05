// Runs lib/financeHealth.ts: deductible and out-of-pocket standing, HSA and
// FSA, the Explanation of Benefits check, and cost per condition.
//
// Built 2026-09-05, pass 1 of the Finances rebuild.
//
// The cases weighted hardest are the four where a wrong answer is both
// plausible-looking and expensive:
//
//  1. The EOB check. The provider's billed amount is NOT part of the
//     equation. Billed above allowed is written off under the plan's
//     contract, and treating that difference as money owed is the most
//     common misreading of an EOB. An app repeating it would send someone
//     to argue about a charge that was never theirs.
//  2. Reached limits. Once the out-of-pocket maximum is met, covered care
//     costs nothing more. Getting that boundary wrong either hides real
//     money or invents relief that is not there.
//  3. FSA against HSA. FSA money is forfeited; HSA money never is. Warning
//     about an HSA would be wrong, and failing to warn about an FSA costs
//     real money.
//  4. Untagged cost. It must be reported on its own and never divided
//     across conditions, which would turn one honest number into several
//     invented ones.
//
// Run with: node scripts/test_finance_health.js
// Exits non-zero on any failure.

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

function load(relPath) {
  const source = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: path.basename(relPath),
  });
  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('exports', 'module', outputText)(module.exports, module);
  return module.exports;
}

const H = load('lib/financeHealth.ts');
const {
  planStanding, describePlanStanding, billsInPlanYear,
  healthAccountStanding, describeHealthAccount, FORFEIT_WARNING_DAYS,
  checkBill, rollUpConditionCosts, describeConditionCosts, formatHealthMoney,
} = H;

let failures = 0;
let checks = 0;
function check(label, actual, expected) {
  checks += 1;
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.error(`FAIL  ${label}`);
    console.error(`      expected ${JSON.stringify(expected)}`);
    console.error(`      got      ${JSON.stringify(actual)}`);
  }
}
function checkTrue(label, actual) { check(label, actual === true, true); }

function bill(over = {}) {
  return {
    id: over.id || Math.random().toString(36).slice(2),
    serviceDate: '2026-03-10',
    provider: 'Clinic',
    description: null,
    billed: null,
    allowed: null,
    insurancePaid: null,
    youOwe: null,
    paidAmount: null,
    status: 'unpaid',
    appliedToDeductible: null,
    appliedToOutOfPocket: null,
    conditionCode: null,
    ...over,
  };
}

const plan = {
  id: 'p1',
  name: 'Employer PPO',
  yearStart: '2026-01-01',
  deductible: 2000,
  outOfPocketMax: 6000,
  deductibleMetAtStart: 0,
  outOfPocketMetAtStart: 0,
};

// --- 1. The EOB check -------------------------------------------------------
// allowed - insurancePaid = youOwe. The billed amount is not in it.

{
  // A provider bills $500, the plan's contract says the service is worth
  // $300, insurance pays $240, so $60 is owed. The $200 above allowed is
  // written off and is NOT the patient's problem.
  const c = checkBill(bill({ billed: 500, allowed: 300, insurancePaid: 240, youOwe: 60 }));
  check('a correct EOB balances', c.balances, true);
  check('with no discrepancy', c.discrepancy, 0);
  checkTrue('and says so plainly', c.message.includes('add up'));
}
{
  // The trap: if billed were used instead of allowed, this would be called
  // an error. It is not. This is exactly how a real EOB looks.
  const c = checkBill(bill({ billed: 1200, allowed: 400, insurancePaid: 400, youOwe: 0 }));
  check('billed far above allowed is not an error', c.balances, true);
  check('nothing is owed when insurance covered the allowed amount', c.discrepancy, 0);
}
{
  const c = checkBill(bill({ billed: 500, allowed: 300, insurancePaid: 240, youOwe: 160 }));
  check('being overbilled is caught', c.balances, false);
  check('by the right amount', c.discrepancy, 100);
  checkTrue('and the wording says to ask before paying', c.message.includes('before paying'));
}
{
  const c = checkBill(bill({ billed: 500, allowed: 300, insurancePaid: 240, youOwe: 20 }));
  check('being underbilled is also flagged', c.balances, false);
  check('with a negative discrepancy', c.discrepancy, -40);
}
{
  const c = checkBill(bill({ allowed: 300, insurancePaid: 240, youOwe: 60.004 }));
  check('a fraction of a cent is rounding, not an error', c.balances, true);
}
{
  const c = checkBill(bill({ billed: 500 }));
  check('an incomplete EOB is not called correct', c.balances, false);
  check('and its discrepancy is unknown, not zero', c.discrepancy, null);
  checkTrue('the wording says why', c.message.includes('Not enough'));
}

// --- 2. Standing against the plan ------------------------------------------

{
  const bills = [
    bill({ serviceDate: '2026-02-01', appliedToDeductible: 400, appliedToOutOfPocket: 400 }),
    bill({ serviceDate: '2026-04-01', appliedToDeductible: 350, appliedToOutOfPocket: 350 }),
  ];
  const s = planStanding(plan, bills);
  check('deductible met is the sum', s.deductible.met, 750);
  check('remaining is what is left', s.deductible.remaining, 1250);
  check('fraction for a progress bar', s.deductible.fraction, 0.375);
  check('not reached yet', s.deductible.reached, false);
  check('bills counted', s.billCount, 2);
  check('none missing amounts', s.billsMissingAmounts, 0);
  checkTrue('the wording names what is left', describePlanStanding(s).includes('$1,250.00'));
}
{
  // Starting mid-year: what was already met before tracking began.
  const midYear = { ...plan, deductibleMetAtStart: 1500, outOfPocketMetAtStart: 1800 };
  const s = planStanding(midYear, [bill({ serviceDate: '2026-07-01', appliedToDeductible: 600, appliedToOutOfPocket: 600 })]);
  check('the starting offset is included', s.deductible.met, 2100);
  check('and the deductible reads as met', s.deductible.reached, true);
  check('capped at 1 rather than over', s.deductible.fraction, 1);
  check('with nothing remaining', s.deductible.remaining, 0);
  checkTrue('the wording switches to the plan paying its share', describePlanStanding(s).includes('plan is now paying'));
}
{
  const s = planStanding({ ...plan, outOfPocketMetAtStart: 6000 }, []);
  check('the out-of-pocket maximum reads as reached', s.outOfPocket.reached, true);
  checkTrue('and the wording says covered care costs nothing more',
    describePlanStanding(s).includes('should cost you nothing more'));
}
{
  const s = planStanding(plan, [bill({ serviceDate: '2026-02-01' }), bill({ serviceDate: '2026-03-01', appliedToDeductible: 100 })]);
  check('a bill with no figures at all is counted as missing', s.billsMissingAmounts, 1);
  checkTrue('and the total is called a floor', describePlanStanding(s).includes('floor rather than'));
}
{
  const noLimits = { ...plan, deductible: null, outOfPocketMax: null };
  const s = planStanding(noLimits, []);
  check('no limit set means no fraction, rather than an empty bar at zero', s.deductible.fraction, null);
  check('and no remaining figure', s.deductible.remaining, null);
  checkTrue('the wording asks for the plan details', describePlanStanding(s).includes('Add your plan'));
}

// A plan year that does not start in January, which many do not.
{
  const julyPlan = { ...plan, yearStart: '2026-07-01' };
  const bills = [
    bill({ id: 'before', serviceDate: '2026-06-30', appliedToDeductible: 500 }),
    bill({ id: 'first', serviceDate: '2026-07-01', appliedToDeductible: 500 }),
    bill({ id: 'inside', serviceDate: '2027-01-15', appliedToDeductible: 300 }),
    bill({ id: 'after', serviceDate: '2027-07-01', appliedToDeductible: 900 }),
  ];
  check('only bills inside the plan year count', billsInPlanYear(bills, '2026-07-01').map((b) => b.id), ['first', 'inside']);
  check('the day before the year starts is out', planStanding(julyPlan, bills).deductible.met, 800);
}

// --- 3. HSA against FSA -----------------------------------------------------

{
  const fsa = { id: 'f', kind: 'fsa', planYear: '2026', contributed: 2400, spent: 1900, deadline: '2026-12-31' };
  const s = healthAccountStanding(fsa, '2026-11-15');
  check('available is contributed minus spent', s.available, 500);
  check('days counted to the deadline', s.daysUntilDeadline, 46);
  check('and it is flagged at risk', s.atRiskOfForfeit, true);
  checkTrue('the wording says forfeited, not just expiring', describeHealthAccount(s).includes('forfeited'));
}
{
  // The same money in an HSA is never at risk, and saying otherwise would
  // push someone into spending they did not need to.
  const hsa = { id: 'h', kind: 'hsa', planYear: '2026', contributed: 2400, spent: 1900, deadline: null };
  const s = healthAccountStanding(hsa, '2026-11-15');
  check('an HSA is never at risk of forfeit', s.atRiskOfForfeit, false);
  checkTrue('and the wording says it rolls over', describeHealthAccount(s).includes('rolls over'));
}
{
  const fsa = { id: 'f', kind: 'fsa', planYear: '2026', contributed: 2400, spent: 1900, deadline: '2026-12-31' };
  check('far from the deadline is not a warning', healthAccountStanding(fsa, '2026-01-15').atRiskOfForfeit, false);
  check('exactly at the warning boundary is', healthAccountStanding(fsa, '2026-10-02').daysUntilDeadline, FORFEIT_WARNING_DAYS);
  check('and flagged', healthAccountStanding(fsa, '2026-10-02').atRiskOfForfeit, true);
}
{
  const spent = { id: 'f', kind: 'fsa', planYear: '2026', contributed: 2400, spent: 2400, deadline: '2026-12-31' };
  const s = healthAccountStanding(spent, '2026-12-20');
  check('nothing left is not at risk', s.atRiskOfForfeit, false);
  checkTrue('and says so', describeHealthAccount(s).includes('Nothing left to forfeit'));
}
{
  const past = { id: 'f', kind: 'fsa', planYear: '2026', contributed: 2400, spent: 1000, deadline: '2026-12-31' };
  const s = healthAccountStanding(past, '2027-01-10');
  check('a passed deadline is not still a live warning', s.atRiskOfForfeit, false);
  checkTrue('but it is not silent either', describeHealthAccount(s).includes('deadline passed'));
}
{
  const noDeadline = { id: 'f', kind: 'fsa', planYear: '2026', contributed: 500, spent: 0, deadline: null };
  const s = healthAccountStanding(noDeadline, '2026-11-15');
  check('an FSA with no deadline recorded cannot be warned about', s.atRiskOfForfeit, false);
  checkTrue('so it asks for the date', describeHealthAccount(s).includes('Add the date'));
}

// --- 4. Cost per condition, and the refusal to divide the untagged ---------

{
  const rollup = rollUpConditionCosts([
    { amount: 240, conditionCode: 'hashimotos', source: 'medicalBill' },
    { amount: 45, conditionCode: 'hashimotos', source: 'recurring' },
    { amount: 80, conditionCode: 'hashimotos', source: 'therapy' },
    { amount: 300, conditionCode: 'migraine', source: 'medicalBill' },
    { amount: 400, conditionCode: null, source: 'entry' },
  ]);

  check('the costliest condition leads', rollup.byCondition[0].conditionCode, 'hashimotos');
  check('its total adds every source', rollup.byCondition[0].total, 365);
  check('and each source is kept separate', rollup.byCondition[0].bySource.therapy, 80);
  check('the second condition follows', rollup.byCondition[1].conditionCode, 'migraine');
  check('untagged money stands alone', rollup.untagged, 400);
  check('and is not added into any condition', rollup.byCondition.reduce((s, c) => s + c.total, 0), 665);
  check('the overall total includes it', rollup.total, 1065);
  check('two conditions, not three', rollup.byCondition.length, 2);

  const text = describeConditionCosts(rollup, (code) => (code === 'hashimotos' ? "Hashimoto's" : 'Migraine'));
  checkTrue('names the condition', text.includes("Hashimoto's"));
  checkTrue('and says the untagged money is left out rather than split', text.includes('rather than divided'));
}
{
  const rollup = rollUpConditionCosts([{ amount: 500, conditionCode: null, source: 'entry' }]);
  check('all untagged means no conditions listed', rollup.byCondition.length, 0);
  checkTrue('and the wording says none is tagged yet',
    describeConditionCosts(rollup, () => 'x').includes('none of it tagged'));
}
{
  const rollup = rollUpConditionCosts([]);
  check('nothing recorded totals zero', rollup.total, 0);
  checkTrue('and invites the first tag', describeConditionCosts(rollup, () => 'x').includes('Tag a bill'));
}
{
  const rollup = rollUpConditionCosts([
    { amount: 0, conditionCode: 'hashimotos', source: 'entry' },
    { amount: NaN, conditionCode: 'hashimotos', source: 'entry' },
    { amount: 50, conditionCode: 'hashimotos', source: 'entry' },
  ]);
  check('zero and nonsense amounts are skipped rather than poisoning the total', rollup.total, 50);
}

// --- 5. Money formatting ----------------------------------------------------

check('thousands separated', formatHealthMoney(1250), '$1,250.00');
check('cents kept', formatHealthMoney(60.5), '$60.50');
check('zero', formatHealthMoney(0), '$0.00');
check('negative sits outside the symbol', formatHealthMoney(-40), '-$40.00');

console.log(`${checks - failures}/${checks} checks passed`);
if (failures > 0) {
  console.error(`${failures} FAILED`);
  process.exit(1);
}
