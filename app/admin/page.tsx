"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-800 dark:text-slate-100">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500 mb-4"></div>
      <p className="text-xs text-slate-500 dark:text-slate-400">กำลังนำทางไปหน้าแดชบอร์ดแอดมิน...</p>
    </div>
  );
}
