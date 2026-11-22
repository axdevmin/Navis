import { sanitizeLightRadius, sanitizeLightType } from "./maps";

describe("lumières des tokens", () => {
  it("n'accepte que les types de lumière connus", () => {
    expect(sanitizeLightType("torch")).toBe("torch");
    expect(sanitizeLightType("campfire")).toBe("campfire");
    expect(sanitizeLightType("laser")).toBe(null);
    expect(sanitizeLightType(null)).toBe(null);
    expect(sanitizeLightType(3)).toBe(null);
  });

  it("borne la portée entre une demi-case et 30 cases", () => {
    expect(sanitizeLightRadius(4)).toBe(4);
    expect(sanitizeLightRadius(0)).toBe(0.5);
    expect(sanitizeLightRadius(500)).toBe(30);
    expect(sanitizeLightRadius("4")).toBe(undefined);
    expect(sanitizeLightRadius(Number.NaN)).toBe(undefined);
  });
});
