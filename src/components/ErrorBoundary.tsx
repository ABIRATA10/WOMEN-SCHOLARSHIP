import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-rose-50 rounded-[3rem] border border-rose-100 m-8">
          <div className="w-20 h-20 bg-white text-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-rose-200 mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-black text-rose-900 mb-4">Oops, something went wrong!</h2>
          <p className="text-rose-600 font-medium mb-8 max-w-md">
            We encountered an unexpected error while trying to display this section. Don't worry, your data is safe.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
          >
            <RefreshCw size={18} />
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
