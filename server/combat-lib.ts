const MAX_REROLL_ATTEMPTS = 20;

const rollD20 = (random: () => number) => Math.floor(random() * 20) + 1;

/**
 * Rolls initiative (1-20) for every participant. Only participants that tie
 * are re-rolled together, repeatedly, until every value is unique (or until
 * MAX_REROLL_ATTEMPTS is reached, which only matters with >20 participants
 * since a d20 can't produce more than 20 distinct values).
 */
export const assignInitiative = <T>(
  participants: Array<T>,
  random: () => number = Math.random
): Array<T & { initiative: number }> => {
  let rolls = participants.map(() => rollD20(random));

  for (let attempt = 0; attempt < MAX_REROLL_ATTEMPTS; attempt++) {
    const counts = new Map<number, number>();
    rolls.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
    const hasTies = Array.from(counts.values()).some((count) => count > 1);
    if (!hasTies) break;
    rolls = rolls.map((value) =>
      (counts.get(value) ?? 0) > 1 ? rollD20(random) : value
    );
  }

  return participants
    .map((participant, index) => ({ ...participant, initiative: rolls[index] }))
    .sort((a, b) => b.initiative - a.initiative);
};
