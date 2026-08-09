import { disableMockLatency } from "@/services/mock/mockStore";

// Automated tests exercise business rules, not loading states, so the mock
// services run with zero simulated latency.
disableMockLatency();
