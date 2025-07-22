import "@tanstack/react-table";
import { RowData } from "@tanstack/react-table";
import { locales } from "@/i18n/config";
import messages from "../messages/en.json";

declare module "@tanstack/react-table" {
  // eslint-disable-next-line
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof locales)[number];
    Messages: typeof messages;
  }
}
