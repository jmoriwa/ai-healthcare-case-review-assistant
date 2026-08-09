import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/common/Button";
import { Field, TextInput } from "@/components/common/Field";
import { InlineError, errorMessage } from "@/components/common/Feedback";
import { useAuth } from "@/hooks/auth/useAuth";
import { useDemoCredentials } from "@/hooks/auth/useDemoCredentials";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — Case Review Assistant" },
      {
        name: "description",
        content:
          "Sign in to the Healthcare Case Review Assistant to review AI-assisted prior authorization cases.",
      },
      { property: "og:title", content: "Sign In — Case Review Assistant" },
      {
        property: "og:description",
        content: "Reviewer sign in for the Healthcare Case Review Assistant demo environment.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, isAuthenticated } = useAuth();
  const router = useRouter();
  const demoCredentials = useDemoCredentials();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      void router.navigate({ to: "/queue", replace: true });
    }
  }, [isAuthenticated, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn({ email: email.trim(), password });
      await router.navigate({ to: "/queue", replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div className="space-y-1.5 text-center">
          <h1 className="text-page-title">Healthcare Case Review Assistant</h1>
          <p className="text-sm text-muted-foreground">
            Reviewer sign in. This environment uses synthetic patients and synthetic medical
            policies for demonstration only.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-card p-5"
          noValidate
        >
          <Field label="Email" htmlFor="login-email">
            <TextInput
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Password" htmlFor="login-password">
            <TextInput
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </Field>

          {error ? <InlineError title="Sign in failed" message={error} /> : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <div className="rounded-lg border border-border bg-neutral-surface p-4">
          <h2 className="text-xs font-semibold text-foreground">Demo accounts</h2>
          <ul className="mt-2 space-y-1.5">
            {(demoCredentials.data ?? []).map((credential) => (
              <li key={credential.email} className="flex items-center justify-between gap-3">
                <span className="text-meta">
                  {credential.displayName} · {credential.email}
                </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setEmail(credential.email);
                    setPassword(credential.password);
                  }}
                >
                  Use
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
