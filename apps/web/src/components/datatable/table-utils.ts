import {
  type SortingState as ReactTableSortingState,
} from "@tanstack/react-table";
import { type SortingState } from "@/types/index";

/**
 * Converts react-table's sorting state to our custom sorting state
 */
export function toCustomSorting(sorting: ReactTableSortingState): SortingState {
  return sorting.map((item) => ({
    id: item.id,
    desc: item.desc,
  }));
}

/**
 * Converts our custom sorting state to react-table's sorting state
 */
export function toReactTableSorting(sorting: SortingState): ReactTableSortingState {
  return sorting.map((item) => ({
    id: item.id,
    desc: item.desc,
  }));
}
