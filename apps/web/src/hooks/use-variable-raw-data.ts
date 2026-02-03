import { UseMutationOptions, useMutation } from "@tanstack/react-query";
import { RawDataOptions, RawDataResponse, fetchVariableRawData } from "@/dal/dataset-raw-data";

export function useVariableRawData(
  datasetId: string,
  options?: UseMutationOptions<RawDataResponse, Error, { variableIds: string[]; options?: RawDataOptions }>
) {
  return useMutation<RawDataResponse, Error, { variableIds: string[]; options?: RawDataOptions }>({
    mutationFn: async ({ variableIds, options: rawDataOptions }) => {
      return fetchVariableRawData(datasetId, variableIds, rawDataOptions);
    },
    ...options,
  });
}
