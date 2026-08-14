import { Component, type ErrorInfo, type ReactNode } from "react";

export class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("TinyTools failed to render", error, info);
  }
  render(): ReactNode {
    return this.state.hasError ? (
      <main className="fatal-error">
        <p className="eyebrow">TinyTools</p>
        <h1>Something went wrong.</h1>
        <p>Close and reopen the app to try again.</p>
        <button className="secondary-button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
