import type { AuthSession, Reviewer } from "@/domain/models";
import { buildInitialState, type MockState } from "@/mocks/fixtures/buildInitialState";
import { DEMO_CREDENTIALS } from "@/mocks/fixtures/reviewers";

/**
 * Single in-memory store cloned from immutable fixtures on first access.
 * State intentionally does not survive a page refresh in the mock phase.
 */
class MockStore {
  private state: MockState | null = null;
  private session: AuthSession | null = null;

  getState(): MockState {
    if (!this.state) {
      this.state = buildInitialState();
    }
    return this.state;
  }

  reset(): void {
    this.state = buildInitialState();
    this.session = null;
  }

  getSession(): AuthSession | null {
    return this.session;
  }

  setSession(session: AuthSession | null): void {
    this.session = session;
  }

  findReviewerByCredentials(email: string, password: string): Reviewer | null {
    const normalized = email.trim().toLowerCase();
    const credential = DEMO_CREDENTIALS.find(
      (item) => item.email === normalized && item.password === password,
    );
    if (!credential) return null;
    return this.getState().reviewers.find((r) => r.email === credential.email) ?? null;
  }
}

export const mockStore = new MockStore();

/** Simulated service latency so loading states are exercised realistically. */
export function delay(ms = 420): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}
