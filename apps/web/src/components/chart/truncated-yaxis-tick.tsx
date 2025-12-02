"use client";

import {
  YAXIS_LABEL_CHAR_WIDTH,
  YAXIS_LABEL_FONT_SIZE,
  YAXIS_LABEL_LINE_HEIGHT,
  YAXIS_LABEL_MAX_LINES,
  YAXIS_LABEL_TICK_MARGIN,
} from "@/lib/chart-constants";

type TruncatedYAxisTickProps = {
  x?: number;
  y?: number;
  payload?: { value: string };
  width?: number; // Width passed by Recharts YAxis (not used, we calculate from x)
  maxLines?: number;
  fontSize?: number;
  tickMargin?: number;
};

/**
 * Breaks a long word into chunks that fit within maxChars, adding hyphens.
 * Returns an array of word parts.
 */
function breakLongWord(word: string, maxChars: number): string[] {
  const parts: string[] = [];
  let remaining = word;

  while (remaining.length > maxChars) {
    // Leave room for hyphen
    const breakPoint = maxChars - 1;
    parts.push(remaining.slice(0, breakPoint) + "-");
    remaining = remaining.slice(breakPoint);
  }

  if (remaining) {
    parts.push(remaining);
  }

  return parts;
}

/**
 * Wraps text into multiple lines, respecting max characters per line and max lines.
 * Handles long words by breaking them with hyphens.
 * Adds ellipsis to the last line if text is truncated.
 */
function wrapText(
  text: string,
  maxCharsPerLine: number,
  maxLines: number
): {
  lines: string[];
  isTruncated: boolean;
} {
  if (!text) {
    return { lines: [], isTruncated: false };
  }

  // Split text into words and break long words into parts
  const words = text.split(/\s+/);
  const wordParts: string[] = [];

  for (const word of words) {
    if (!word) continue;

    if (word.length > maxCharsPerLine) {
      // Break long word into hyphenated parts
      wordParts.push(...breakLongWord(word, maxCharsPerLine));
    } else {
      wordParts.push(word);
    }
  }

  const lines: string[] = [];
  let currentLine = "";
  let partIndex = 0;

  while (partIndex < wordParts.length && lines.length < maxLines) {
    const part = wordParts[partIndex];
    if (!part) {
      partIndex++;
      continue;
    }

    // For hyphenated parts, don't add space before
    const separator = currentLine && !currentLine.endsWith("-") ? " " : "";
    const testLine = currentLine ? `${currentLine}${separator}${part}` : part;

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
      partIndex++;
    } else {
      if (currentLine) {
        // Current line is full, push it and start a new one
        lines.push(currentLine);
        currentLine = "";
      } else {
        // This shouldn't happen since we pre-broke long words, but handle it
        if (lines.length < maxLines - 1) {
          lines.push(part.slice(0, maxCharsPerLine - 1) + "-");
          partIndex++;
        } else {
          // On last line, truncate with ellipsis
          currentLine = part.slice(0, maxCharsPerLine - 1) + "\u2026";
          partIndex++;
        }
      }
    }
  }

  // Add remaining current line if we have space
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // Check if text was truncated (more parts remaining)
  const isTruncated = partIndex < wordParts.length;

  // Add ellipsis to last line if truncated
  if (isTruncated && lines.length > 0) {
    const lastLineIndex = lines.length - 1;
    let lastLine = lines[lastLineIndex] ?? "";

    // Remove trailing hyphen before adding ellipsis
    if (lastLine.endsWith("-")) {
      lastLine = lastLine.slice(0, -1);
    }

    // Only add ellipsis if it doesn't already end with one
    if (!lastLine.endsWith("\u2026")) {
      if (lastLine.length >= maxCharsPerLine - 1) {
        lines[lastLineIndex] = lastLine.slice(0, maxCharsPerLine - 1) + "\u2026";
      } else {
        lines[lastLineIndex] = lastLine + "\u2026";
      }
    }
  }

  return { lines, isTruncated };
}

/**
 * Custom Y-axis tick component that truncates long labels and wraps text to multiple lines.
 * Shows the full text on hover via native SVG <title> element.
 */
export function TruncatedYAxisTick({
  x = 0,
  y = 0,
  payload,
  maxLines = YAXIS_LABEL_MAX_LINES,
  fontSize = YAXIS_LABEL_FONT_SIZE,
  tickMargin = YAXIS_LABEL_TICK_MARGIN,
}: TruncatedYAxisTickProps) {
  const text = payload?.value ?? "";

  // The x position is where the axis line is drawn
  // Text with textAnchor="end" extends LEFT from position (x - tickMargin)
  // So the available width for text is (x - tickMargin) to ensure it doesn't go past x=0
  const availableWidth = x - tickMargin - 5; // 5px safety margin from left edge

  // Calculate max characters per line based on available width and character width
  const charWidth = (fontSize / YAXIS_LABEL_FONT_SIZE) * YAXIS_LABEL_CHAR_WIDTH;
  const maxCharsPerLine = Math.max(10, Math.floor(availableWidth / charWidth)); // Minimum 10 chars

  const { lines, isTruncated } = wrapText(text, maxCharsPerLine, maxLines);

  // Calculate vertical positioning to center the text block
  const lineHeight = fontSize * YAXIS_LABEL_LINE_HEIGHT;
  const totalHeight = lines.length * lineHeight;
  const startY = -totalHeight / 2 + lineHeight / 2;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Show full text on hover when truncated */}
      {isTruncated && <title>{text}</title>}
      <text textAnchor="end" fill="currentColor" fontSize={fontSize} className="fill-muted-foreground">
        {lines.map((line, index) => (
          <tspan key={index} x={-tickMargin} dy={index === 0 ? startY : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}
