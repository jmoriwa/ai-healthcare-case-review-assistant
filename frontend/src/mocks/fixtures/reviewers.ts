import type { Reviewer } from "@/domain/models";

export interface DemoCredential {
  email: string;
  password: string;
  displayName: string;
}

export const REVIEWER_FIXTURES: Reviewer[] = [
  {
    id: "rvw-avery",
    email: "avery.reviewer@example.test",
    displayName: "Avery Johnson",
    isActive: true,
  },
  {
    id: "rvw-morgan",
    email: "morgan.reviewer@example.test",
    displayName: "Morgan Lee",
    isActive: true,
  },
  {
    id: "rvw-jordan",
    email: "jordan.reviewer@example.test",
    displayName: "Jordan Patel",
    isActive: true,
  },
];

/** Mock-only demo passwords. Never reuse these as real credentials. */
export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    email: "avery.reviewer@example.test",
    password: "demo-review-1",
    displayName: "Avery Johnson",
  },
  {
    email: "morgan.reviewer@example.test",
    password: "demo-review-2",
    displayName: "Morgan Lee",
  },
  {
    email: "jordan.reviewer@example.test",
    password: "demo-review-3",
    displayName: "Jordan Patel",
  },
];
