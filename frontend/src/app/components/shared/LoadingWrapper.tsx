import { useState, useEffect, ReactNode } from "react";
import { FadeIn } from "../ui/animations";
import { PageHeaderSkeleton, StatsCardSkeleton, TableSkeleton } from "../ui/skeleton";

interface LoadingWrapperProps {
  children: ReactNode;
  loading?: boolean;
  delay?: number;
  type?: 'dashboard' | 'table' | 'form' | 'page';
}

export function LoadingWrapper({ children, loading = false, delay = 300, type = 'page' }: LoadingWrapperProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [loading, delay]);

  if (loading || !showContent) {
    return (
      <div className="p-4 lg:p-10">
        {type === 'dashboard' && (
          <div>
            <PageHeaderSkeleton />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
              <StatsCardSkeleton />
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <TableSkeleton rows={5} />
            </div>
          </div>
        )}
        {type === 'table' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <TableSkeleton rows={8} />
          </div>
        )}
        {type === 'page' && <PageHeaderSkeleton />}
      </div>
    );
  }

  return <FadeIn duration={0.4}>{children}</FadeIn>;
}
