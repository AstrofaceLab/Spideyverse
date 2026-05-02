"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PageErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-[#0D1525]/50 rounded-2xl border border-white/[0.05] m-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h2 className="font-poppins text-xl font-semibold text-[#E5ECF6] mb-2">
            Something went wrong
          </h2>
          
          <p className="text-sm text-[#64748B] font-manrope max-w-md mb-8 leading-relaxed">
            An unexpected error occurred while loading this page. Our team has been notified.
            {this.state.error && (
              <span className="block mt-2 p-2 bg-black/20 rounded font-mono text-[10px] text-red-400/70 overflow-hidden text-ellipsis whitespace-nowrap">
                {this.state.error.message}
              </span>
            )}
          </p>
          
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="sv-btn-primary px-6 py-2.5 flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Again
            </button>
            
            <Link
              href="/app/dashboard"
              className="sv-btn-outline px-6 py-2.5 flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
