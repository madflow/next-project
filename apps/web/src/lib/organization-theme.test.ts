import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { organizationSettingsSchema } from "@/types/organization";
import { isValidThemeColor, sanitizeThemeChartColors } from "./organization-theme";

describe("organization theme validation", () => {
  test("accepts 6-digit hex chart colors", () => {
    const result = organizationSettingsSchema.parse({
      themes: [
        {
          name: "safe-theme",
          chartColors: {
            "chart-1": "#3B82F6",
            "chart-2": "#ef4444",
            "chart-dichotome-1": "#10B981",
          },
        },
      ],
    });

    assert.deepStrictEqual(result?.themes?.[0]?.chartColors, {
      "chart-1": "#3b82f6",
      "chart-2": "#ef4444",
      "chart-dichotome-1": "#10b981",
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
        "chart-dichotome-2": "#EF4444",
      }),
      {
        "chart-1": "#3b82f6",
        "chart-dichotome-2": "#ef4444",
      }
    );
  });

  test("client helper matches server validation rules", () => {
    assert.strictEqual(isValidThemeColor("#3b82f6"), true);
    assert.strictEqual(isValidThemeColor("#abc"), false);
    assert.strictEqual(isValidThemeColor("red"), false);
  });
});
