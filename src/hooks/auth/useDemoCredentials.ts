import { useQuery } from "@tanstack/react-query";
import { services } from "@/services";

/** Demo sign-in hints, sourced from the auth service rather than mock fixtures. */
export function useDemoCredentials() {
  return useQuery({
    queryKey: ["auth", "demo-credentials"] as const,
    queryFn: () => services.auth.listDemoCredentials(),
    staleTime: Infinity,
  });
}
