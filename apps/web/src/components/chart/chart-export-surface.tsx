"use client";

import type { ReactNode, RefObject } from "react";

type ChartExportSurfaceProps = {
  children: ReactNode;
  exportRef: RefObject<HTMLDivElement | null>;
  fileName: string;
  isRendering: boolean;
};

export function ChartExportSurface({ children, exportRef, fileName, isRendering }: ChartExportSurfaceProps) {
  if (!isRendering) {
    return null;
  }

  return (
    <div aria-hidden className="pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-hidden">
      <div className="absolute top-0 left-[-20000px]">
        <div ref={exportRef} data-export-filename={fileName} className="w-[1280px]">
          {children}
        </div>
      </div>
    </div>
  );
}
