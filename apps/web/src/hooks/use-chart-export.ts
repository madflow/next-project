// useChartExport.ts
import html2canvas from "html2canvas-pro";
import { useRef } from "react";

export function useChartExport() {
  const ref = useRef<HTMLDivElement>(null);

  const exportPNG = async () => {
    if (!ref.current) return;

    const scale = 2;
    const filename = ref.current.dataset.exportFilename ?? "chart.png";

    const canvas = await html2canvas(ref.current, {
      backgroundColor: "#ffffff", // white background
      useCORS: true,
      scale, // increase for sharper output (e.g. 2 or 3)
    });

    console.log(filename);

    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return { ref, exportPNG };
}
