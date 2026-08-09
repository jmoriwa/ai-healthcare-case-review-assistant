import type { AuthSession, DemoCredential, Reviewer } from "@/domain/models";

export interface AuthService {
  login(input: { email: string; password: string }): Promise<AuthSession>;
  logout(): Promise<void>;
  getCurrentReviewer(): Promise<Reviewer | null>;
  /**
   * Sign-in hints for the demo environment. A real implementation returns an
   * empty list; the UI never reaches into fixtures for this.
   */
  listDemoCredentials(): Promise<DemoCredential[]>;
}
