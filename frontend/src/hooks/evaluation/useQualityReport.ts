import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/query/keys";
import { services } from "@/services";

export function useQualityReport() {
  return useQuery({
    queryKey: queryKeys.aiQuality(),
    queryFn: () => services.evaluation.getQualityReport(),
  });
}
