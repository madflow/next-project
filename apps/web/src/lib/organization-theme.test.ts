import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { organizationSettingsSchema } from "@/types/organization";
import {
  isValidThemeColor,
  resolveSingleSeriesThemeChartColors,
  resolveThemePaletteForCount,
  sanitizeThemeChartColorPalettes,
  sanitizeThemeChartColors,
} from "./organization-theme";

describe("organization theme validation", () => {
  test("accepts 6-digit hex chart colors", () => {
    const result = organizationSettingsSchema.parse({
      themes: [
        {
          name: "safe-theme",
          chartColors: {
            "chart-1": "#3B82F6",
            "chart-2": "#ef4444",
          },
          chartColorPalettes: {
            "1": {
              "chart-1": "#ABCDEF",
            },
            "3": {
              "chart-1": "#112233",
              "chart-2": "#445566",
              "chart-3": "#778899",
            },
          },
        },
      ],
    });

    assert.deepStrictEqual(result?.themes?.[0]?.chartColors, {
      "chart-1": "#3b82f6",
      "chart-2": "#ef4444",
    });
    assert.deepStrictEqual(result?.themes?.[0]?.chartColorPalettes, {
      "1": {
        "chart-1": "#abcdef",
      },
      "3": {
        "chart-1": "#112233",
        "chart-2": "#445566",
        "chart-3": "#778899",
      },
    });
  });

  test("rejects non-hex chart colors on the server schema", () => {
    assert.throws(() =>
      organizationSettingsSchema.parse({
        themes: [
          {
            name: "unsafe-theme",
            chartColors: {
              "chart-1": "red;}</style><script>alert(1)</script><style>",
            },
          },
        ],
      })
    );
  });

  test("sanitizes persisted colors before rendering dynamic CSS", () => {
    assert.deepStrictEqual(
      sanitizeThemeChartColors({
        "chart-1": "#3B82F6",
        "chart-2": "red;}</style><script>alert(1)</script><style>",
      }),
      {
        "chart-1": "#3b82f6",
      }
    );
  });

  test("sanitizes persisted count palettes before rendering dynamic CSS", () => {
    assert.deepStrictEqual(
      sanitizeThemeChartColorPalettes({
        "1": {
          "chart-1": "#ABCDEF",
        },
        "2": {
          "chart-1": "#123456",
          "chart-2": "red;}</style><script>alert(1)</script><style>",
        },
      }),
      {
        "1": {
          "chart-1": "#abcdef",
        },
      }
    );
  });

  test("resolveThemePaletteForCount falls back to base chart colors", () => {
    assert.deepStrictEqual(
      resolveThemePaletteForCount(
        {
          chartColors: {
            "chart-1": "#111111",
            "chart-2": "#222222",
            "chart-3": "#333333",
          },
        },
        3
      ),
      {
        "chart-1": "#111111",
        "chart-2": "#222222",
        "chart-3": "#333333",
      }
    );
  });

  test("resolveThemePaletteForCount merges explicit count palette with base colors", () => {
    assert.deepStrictEqual(
      resolveThemePaletteForCount(
        {
          chartColors: {
            "chart-1": "#111111",
            "chart-2": "#222222",
            "chart-3": "#333333",
          },
          chartColorPalettes: {
            "3": {
              "chart-1": "#aaaaaa",
              "chart-3": "#cccccc",
            },
          },
        },
        3
      ),
      {
        "chart-1": "#aaaaaa",
        "chart-2": "#222222",
        "chart-3": "#cccccc",
      }
    );
  });

  test("resolveSingleSeriesThemeChartColors repeats the single-series color across all chart slots", () => {
    assert.deepStrictEqual(
      resolveSingleSeriesThemeChartColors({
        chartColors: {
          "chart-1": "#111111",
          "chart-2": "#222222",
        },
        chartColorPalettes: {
          "1": {
            "chart-1": "#abcdef",
          },
        },
      }),
      {
        "chart-1": "#abcdef",
        "chart-2": "#abcdef",
        "chart-3": "#abcdef",
        "chart-4": "#abcdef",
        "chart-5": "#abcdef",
        "chart-6": "#abcdef",
      }
    );
  });

  test("client helper matches server validation rules", () => {
    assert.strictEqual(isValidThemeColor("#3b82f6"), true);
    assert.strictEqual(isValidThemeColor("#abc"), false);
    assert.strictEqual(isValidThemeColor("red"), false);
  });
});
