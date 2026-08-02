import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "line" | "card" | "avatar" | "badge" | "button";
  count?: number;
}

/**
 * Skeleton loader with smooth pulse animation
 */
export function Skeleton({ className = "", variant = "line", count = 1 }: SkeletonProps) {
  const variantClasses: Record<string, string> = {
    line: "h-4 rounded-md",
    card: "h-48 rounded-2xl",
    avatar: "h-12 w-12 rounded-full",
    badge: "h-6 w-16 rounded-md",
    button: "h-10 rounded-md",
  };

  const baseClass = "bg-muted/50 animate-pulse";
  const skeletonClass = `${baseClass} ${variantClasses[variant]} ${className}`;

  if (count === 1) {
    return <div className={skeletonClass} />;
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={skeletonClass} />
      ))}
    </>
  );
}

/**
 * Loading skeleton for table/list rows
 */
export function TableRowSkeleton() {
  return (
    <div className="p-5 flex flex-wrap items-start gap-4 animate-pulse">
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton variant="line" className="h-5 w-3/4" />
        <Skeleton variant="line" className="h-4 w-1/2" />
        <Skeleton variant="line" className="h-3 w-2/3" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="flex gap-2">
          <Skeleton variant="badge" />
          <Skeleton variant="badge" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="button" className="w-16" />
          <Skeleton variant="button" className="w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for card grid items
 */
export function CardGridSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="avatar" />
        <div className="flex-1 space-y-2 min-w-0">
          <Skeleton variant="line" className="h-5 w-2/3" />
          <Skeleton variant="line" className="h-3 w-1/2" />
        </div>
        <Skeleton variant="badge" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="line" className="h-3 w-full" />
        <Skeleton variant="line" className="h-3 w-5/6" />
        <Skeleton variant="line" className="h-3 w-4/5" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton variant="line" className="h-16" />
        <Skeleton variant="line" className="h-16" />
      </div>
      <Skeleton variant="button" className="w-full h-9" />
    </div>
  );
}

/**
 * Loading skeleton for filter header section
 */
export function FilterHeaderSkeleton() {
  return (
    <section className="rounded-2xl bg-card border border-border p-4 shadow-sm mb-4 flex flex-wrap items-center gap-3 animate-pulse">
      <div className="relative flex-1 min-w-[220px]">
        <Skeleton className="w-full h-10 rounded-md" />
      </div>
      <Skeleton className="w-[180px] h-10 rounded-md" />
    </section>
  );
}

interface LoadingContainerProps {
  isLoading: boolean;
  error?: Error | null;
  isEmpty: boolean;
  emptyMessage: string;
  variant?: "table" | "grid";
  itemCount?: number;
  children: React.ReactNode;
}

/**
 * Wrapper component that handles loading, error, and empty states
 */
export function LoadingContainer({
  isLoading,
  error,
  isEmpty,
  emptyMessage,
  variant = "table",
  itemCount = 5,
  children,
}: LoadingContainerProps) {
  if (isLoading) {
    if (variant === "grid") {
      return (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: itemCount }).map((_, i) => (
            <CardGridSkeleton key={i} />
          ))}
        </section>
      );
    }

    // Table variant
    return (
      <section className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {Array.from({ length: itemCount }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-2xl bg-card border border-destructive/20 shadow-sm p-6">
        <p className="text-sm text-destructive">
          {error instanceof Error ? error.message : "An error occurred while loading data."}
        </p>
      </section>
    );
  }

  if (isEmpty) {
    return (
      <section className="rounded-2xl bg-card border border-border shadow-sm p-10">
        <p className="text-center text-sm text-muted-foreground">{emptyMessage}</p>
      </section>
    );
  }

  return <>{children}</>;
}
