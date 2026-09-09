"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  CheckCircle,
  ShieldCheck,
  LayoutTemplate,
  Workflow,
  Zap,
  ArrowRight,
  Menu,
  X
} from "lucide-react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Check login state and scroll listener
  useEffect(() => {
    setIsUserLoggedIn(!!localStorage.getItem("me_docflow_user_session"));
    setIsAdminLoggedIn(!!localStorage.getItem("me_docflow_admin_logged_in"));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const dashboardUrl = isAdminLoggedIn ? "/admin/dashboard" : "/dashboard";
  const loginText = (isUserLoggedIn || isAdminLoggedIn) ? "ไปที่แดชบอร์ด" : "เข้าสู่ระบบ";
  const loginUrl = (isUserLoggedIn || isAdminLoggedIn) ? dashboardUrl : "/login";

  const features = [
    {
      title: "e-Document",
      description: "สร้าง จัดเก็บ และเรียกดูเอกสารออนไลน์ได้ทุกที่ทุกเวลา บอกลากระดาษแบบเดิมๆ",
      icon: <FileText className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Approval Workflow",
      description: "ระบบอนุมัติเอกสารอัตโนมัติแบบหลายขั้นตอน กำหนดผู้มีอำนาจอนุมัติได้อย่างอิสระ",
      icon: <Workflow className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Custom Templates",
      description: "ออกแบบแบบฟอร์มเอกสารได้เอง ไม่ว่าจะเป็นใบเสนอราคา ใบเสร็จ หรือเอกสารภายใน",
      icon: <LayoutTemplate className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "High Security",
      description: "จัดเก็บข้อมูลบนคลาวด์มาตรฐานสากล พร้อมระบบเข้ารหัสและบันทึกประวัติ (Audit Log)",
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Role Management",
      description: "กำหนดสิทธิ์ผู้ใช้งานได้หลากหลายระดับ (Owner, Admin, HR, Viewer) ป้องกันข้อมูลรั่วไหล",
      icon: <CheckCircle className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "Lightning Fast",
      description: "ค้นหาข้อมูลเอกสารภายในเสี้ยววินาที สร้างและส่งออก PDF อย่างรวดเร็ว",
      icon: <Zap className="w-6 h-6 text-emerald-500" />
    }
  ];

  const packages = [
    {
      name: "Starter",
      desc: "สำหรับธุรกิจเริ่มต้นที่เพิ่งก้าวสู่โลกดิจิทัล",
      price: "Free",
      features: ["ผู้ใช้งาน 3 คน", "พื้นที่จัดเก็บ 1 GB", "เอกสารสูงสุด 100 ฉบับ/เดือน", "เทมเพลตพื้นฐาน 5 แบบ"],
      popular: false,
    },
    {
      name: "Pro",
      desc: "สำหรับ SMEs ที่ต้องการระบบไหลเวียนเอกสารเต็มรูปแบบ",
      price: "฿ 990 / เดือน",
      features: ["ผู้ใช้งาน 15 คน", "พื้นที่จัดเก็บ 10 GB", "เอกสารไม่จำกัด", "สร้างเทมเพลตเองได้", "ตั้งค่า Workflow อนุมัติเอกสาร"],
      popular: true,
    },
    {
      name: "Enterprise",
      desc: "สำหรับองค์กรขนาดใหญ่ที่มีโครงสร้างซับซ้อน",
      price: "฿ 4,500 / เดือน",
      features: ["ผู้ใช้งานไม่จำกัด", "พื้นที่จัดเก็บ 100 GB", "API เชื่อมต่อระบบภายนอก", "ระบบสิทธิ์ผู้ใช้งานระดับสูง", "Support Priority ตลอด 24 ชม."],
      popular: false,
    }
  ];

  return (
    <div className="admin-sarabun min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-x-hidden">

      {/* Background Decorators */}
      <div className="absolute top-0 inset-x-0 h-screen overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-400/20 dark:bg-emerald-600/20 blur-[100px] opacity-70 mix-blend-multiply dark:mix-blend-screen animate-pulse duration-10000"></div>
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-300/20 dark:bg-teal-700/20 blur-[120px] opacity-60 mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      {/* NAVBAR */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-slate-800 py-3" : "bg-transparent py-5"}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <FileText size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
              ME Docflow
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors">ฟีเจอร์</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors">แพ็กเกจ</a>
            <Link
              href={loginUrl}
              className="px-6 py-2.5 rounded-full bg-slate-900 text-white dark:bg-emerald-600 hover:bg-emerald-600 dark:hover:bg-emerald-500 text-sm font-medium transition-all shadow-md hover:shadow-xl hover:shadow-emerald-500/20 transform hover:-translate-y-0.5"
            >
              {loginText}
            </Link>
          </nav>

          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-slate-700 dark:text-slate-300 p-2">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 flex flex-col p-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex justify-between items-center mb-8">
            <span className="text-xl font-bold text-slate-900 dark:text-white">ME Docflow</span>
            <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500 p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-col gap-6 text-lg font-medium text-slate-700 dark:text-slate-200">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 dark:border-slate-800 pb-4">ฟีเจอร์เด่น</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="border-b border-gray-100 dark:border-slate-800 pb-4">แพ็กเกจ</a>
            <Link
              href={loginUrl}
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 px-6 py-4 rounded-xl bg-emerald-600 text-white text-center shadow-lg shadow-emerald-600/30 font-bold"
            >
              {loginText}
            </Link>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative z-10 pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest mb-8 border border-emerald-200 dark:border-emerald-800/50">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ระบบบริหารเอกสารยุคใหม่
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-8">
            จัดการทุกเอกสารทางธุรกิจ<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">
              ให้อยู่ในมือคุณ
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            บอกลาความยุ่งยากของเอกสารกระดาษ เปลี่ยนสู่ระบบ Paperless เต็มรูปแบบ สร้าง ส่ง อนุมัติ และจัดเก็บเอกสารอย่างปลอดภัยในที่เดียว
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={loginUrl}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-lg shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              เริ่มต้นใช้งานฟรี <ArrowRight size={20} />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-semibold text-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center"
            >
              ศึกษาฟีเจอร์เพิ่มเติม
            </a>
          </div>
        </div>

        {/* Dashboard Preview Image / Mockup Component */}
        <div className="mt-20 max-w-5xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[400px] md:h-[600px]">
            {/* Mock Header */}
            <div className="h-12 border-b border-gray-100 dark:border-slate-800 flex items-center px-4 gap-2 bg-slate-50 dark:bg-slate-950">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="ml-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-md h-6 w-48 opacity-60"></div>
            </div>
            {/* Mock Content */}
            <div className="flex-1 flex p-6 gap-6 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="hidden md:flex flex-col gap-4 w-48">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-8 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
                ))}
              </div>
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 h-24 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm animate-pulse" style={{ animationDelay: `${i * 150}ms` }}></div>
                  ))}
                </div>
                <div className="flex-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="relative z-10 py-24 bg-slate-50 dark:bg-slate-900/50 border-y border-gray-200 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">ฟีเจอร์ที่ครอบคลุมทุกการทำงาน</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
              เราออกแบบระบบมาเพื่อลดขั้นตอนการทำงานที่ซับซ้อน ให้เหลือเพียงไม่กี่คลิก คุณจะได้โฟกัสกับการบริหารธุรกิจอย่างเต็มที่
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-slate-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-800/40 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-light">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">แพ็กเกจที่ใช่ สำหรับคุณ</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 font-light">
              เลือกแพ็กเกจที่เหมาะสมกับขนาดธุรกิจของคุณ จ่ายตามการใช้งานจริง ไม่มีสัญญาผูกมัด
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
            {packages.map((pkg, idx) => (
              <div
                key={idx}
                className={`relative rounded-3xl p-8 transition-transform duration-300 hover:-translate-y-2 ${pkg.popular
                    ? "bg-slate-900 dark:bg-slate-800 text-white shadow-2xl scale-105 border border-slate-700 md:z-10"
                    : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-gray-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none"
                  }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-900 text-[10px] font-black uppercase tracking-widest py-1 px-4 rounded-full shadow-md">
                    ยอดนิยม
                  </div>
                )}

                <h3 className={`text-2xl font-bold mb-2 ${pkg.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>{pkg.name}</h3>
                <p className={`text-sm mb-6 font-light ${pkg.popular ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>{pkg.desc}</p>

                <div className="mb-8">
                  <span className={`text-4xl font-extrabold ${pkg.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>{pkg.price}</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 shrink-0 ${pkg.popular ? "text-emerald-400" : "text-emerald-500"}`} />
                      <span className={`text-sm font-medium ${pkg.popular ? "text-slate-200" : "text-slate-700 dark:text-slate-300"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={loginUrl}
                  className={`w-full py-4 rounded-xl font-bold flex justify-center items-center transition-all ${pkg.popular
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
                    }`}
                >
                  เลือกแพ็กเกจนี้
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 bg-slate-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
                  <FileText size={18} strokeWidth={2.5} />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-white">ME Docflow</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed font-light">
                ระบบจัดการเอกสารอิเล็กทรอนิกส์แบบครบวงจร ที่ช่วยให้ธุรกิจของคุณทำงานได้รวดเร็ว ปลอดภัย และมีประสิทธิภาพสูงสุด
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">บริการ</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li><a href="#" className="hover:text-emerald-500 transition-colors">ระบบบริหารเอกสาร</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-colors">ระบบอนุมัติออนไลน์</a></li>
                <li><a href="#" className="hover:text-emerald-500 transition-colors">ระบบจัดเก็บไฟล์คลาวด์</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-4">ติดต่อเรา</h4>
              <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <li>อีเมล: hello@medocflow.com</li>
                <li>โทร: 02-xxx-xxxx</li>
                <li>วันทำการ: จันทร์ - ศุกร์ (9:00 - 18:00)</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
            <p>&copy; 2026 ME Docflow. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">ข้อตกลงการใช้งาน</a>
              <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">นโยบายความเป็นส่วนตัว</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
