import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-3xl">⚠️</div>
          <div>
            <h3 className="text-white font-black text-lg mb-2">Er ging iets mis</h3>
            <p className="text-zinc-400 text-sm mb-4">{this.state.error?.message || 'Onbekende fout'}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-6 py-3 bg-gold-500/20 border border-gold-500/30 rounded-2xl text-gold-400 text-sm font-bold hover:bg-gold-500/30 transition-colors"
            >
              Opnieuw proberen
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
