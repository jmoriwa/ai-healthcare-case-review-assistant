import type { AuthSession, Reviewer } from "@/domain/models";

export interface AuthService {
  login(input: { email: string; password: string }): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentReviewer(): Promise<Reviewer | null>;
}
