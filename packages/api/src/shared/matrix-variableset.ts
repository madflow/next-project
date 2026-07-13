type ValueLabel = readonly [code: string, label: string];

function compareResponseCodes([left]: ValueLabel, [right]: ValueLabel) {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  const leftIsNumeric = left.trim() !== "" && Number.isFinite(leftNumber);
  const rightIsNumeric = right.trim() !== "" && Number.isFinite(rightNumber);

  if (leftIsNumeric && rightIsNumeric && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  if (leftIsNumeric !== rightIsNumeric) {
    return leftIsNumeric ? -1 : 1;
  }

  return left.localeCompare(right, "en", { numeric: true }) || left.localeCompare(right, "en");
}

function normalizeValueLabels(valueLabels: unknown): ValueLabel[] | null {
  if (valueLabels === null || typeof valueLabels !== "object" || Array.isArray(valueLabels)) {
    return null;
  }

  const entries = Object.entries(valueLabels);

  if (entries.length < 2 || entries.some((entry) => typeof entry[1] !== "string")) {
    return null;
  }

  return (entries as ValueLabel[]).sort(compareResponseCodes);
}

export function getMatrixValueLabelsError(valueLabelsByVariable: readonly unknown[]): string | null {
  if (valueLabelsByVariable.length === 0) {
    return null;
  }

  const canonical = normalizeValueLabels(valueLabelsByVariable[0]);

  if (!canonical) {
    return "Each matrix variable must have at least two value labels with string labels";
  }

  const canonicalCodes = canonical.map(([code]) => code);

  for (const valueLabels of valueLabelsByVariable.slice(1)) {
    const candidate = normalizeValueLabels(valueLabels);

    if (!candidate) {
      return "Each matrix variable must have at least two value labels with string labels";
    }

    const candidateCodes = candidate.map(([code]) => code);

    if (
      candidateCodes.length !== canonicalCodes.length ||
      candidateCodes.some((code, index) => code !== canonicalCodes[index])
    ) {
      return `Matrix response codes must match: expected [${canonicalCodes.join(", ")}], received [${candidateCodes.join(", ")}]`;
    }

    for (let index = 0; index < canonical.length; index += 1) {
      const [code, expectedLabel] = canonical[index]!;
      const receivedLabel = candidate[index]![1];

      if (receivedLabel !== expectedLabel) {
        return `Matrix response label for code "${code}" must match: expected "${expectedLabel}", received "${receivedLabel}"`;
      }
    }
  }

  return null;
}
