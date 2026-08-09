import { UnauthorizedError } from "@/domain/errors";
import type { AuthSession, DemoCredential, Reviewer } from "@/domain/models";
import type { AuthService } from "@/services/contracts/AuthService";
import { DEMO_CREDENTIALS } from "@/mocks/fixtures/reviewers";
import { clone, delay, mockStore } from "./mockStore";

export class MockAuthService implements AuthService {
  async login(input: { email: string; password: string }): Promise<AuthSession> {
    await delay(520);
    const reviewer = mockStore.findReviewerByCredentials(input.email, input.password);
    if (!reviewer) {
      throw new UnauthorizedError("Email or password is incorrect.");
    }
    const session: AuthSession = { reviewer: clone(reviewer), token: `mock-token-${reviewer.id}` };
    mockStore.setSession(session);
    return clone(session);
  }

  async logout(): Promise<void> {
    await delay(160);
    mockStore.setSession(null);
  }

  async getCurrentReviewer(): Promise<Reviewer | null> {
    await delay(120);
    const session = mockStore.getSession();
    return session ? clone(session.reviewer) : null;
  }

  async listDemoCredentials(): Promise<DemoCredential[]> {
    await delay(80);
    return clone(DEMO_CREDENTIALS);
  }
}
