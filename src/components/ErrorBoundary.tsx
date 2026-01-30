import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private readonly handleReload = () => {
    globalThis.location.reload();
  };

  private readonly handleGoHome = () => {
    globalThis.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError = 
        this.state.error?.name === 'ChunkLoadError' || 
        this.state.error?.message?.includes('Loading chunk') ||
        this.state.error?.message?.includes('Failed to fetch dynamically imported module');

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 font-lexend">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {isChunkError ? 'Update Available' : 'Something went wrong'}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {isChunkError 
                ? 'An updated version of Quizzer is available. Please reload the page to continue.'
                : 'We encountered an unexpected error while rendering this page.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
              >
                <RefreshCcw className="w-4 h-4" />
                Reload Page
              </button>
              
              {!isChunkError && (
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              )}
            </div>
            
            {(import.meta as any).env.DEV && !isChunkError && (
              <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left overflow-auto max-h-40">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 break-all">
                  {this.state.error?.toString()}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

