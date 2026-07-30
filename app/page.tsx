"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // ตรวจสอบการเข้าสู่ระบบจาก localStorage
    const isUserLoggedIn = localStorage.getItem("me_docflow_user_session");
    const isAdminLoggedIn = localStorage.getItem("me_docflow_admin_logged_in");

    if (isAdminLoggedIn) {
      router.push("/admin/dashboard");
    } else if (isUserLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );
}

