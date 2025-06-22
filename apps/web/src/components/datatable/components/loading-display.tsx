import { useTranslations } from "next-intl";

export function LoadingDisplay() {
  const t = useTranslations();
  return (
    <div className="flex h-24 w-full flex-col items-center justify-center text-gray-400">
      <svg
        className="mb-2 h-6 w-6 animate-spin text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      <span>{t("datatable.loading")}</span>
    </div>
  );
}
