import { Component, type ErrorInfo, type ReactNode } from "react";
import { type WithTranslation, withTranslation } from "react-i18next";

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors so a single throw cannot blank the whole app.
 *
 * This matters more than usual here: the app's core dependency is a 53 MB
 * SQLite database fetched at runtime, and a failure anywhere in that path used
 * to unmount the tree to a white screen with no way back.
 *
 * Must stay a class component -- React has no hook equivalent of
 * componentDidCatch.
 */
class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled render error:", error, errorInfo.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    const { children, t } = this.props;

    if (!error) return children;

    return (
      <div
        role="alert"
        className="min-h-screen flex items-center justify-center p-6 bg-[rgb(var(--bg-base))]"
      >
        <div className="card-technical max-w-lg w-full p-6 border-l-4 border-l-red-500">
          <h1 className="font-display text-2xl text-red-400 mb-3">{t("errorBoundary.title")}</h1>
          <p className="text-teal-200/80 font-mono-data text-sm mb-4">
            {t("errorBoundary.description")}
          </p>
          <pre className="text-xs font-mono-data text-teal-400/60 bg-black/30 p-3 mb-4 overflow-x-auto whitespace-pre-wrap">
            {error.message}
          </pre>
          <button
            type="button"
            onClick={this.handleReload}
            className="font-mono-data text-sm px-4 py-2 border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            {t("errorBoundary.reload")}
          </button>
        </div>
      </div>
    );
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryInner);
