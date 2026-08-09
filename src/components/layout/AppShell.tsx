import { Link, useRouter } from "@tanstack/react-router";
import { BarChart3, ClipboardList, FolderOpen, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/auth/useAuth";

const NAV_ITEMS = [
  { to: "/queue", label: "Case Queue", icon: ClipboardList },
  { to: "/my-cases", label: "My Cases", icon: FolderOpen },
  { to: "/ai-quality", label: "AI Quality", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { reviewer, signOut } = useAuth();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    await router.navigate({ to: "/login" });
  }

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:text-foreground"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-30 border-b border-border bg-surface">
        <div className="flex h-14 items-center justify-between gap-6 px-5">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Healthcare Case Review Assistant
            </span>
            <span className="hidden text-meta md:inline">Utilization Management Review</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-meta">{reviewer?.displayName}</span>
            <Button variant="secondary" size="sm" onClick={handleSignOut}>
              <LogOut aria-hidden />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100dvh-3.5rem)]">
        <nav aria-label="Primary" className="hidden w-56 shrink-0 border-r border-border bg-surface md:block">
          <ul className="sticky top-14 space-y-1 p-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex h-11 items-center gap-2.5 rounded-md px-3 text-sm text-foreground hover:bg-secondary"
                  activeProps={{ className: "bg-accent font-medium text-accent-foreground" }}
                >
                  <item.icon className="size-4" aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          <nav
            aria-label="Sections"
            className="flex gap-1 border-b border-border bg-surface px-3 py-2 md:hidden"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex h-11 flex-1 items-center justify-center rounded-md px-2 text-xs text-foreground"
                activeProps={{ className: "bg-accent font-medium text-accent-foreground" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <main className="mx-auto w-full max-w-[1600px] px-5 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-page-title">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
