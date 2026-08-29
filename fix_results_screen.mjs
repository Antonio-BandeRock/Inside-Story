import fs from 'fs';

const p = 'app/assessment.tsx';
let s = fs.readFileSync(p, 'utf8');

const oldBlock = `      <ResultCard
        title={hypoDomain?.displayName ?? 'Hypothyroid Symptoms'}
        primaryText={\`\${Math.round(scores.hypothyroidSymptoms.percentScore)}% symptom burden\`}
        secondaryText={\`\${scores.hypothyroidSymptoms.itemsAnswered} of 13 items answered\`}
        delta={hypoDelta}
        framingNote={hypoDomain?.framingNote}
      />

      <ResultCard
        title={ibsDomain?.displayName ?? 'Digestive / IBS Symptoms'}
        primaryText={\`\${bandLabel(scores.digestiveSymptoms.band)} (\${Math.round(scores.digestiveSymptoms.rawScore)} / 500)\`}
        secondaryText={null}
        delta={ibsDelta}
        framingNote={ibsDomain?.framingNote}
      />

      <ResultCard
        title={wellbeingDomain?.displayName ?? 'Overall Wellbeing'}
        primaryText={\`\${Math.round(scores.wellbeing.percentScore)}% wellbeing\`}
        secondaryText={\`\${scores.wellbeing.itemsAnswered} of 5 items answered\`}
        delta={wellbeingDelta}
        framingNote={wellbeingDomain?.framingNote}
      />`;

const newBlock = `      {/* 2026-08-29: only report on the domains this person was actually
          asked about. These cards used to render unconditionally, so
          someone tracking Prostate Health got a hypothyroid burden score
          and an IBS severity band from questions they were never shown,
          both computed entirely from unanswered items. Each card is now
          gated on its own domain being present in the scoped set. */}
      {hypoDomain ? (
        <ResultCard
          title={hypoDomain.displayName}
          primaryText={\`\${Math.round(scores.hypothyroidSymptoms.percentScore)}% symptom burden\`}
          secondaryText={\`\${scores.hypothyroidSymptoms.itemsAnswered} of 13 items answered\`}
          delta={hypoDelta}
          framingNote={hypoDomain.framingNote}
        />
      ) : null}

      {ibsDomain ? (
        <ResultCard
          title={ibsDomain.displayName}
          primaryText={\`\${bandLabel(scores.digestiveSymptoms.band)} (\${Math.round(scores.digestiveSymptoms.rawScore)} / 500)\`}
          secondaryText={null}
          delta={ibsDelta}
          framingNote={ibsDomain.framingNote}
        />
      ) : null}

      {prostateDomain ? (
        <ResultCard
          title={prostateDomain.displayName}
          primaryText={\`\${prostateBandLabel(scores.prostateUrinary.band)} (\${scores.prostateUrinary.rawScore} / 35)\`}
          secondaryText={\`\${scores.prostateUrinary.itemsAnswered} of 7 items answered\`}
          delta={prostateDelta}
          framingNote={prostateDomain.framingNote}
        />
      ) : null}

      {wellbeingDomain ? (
        <ResultCard
          title={wellbeingDomain.displayName}
          primaryText={\`\${Math.round(scores.wellbeing.percentScore)}% wellbeing\`}
          secondaryText={\`\${scores.wellbeing.itemsAnswered} of 5 items answered\`}
          delta={wellbeingDelta}
          framingNote={wellbeingDomain.framingNote}
        />
      ) : null}`;

if (!s.includes(oldBlock)) { console.error('results block not matched'); process.exit(1); }
s = s.replace(oldBlock, newBlock);

s = s.replace(
  "  const wellbeingDomain = domains.find((d) => d.code === 'wellbeing');",
  "  const wellbeingDomain = domains.find((d) => d.code === 'wellbeing');\n  const prostateDomain = domains.find((d) => d.code === 'prostate_urinary');",
);
s = s.replace(
  "  const wellbeingDelta = comparison ? deltaLabel(comparison.wellbeingDeltaPercent, true, '%') : null;",
  "  const wellbeingDelta = comparison ? deltaLabel(comparison.wellbeingDeltaPercent, true, '%') : null;\n  const prostateDelta = comparison ? deltaLabel(comparison.prostateUrinaryDeltaRaw, false, ' pts') : null;",
);

// IPSS band wording, separate from the IBS-SSS one (different vocabulary).
s = s.replace(
  "function bandLabel(band: 'remission' | 'mild' | 'moderate' | 'severe'): string {",
  [
    "// The IPSS bands use their own three-level vocabulary, deliberately not",
    "// folded into bandLabel below, whose 'remission' level has no IPSS",
    '// equivalent and would read wrong here.',
    "function prostateBandLabel(band: 'mild' | 'moderate' | 'severe'): string {",
    '  switch (band) {',
    "    case 'mild':",
    "      return 'Mild';",
    "    case 'moderate':",
    "      return 'Moderate';",
    '    default:',
    "      return 'Severe';",
    '  }',
    '}',
    '',
    "function bandLabel(band: 'remission' | 'mild' | 'moderate' | 'severe'): string {",
  ].join('\n'),
);

fs.writeFileSync(p, s);
console.log('results screen scoped + prostate card added');
