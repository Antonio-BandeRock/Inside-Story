// Things worth asking your employer about, and deliberately nothing more.
//
// Built 2026-09-05. Direct request, after a conversation about what a person's
// work offers them beyond the paycheck.
//
// WHY THIS IS A LIST OF QUESTIONS RATHER THAN A LIST OF ENTITLEMENTS.
//
// Almost everything in this area is jurisdiction-specific. Protected medical
// leave, pre-tax health accounts, retirement matching and preventive-care
// coverage all work differently, or do not exist, depending on the country and
// often the individual plan. An app that told someone what they are entitled
// to would be wrong for most of the people it reached.
//
// This is the correction from earlier the same day, taken as a general rule
// rather than a one-off fix: a tax explanation for donated produce shipped in
// 1.0.34.23 and was removed hours later, because it was United States law in
// an app whose reference data spans seven countries and whose owner does not
// live there.
//
// So NOTHING here names a country, a statute, a programme or a scheme. Every
// entry is phrased as a question to put to whoever runs the benefits, and the
// app records only what the person comes back and tells it. The knowledge
// stays general; the tracking gets specific.
//
// The second rule, which is why several obvious items are phrased oddly: no
// entry may imply the thing exists. "Ask whether there is" rather than "your
// allowance for", because for a great many people there is not.

export type WorkPromptGroup = {
  code: string;
  label: string;
  /** Why this group is worth a conversation at all. */
  why: string;
  prompts: { ask: string; note?: string }[];
};

export const WORK_PROMPT_GROUPS: WorkPromptGroup[] = [
  {
    code: 'health_cover',
    label: 'Health cover, beyond the obvious',
    why: 'The parts of a health plan people pay for and never use, usually because nobody said they were there.',
    prompts: [
      {
        ask: 'Is there a confidential counselling or assistance programme, and how many sessions does it cover?',
        note: 'Often a handful of free sessions a year, frequently including legal and money advice, and among the least claimed things any employer offers. Resets, so unused sessions are usually gone.',
      },
      {
        ask: 'Which preventive appointments and screenings are covered in full rather than against my deductible?',
        note: 'Worth knowing before booking, since the same appointment can cost nothing or a lot depending on how it is coded.',
      },
      {
        ask: 'Is there a dental plan, and does it have a yearly maximum?',
        note: 'A yearly maximum resets and does not carry over, so work planned across two years can cost less than the same work done in one.',
      },
      {
        ask: 'Is there a vision plan, and how often does it cover frames or lenses?',
      },
      {
        ask: 'Does the health plan offer case management or a nurse line for an ongoing condition?',
        note: 'Someone whose job is to coordinate care for one person. Rarely advertised, and has to be asked for.',
      },
      {
        ask: 'Is a second opinion service included, and does it cost anything?',
      },
      {
        ask: 'Is there a cheaper way to fill a long-term prescription, such as a longer supply at once?',
      },
    ],
  },
  {
    code: 'health_money',
    label: 'Health money set aside before tax',
    why: 'Accounts and stipends that only exist if someone enrols, and several of which expire.',
    prompts: [
      {
        ask: 'Is there a pre-tax health account I can pay into, and does the employer add anything?',
        note: 'If money is added on your behalf, not enrolling declines it. Once you know the amounts, the Health section of Finances can track what you have met.',
      },
      {
        ask: 'If there is such an account, does the balance carry over or is it forfeited, and on what date?',
        note: 'This is the difference that costs money. Finances already warns before a forfeited balance runs out, once it knows the deadline.',
      },
      {
        ask: 'Is there a wellness or fitness allowance, and what does it cover?',
        note: 'Usually resets yearly and usually goes unclaimed.',
      },
    ],
  },
  {
    code: 'time',
    label: 'Time, and what protects it',
    why: 'The part that matters most with a condition that comes and goes, and the part people know least about.',
    prompts: [
      {
        ask: 'How much paid leave do I have, and does any of it expire rather than carry over?',
      },
      {
        ask: 'Is sick leave counted separately from holiday, or does it come out of the same pot?',
      },
      {
        ask: 'What protected leave exists for a health condition, and can it be taken in short stretches rather than all at once?',
        note: 'The short-stretch version is the one that fits a condition that flares. Whether it exists, and what it is called, depends entirely on where you are.',
      },
      {
        ask: 'What adjustments can be made to how or when I work, on health grounds?',
        note: 'Hours, breaks, working from home, a different schedule. Usually a conversation rather than a form.',
      },
      {
        ask: 'Is there cover for income if I could not work for a while, and does it start immediately?',
      },
      {
        ask: 'Is there paid time off for volunteering?',
        note: 'If there is, it almost always resets yearly.',
      },
      {
        ask: 'Is there leave for caring for someone else, separate from my own?',
      },
    ],
  },
  {
    code: 'money',
    label: 'Money on the table',
    why: 'Where not acting is the same as declining money, which is a different thing from an unclaimed perk.',
    prompts: [
      {
        ask: 'Does the employer add to a retirement or pension account based on what I put in, and up to what point?',
        note: 'The one to ask first. Paying in less than the point where matching stops means turning down money for no reason. Record both figures and this section will say what you are declining.',
      },
      {
        ask: 'Is there a share purchase scheme, and is it at a discount?',
      },
      {
        ask: 'Is there a budget for training, courses or qualifications?',
        note: 'Usually yearly, usually resets, and usually unspent.',
      },
      {
        ask: 'Is there help with study or student debt?',
      },
      {
        ask: 'Can travel to work, or childcare, be paid for out of pre-tax pay?',
      },
      {
        ask: 'Is any life or accident cover provided at no cost, and is it registered to the right person?',
        note: 'Often provided by default and often pointing at whoever was named years ago.',
      },
    ],
  },
  {
    code: 'food',
    label: 'Food',
    why: 'The one this app is unusually placed to make use of, since it already knows what you eat and what you grow.',
    prompts: [
      {
        ask: 'Is any part of a meal at work paid for or subsidised?',
      },
      {
        ask: 'Does the employer sponsor a produce box, farm share or market voucher?',
        note: 'Where it exists, what arrives can go straight into your kitchen inventory the same way a harvest does.',
      },
      {
        ask: 'Is there a fridge, a microwave and somewhere to eat what I brought?',
        note: 'Sounds minor until an elimination diet means every meal has to travel with you.',
      },
    ],
  },
];

export const WORK_PROMPT_COUNT = WORK_PROMPT_GROUPS.reduce(
  (total, group) => total + group.prompts.length,
  0,
);

export function workPromptGroup(code: string): WorkPromptGroup | undefined {
  return WORK_PROMPT_GROUPS.find((group) => group.code === code);
}
