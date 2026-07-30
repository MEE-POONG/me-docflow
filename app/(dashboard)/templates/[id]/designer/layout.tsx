// This layout renders the designer in fullscreen — no Sidebar / Navbar wrapper.
export default function DesignerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#1e1e2e] text-gray-100">
      {children}
    </div>
  );
}
