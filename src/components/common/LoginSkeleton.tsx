import React from 'react';
import { Card } from './Card';

export const LoginSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground px-4 py-10 transition-colors relative">
      {/* Top right theme toggle placeholder */}
      <div className="absolute top-6 right-6">
        <div className="w-10 h-10 rounded-xl bg-card border border-border animate-pulse" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo and Brand Header Skeleton */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 mb-4 animate-pulse" />
          <div className="h-7 w-32 bg-muted/30 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-muted/20 rounded-md animate-pulse" />
        </div>

        {/* Login Card Skeleton */}
        <Card>
          <div className="mb-6 space-y-2">
            <div className="h-6 w-24 bg-muted/30 rounded-md animate-pulse" />
            <div className="h-3.5 w-56 bg-muted/20 rounded-md animate-pulse" />
          </div>

          <div className="space-y-4">
            {/* Email Field Skeleton */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-20 bg-muted/25 rounded animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-background border border-border/80 animate-pulse" />
            </div>

            {/* Password Field Skeleton */}
            <div className="space-y-1.5">
              <div className="h-3.5 w-16 bg-muted/25 rounded animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-background border border-border/80 animate-pulse" />
            </div>

            {/* Submit Button Skeleton */}
            <div className="h-10 w-full rounded-xl bg-primary/30 mt-2 animate-pulse" />
          </div>
        </Card>
      </div>
    </div>
  );
};
