import { describe, expect, it } from "vitest";
import {
  lonLatToWebMercatorMeters,
  webMercatorMetersToLonLat,
} from "@/domain/geo/web-mercator";

describe("web-mercator", () => {
  it("projeta (0,0) para próximo de (0,0) em metros", () => {
    const projected = lonLatToWebMercatorMeters(0, 0);

    expect(Math.abs(projected.x)).toBeLessThan(1e-9);
    expect(Math.abs(projected.y)).toBeLessThan(1e-9);
  });

  it("inverte a projeção para próximo do valor original", () => {
    const source = {
      lon: -46.6333,
      lat: -23.5505,
    };

    const projected = lonLatToWebMercatorMeters(source.lon, source.lat);
    const restored = webMercatorMetersToLonLat(projected.x, projected.y);

    expect(Math.abs(restored.lon - source.lon)).toBeLessThan(1e-6);
    expect(Math.abs(restored.lat - source.lat)).toBeLessThan(1e-6);
  });
});
