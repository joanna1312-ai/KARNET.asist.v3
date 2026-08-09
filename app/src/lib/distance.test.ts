import { describe, expect, it } from "vitest";
import { haversineDistanceKm } from "./distance";

describe("haversineDistanceKm", () => {
  it("returns 0 for identical coordinates", () => {
    const point = { lat: 52.2297, lng: 21.0122 };
    expect(haversineDistanceKm(point, point)).toBe(0);
  });

  it("computes the known distance between Warsaw and Kraków (~250 km)", () => {
    const warsaw = { lat: 52.2297, lng: 21.0122 };
    const krakow = { lat: 50.0647, lng: 19.945 };
    const distance = haversineDistanceKm(warsaw, krakow);
    expect(distance).toBeGreaterThan(240);
    expect(distance).toBeLessThan(260);
  });

  it("is symmetric", () => {
    const a = { lat: 52.2297, lng: 21.0122 };
    const b = { lat: 50.0647, lng: 19.945 };
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a), 10);
  });
});
