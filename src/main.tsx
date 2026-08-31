import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BrandingProvider } from './context/BrandingContext';
import { PermissionsProvider } from './context/PermissionsContext';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
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

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, fontFamily: 'sans-serif', background: '#090d16', color: '#fff', minHeight: '100vh' }}>
          <h1 style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold' }}>Application Encountered an Error</h1>
          <pre style={{ background: '#1e293b', padding: 16, borderRadius: 8, overflowX: 'auto', marginTop: 16, color: '#f87171' }}>
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: 20, padding: '10px 20px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}
          >
            Clear Cache & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <BrandingProvider>
          <AuthProvider>
            <PermissionsProvider>
              <App />
            </PermissionsProvider>
          </AuthProvider>
        </BrandingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);