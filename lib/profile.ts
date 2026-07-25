// Pure date math, no DB/React dependency -- kept separate so lib/db.ts's
// getUserProfile() (which reads the stored birth_date) and any UI screen
// can both compute "how old is this person today" the same way without
// storing a static age that silently goes stale.
export function ageFromBirthDate(birthDate: string, asOf: Date = new Date()): number {
  const birth = new Date(birthDate);
  let age = asOf.getFullYear() - birth.getFullYear();

  const hasHadBirthdayThisYear =
    asOf.getMonth() > birth.getMonth() ||
    (asOf.getMonth() === birth.getMonth() && asOf.getDate() >= birth.getDate());

  if (!hasHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}
