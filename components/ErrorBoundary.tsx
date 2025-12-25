import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  // Explicitly define props to satisfy TypeScript in strict environments
  public readonly props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sanctuary Core Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-[#D4AF37] p-6 text-center font-sans overflow-hidden relative">
            
            {/* Background Ambience (CSS Only) */}
            <div className="absolute inset-0 opacity-50 pointer-events-none" 
                 style={{ background: 'radial-gradient(circle at center, rgba(146, 64, 14, 0.2), #000000 70%)' }} />
            
            <div className="relative z-10 max-w-md">
                <div className="w-20 h-20 mx-auto bg-amber-900/10 border border-amber-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    {/* Raw SVG Shield Alert */}
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        <path d="M12 8v4" />
                        <path d="M12 16h.01" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold uppercase tracking-widest mb-4 text-white">System Recalibration</h1>
                
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 border-l-2 border-[#D4AF37]/30 pl-4 font-serif italic">
                    "The connection wavers, but the Council remains. Ennea has engaged the safety protocols to preserve data integrity."
                </p>

                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 text-left mb-8">
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider mb-1">Diagnostics:</p>
                    <p className="text-xs text-red-400 font-mono break-all">
                        {this.state.error?.message || "Unknown anomaly detected."}
                    </p>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="group w-full py-4 bg-[#D4AF37] text-black font-bold rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 active:scale-95"
                >
                    {/* Raw SVG Refresh */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                    </svg>
                    Restore Equilibrium
                </button>
            </div>

            <div className="absolute bottom-8 text-[9px] text-zinc-600 font-mono uppercase tracking-[0.3em]">
                Diamond Persistence Active
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}