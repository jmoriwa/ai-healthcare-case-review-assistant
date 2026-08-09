import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/common/Button";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches unexpected render-time errors inside the authenticated shell so a
 * single broken panel cannot blank the whole application.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
    reportLovableError(error, { boundary: "app_error_boundary" });
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="mx-auto max-w-lg rounded-lg border border-border bg-card p-6 text-center"
      >
        <h1 className="text-card-title">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error interrupted this screen. No review data was changed. You can try again
          or return to the case queue.
        </p>
        <p className="mt-3 break-words text-xs text-muted-foreground">{error.message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={this.reset}>Try again</Button>
          <Button variant="secondary" onClick={() => window.location.assign("/queue")}>
            Back to queue
          </Button>
        </div>
      </div>
    );
  }
}
