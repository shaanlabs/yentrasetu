import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches rendering errors in child components
 * and displays a fallback UI instead of crashing the whole app.
 * 
 * Technical justification: React docs mandate Error Boundaries
 * for production apps. Without them, a single component crash
 * (e.g., from malformed API data) takes down the entire page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, send to error tracking service (e.g., Sentry)
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[300px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#101214] mb-2 font-heading">Something went wrong</h2>
            <p className="text-sm text-[#6F757C] mb-4">
              This section encountered an error. The rest of the application is unaffected.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 text-sm font-medium text-white bg-[#FF6A00] rounded-lg hover:bg-[#e55f00] transition-colors"
            >
              Try again
            </button>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 p-3 bg-[#101214] text-red-400 text-xs rounded-lg text-left overflow-x-auto font-mono">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
