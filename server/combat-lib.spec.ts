import { assignInitiative } from "./combat-lib";

test("assigns a value between 1 and 20 to every participant", () => {
  const participants = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const result = assignInitiative(participants, Math.random);
  expect(result).toHaveLength(3);
  result.forEach((participant) => {
    expect(participant.initiative).toBeGreaterThanOrEqual(1);
    expect(participant.initiative).toBeLessThanOrEqual(20);
  });
});

test("sorts participants by initiative descending", () => {
  const participants = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const rolls = [5, 18, 12];
  let call = 0;
  const random = () => {
    // maps rolls[call] back through the (0..1) -> 1..20 formula
    const value = (rolls[call] - 1) / 20;
    call++;
    return value;
  };
  const result = assignInitiative(participants, random);
  expect(result.map((p) => p.id)).toEqual(["b", "c", "a"]);
  expect(result.map((p) => p.initiative)).toEqual([18, 12, 5]);
});

test("re-rolls only the tied participants until values are unique", () => {
  const participants = [{ id: "a" }, { id: "b" }, { id: "c" }];
  // first roll: 10, 10, 3 (a and b tied) -> reroll a and b: 7, 15
  const sequence = [10, 10, 3, 7, 15];
  let call = 0;
  const random = () => {
    const value = (sequence[call] - 1) / 20;
    call++;
    return value;
  };
  const result = assignInitiative(participants, random);
  const values = result.map((p) => p.initiative);
  expect(new Set(values).size).toBe(3);
  expect(result.map((p) => p.id)).toEqual(["b", "a", "c"]);
});
