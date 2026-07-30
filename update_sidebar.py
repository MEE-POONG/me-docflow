import re

with open("components/layout/Sidebar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update aside class
content = re.sub(
    r'<aside className=\{`fixed md:sticky top-0 left-0 h-screen z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col font-sans transition-all duration-300 ease-in-out \$\{isOpen \? "translate-x-0 md:ml-0" : "-translate-x-full md:translate-x-0 md:-ml-64"\}`\}>',
    r'<aside className={`fixed md:sticky top-0 left-0 h-screen z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col font-sans transition-all duration-300 ease-in-out ${isOpen ? "w-64 translate-x-0" : "w-64 md:w-20 -translate-x-full md:translate-x-0"}`}>',
    content
)

# 2. Update Logo Area
logo_orig = """      {/* Logo Area */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 transition-colors">
        <div className="bg-emerald-500 p-2 rounded-lg text-white">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-white leading-tight truncate max-w-[130px]" title={activeCompanyName}>{activeCompanyName}</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.common.companyWorkspace}</p>
        </div>
        <div className="ml-auto text-gray-400 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </div>
      </div>"""

logo_new = """      {/* Logo Area */}
      <div className={`p-4 border-b border-gray-100 dark:border-gray-800 flex items-center ${isOpen ? 'gap-3' : 'justify-center'} transition-colors`}>
        <div className="bg-emerald-500 p-2 rounded-lg text-white shrink-0">
          <ShieldCheck size={24} />
        </div>
        {isOpen && (
          <>
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white leading-tight truncate max-w-[130px]" title={activeCompanyName}>{activeCompanyName}</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">{t.common.companyWorkspace}</p>
            </div>
            <div className="ml-auto text-gray-400 cursor-pointer p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </div>
          </>
        )}
      </div>"""

content = content.replace(logo_orig, logo_new)

# 3. Update Dashboard Link
dash_orig = """          <Link 
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              pathname === '/dashboard' || pathname === '/' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <LayoutDashboard size={20} className={pathname === '/dashboard' || pathname === '/' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'} />
            <span className="text-sm">{t.sidebar.dashboard}</span>
          </Link>"""

dash_new = """          <Link 
            href="/dashboard"
            className={`flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg transition-colors ${
              pathname === '/dashboard' || pathname === '/' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            title={!isOpen ? t.sidebar.dashboard : undefined}
          >
            <LayoutDashboard size={20} className={`shrink-0 ${pathname === '/dashboard' || pathname === '/' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
            {isOpen && <span className="text-sm truncate">{t.sidebar.dashboard}</span>}
          </Link>"""

content = content.replace(dash_orig, dash_new)

# 4. Helper for dropdown buttons
button_pattern = re.compile(r'<button \s*onClick=\{\(\) => toggleMenu\(\'([^\']+)\'\)\}\s*className="w-full flex items-center justify-between px-3 py-2 (.*?)"\s*>\s*<div className="flex items-center gap-3">\s*<([A-Za-z0-9_]+) size=\{20\} className="text-gray-400" />\s*<span className="text-sm font-medium">(\{t\.sidebar\.[^\}]+\})</span>\s*</div>\s*\{expanded\.[^ ]+ \? <ChevronDown size=\{14\} className="text-gray-400" /> : <ChevronRight size=\{14\} className="text-gray-400" />\}\s*</button>', re.DOTALL)

def repl_button(m):
    menu_key = m.group(1)
    classes = m.group(2)
    icon = m.group(3)
    text_var = m.group(4)
    
    return f"""<button 
              onClick={{() => toggleMenu('{menu_key}')}}
              className={{`w-full flex items-center ${{isOpen ? 'justify-between px-3' : 'justify-center px-0'}} py-2 {classes}`}}
              title={{!isOpen ? {text_var} : undefined}}
            >
              <div className={{`flex items-center ${{isOpen ? 'gap-3' : 'justify-center'}}`}}>
                <{icon} size={{20}} className="text-gray-400 shrink-0" />
                {{isOpen && <span className="text-sm font-medium truncate">{{{text_var}}}</span>}}
              </div>
              {{isOpen && (
                expanded.{menu_key} ? <ChevronDown size={{14}} className="text-gray-400 shrink-0" /> : <ChevronRight size={{14}} className="text-gray-400 shrink-0" />
              )}}
            </button>"""

content = button_pattern.sub(repl_button, content)

# 5. Fix Approval System button
approval_orig = """<button 
              onClick={() => toggleMenu('approval')}
              className="w-full flex items-center justify-between px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="text-sm font-medium">{t.sidebar.approvalSystem}</span>
              </div>
              {expanded.approval ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
            </button>"""

approval_new = """<button 
              onClick={() => toggleMenu('approval')}
              className={`w-full flex items-center ${isOpen ? 'justify-between px-3' : 'justify-center px-0'} py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors`}
              title={!isOpen ? t.sidebar.approvalSystem : undefined}
            >
              <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
                <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {isOpen && <span className="text-sm font-medium truncate">{t.sidebar.approvalSystem}</span>}
              </div>
              {isOpen && (
                expanded.approval ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />
              )}
            </button>"""

content = content.replace(approval_orig, approval_new)

# 6. Hide sub-menus when !isOpen
content = re.sub(r'\{expanded\.([A-Za-z0-9_]+) && \(', r'{isOpen && expanded.\1 && (', content)

# 7. Update Reports Link
reports_orig = """<Link 
              href="/reports"
              className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <PieChart size={20} className="text-gray-400" />
              <span className="text-sm font-medium">{t.sidebar.reports}</span>
            </Link>"""

reports_new = """<Link 
              href="/reports"
              className={`flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors`}
              title={!isOpen ? t.sidebar.reports : undefined}
            >
              <PieChart size={20} className="text-gray-400 shrink-0" />
              {isOpen && <span className="text-sm font-medium truncate">{t.sidebar.reports}</span>}
            </Link>"""

content = content.replace(reports_orig, reports_new)

# 8. Update Change Password Link
pwd_orig = """<Link 
              href="/change-password"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                pathname === '/change-password' ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Key size={20} className={pathname === '/change-password' ? 'text-emerald-600' : 'text-gray-400'} />
              <span className="text-sm font-medium">เปลี่ยนรหัสผ่าน</span>
            </Link>"""

pwd_new = """<Link 
              href="/change-password"
              className={`flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-lg transition-colors ${
                pathname === '/change-password' ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={!isOpen ? 'เปลี่ยนรหัสผ่าน' : undefined}
            >
              <Key size={20} className={`shrink-0 ${pathname === '/change-password' ? 'text-emerald-600' : 'text-gray-400'}`} />
              {isOpen && <span className="text-sm font-medium truncate">เปลี่ยนรหัสผ่าน</span>}
            </Link>"""

content = content.replace(pwd_orig, pwd_new)

# 9. Update Logout button
logout_orig = """<button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer font-sans"
            >
              <LogOut size={20} className="text-red-500" />
              <span className="text-sm font-medium">ออกจากระบบ</span>
            </button>"""

logout_new = """<button 
              onClick={handleLogout}
              className={`w-full flex items-center ${isOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer font-sans`}
              title={!isOpen ? 'ออกจากระบบ' : undefined}
            >
              <LogOut size={20} className="text-red-500 shrink-0" />
              {isOpen && <span className="text-sm font-medium truncate">ออกจากระบบ</span>}
            </button>"""

content = content.replace(logout_orig, logout_new)

# 10. Update Footer Hint
footer_orig = """      {/* Footer hint */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-start gap-2 transition-colors">
        <div className="w-6 h-6 rounded-full bg-gray-800 dark:bg-gray-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">N</div>
        <p className="text-[10px] text-gray-400 leading-tight">{t.sidebar.footerHint}</p>
      </div>"""

footer_new = """      {/* Footer hint */}
      <div className={`p-4 border-t border-gray-100 dark:border-gray-800 flex items-start ${isOpen ? 'gap-2' : 'justify-center'} transition-colors`}>
        <div className="w-6 h-6 rounded-full bg-gray-800 dark:bg-gray-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">N</div>
        {isOpen && <p className="text-[10px] text-gray-400 leading-tight">{t.sidebar.footerHint}</p>}
      </div>"""

content = content.replace(footer_orig, footer_new)

with open("components/layout/Sidebar.tsx", "w", encoding="utf-8") as f:
    f.write(content)
