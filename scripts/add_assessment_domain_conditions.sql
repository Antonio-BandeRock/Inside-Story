-- Scope the periodic check-in to the conditions a person actually tracks,
-- and give Prostate Health a check-in of its own.
--
-- 2026-08-29, direct report: "I have Prostate Health listed as my
-- condition. I was curious why the check-in is available to me and what it
-- might have on it for my condition. It is all related to IBS... I think
-- prostate health should still have a check in but for things the user
-- should be checking in for. Some IBS symptoms might match, but not all,
-- and they shouldn't reference IBS if I haven't selected IBS as one of
-- their conditions."
--
-- Confirmed by reading the code rather than assumed: assessment_domains
-- and assessment_items were never condition-scoped at all.
-- getAssessmentItems() returns every item to everyone, so someone tracking
-- only Prostate Health was asked five IBS questions and thirteen
-- hypothyroid ones, and nothing at all about their own condition.
--
-- Two changes:
--   1. assessment_domain_conditions. A domain with NO rows is universal
--      and shows for everyone (Overall Wellbeing is the only one: WHO-5 is
--      a general wellbeing instrument, not condition-specific). A domain
--      WITH rows only shows if the person tracks one of them.
--   2. A prostate_urinary domain built on the IPSS (International Prostate
--      Symptom Score), the standard validated instrument for exactly this.
--
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS assessment_domain_conditions (
    domain_code TEXT NOT NULL,
    condition_code TEXT NOT NULL,
    PRIMARY KEY (domain_code, condition_code)
);

INSERT OR REPLACE INTO assessment_domains
  (code, display_name, description, scoring_method, framing_note, citation)
VALUES (
  'prostate_urinary',
  'Urinary Symptoms',
  'The seven-question International Prostate Symptom Score (IPSS), the standard validated measure of lower urinary tract symptoms. Tracking it over time is what shows whether things are steady, easing, or worth raising with a doctor.',
  'Each of 7 items is rated 0 to 5 and summed for a 0-35 total. Published bands: 0-7 = mild, 8-19 = moderate, 20-35 = severe.',
  'Retaking this every few months turns a vague sense of "about the same" into a number you and your doctor can actually compare. A rising score is worth a conversation; a steady or falling one is worth knowing too.',
  'Barry MJ et al. The American Urological Association symptom index for benign prostatic hyperplasia. J Urol. 1992;148(5):1549-57. PMID 1279218.'
);

INSERT OR REPLACE INTO assessment_items (code, domain_code, prompt, response_type, sort_order) VALUES
  ('prostate_incomplete_emptying', 'prostate_urinary', 'Over the past month, how often have you had a sensation of not emptying your bladder completely after you finish urinating?', 'ipss_0_5', 1),
  ('prostate_frequency',           'prostate_urinary', 'Over the past month, how often have you had to urinate again less than two hours after you finished urinating?',              'ipss_0_5', 2),
  ('prostate_intermittency',       'prostate_urinary', 'Over the past month, how often have you found you stopped and started again several times when you urinated?',                 'ipss_0_5', 3),
  ('prostate_urgency',             'prostate_urinary', 'Over the past month, how difficult have you found it to postpone urination?',                                                  'ipss_0_5', 4),
  ('prostate_weak_stream',         'prostate_urinary', 'Over the past month, how often have you had a weak urinary stream?',                                                           'ipss_0_5', 5),
  ('prostate_straining',           'prostate_urinary', 'Over the past month, how often have you had to push or strain to begin urinating?',                                            'ipss_0_5', 6),
  ('prostate_nocturia',            'prostate_urinary', 'Over the past month, how many times did you most typically get up to urinate from the time you went to bed until you got up in the morning?', 'ipss_0_5', 7);

-- digestive_ibs maps beyond IBS itself on purpose: the IBS-SSS items
-- (abdominal pain, bloating, bowel-habit satisfaction) are the same things
-- IBD and celiac patients are asked to track, and both conditions already
-- carry that symptom research in this app's own Digest.
INSERT OR IGNORE INTO assessment_domain_conditions (domain_code, condition_code) VALUES
  ('digestive_ibs', 'ibs'),
  ('digestive_ibs', 'ibd'),
  ('digestive_ibs', 'celiac'),
  ('hypothyroid_symptoms', 'hashimotos'),
  ('prostate_urinary', 'prostate_health');
