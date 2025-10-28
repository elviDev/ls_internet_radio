"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export default function GuestOnlyWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // Simple role-based redirect: admin -> dashboard, others -> home
      const redirectUrl = user.role === 'ADMIN' ? '/dashboard' : '/';
      console.log("[GuestOnlyWrapper] Redirecting authenticated user to:", redirectUrl);
      router.replace(redirectUrl);
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return null; // Router will redirect
  }

  return <>{children}</>;
}