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

/**
 * Simulated service latency. Configurable so automated tests can run with zero
 * delay while normal mock usage keeps realistic loading states.
 */
let latencyScale = 1;

export function setMockLatencyScale(scale: number): void {
  latencyScale = Math.max(0, scale);
}

export function disableMockLatency(): void {
  setMockLatencyScale(0);
}

export function delay(ms = 420): Promise<void> {
  const duration = Math.round(ms * latencyScale);
  if (duration <= 0) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export function clone<T>(value: T): T {
  return structuredClone(value);
}
