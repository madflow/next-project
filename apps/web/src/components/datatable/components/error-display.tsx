import { useTranslations } from "next-intl";

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
  const t = useTranslations();
  return (
    <div className="flex h-24 w-full flex-col items-center justify-center">
      <span className="mb-2 text-red-600" role="alert">
        {message}
      </span>
      <button
        className="rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
        onClick={onRetry}
        type="button">
        {t("datatable.retry")}
      </button>
    </div>
  );
}
