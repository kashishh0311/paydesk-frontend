import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './Button';
import { AlertCircle, RotateCcw } from 'lucide-react';

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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-md w-full p-6 rounded-2xl bg-card border border-border shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Something went wrong</h2>
              <p className="text-xs text-muted mt-1">
                {this.state.error?.message || 'An unexpected rendering error occurred in the workspace.'}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
