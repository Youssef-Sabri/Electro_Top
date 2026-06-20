'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('ErrorBoundary caught an unhandled error:', error, errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-on-background font-poppins text-white">
          <div className="text-center p-8 max-w-md">
            <span className="material-symbols-outlined text-[64px] text-primary select-none mb-4">error_outline</span>
            <h2 className="font-headline-md text-headline-md mb-2">حدث خطأ غير متوقع</h2>
            <p className="text-surface-variant text-sm mb-6">يرجى تحديث الصفحة والمحاولة مرة أخرى.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity cursor-pointer font-semibold uppercase tracking-wider border-0"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
