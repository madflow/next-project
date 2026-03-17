import html2canvas from "html2canvas-pro";
import { useCallback, useRef, useState } from "react";
import { buildImageFileName } from "@/lib/adhoc-export";

async function waitForExportSurface() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, 50);
      });
    });
  });
}

export function useChartExport() {
  const displayRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExportRendering, setIsExportRendering] = useState(false);

  const exportPNG = useCallback(async () => {
    setIsExportRendering(true);

    try {
      await waitForExportSurface();

      const target = exportRef.current ?? displayRef.current;
      if (!target) {
        return;
      }

      const scale = 2;
      const baseFilename = target.dataset.exportFilename ?? "chart";
      const filename = buildImageFileName(baseFilename);

      const canvas = await html2canvas(target, {
        backgroundColor: "#ffffff",
        useCORS: true,
        scale,
      });

      const link = document.createElement("a");
      link.download = filename;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Failed to export chart image", error);
    } finally {
      setIsExportRendering(false);
    }
  }, []);

  return { displayRef, exportRef, isExportRendering, exportPNG };
}
