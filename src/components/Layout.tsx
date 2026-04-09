import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  Globe, 
  Layers, 
  BookOpen,
  Menu,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const NavItem = ({ to, icon, label, active }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all",
      active 
        ? "bg-blue-50 text-blue-700 shadow-sm" 
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    )}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export const Layout = ({ children, customPages = [] }: { children: React.ReactNode, customPages?: any[] }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navigation = [
    { to: "/", icon: <FileText size={20} />, label: "Posts" },
    { to: "/models", icon: <Database size={20} />, label: "Data Models" },
    { to: "/connections", icon: <Globe size={20} />, label: "API Connections" },
    { to: "/pages", icon: <Layers size={20} />, label: "Pages" },
    { to: "/docs", icon: <BookOpen size={20} />, label: "API Docs" },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-[#1A1A1A]">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin CMS</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <nav className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Core</p>
            {navigation.map((item) => (
              <NavItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to} 
              />
            ))}
          </nav>

          {customPages.length > 0 && (
            <nav className="space-y-1">
              <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Custom Pages</p>
              {customPages.map((page: any) => (
                <NavItem 
                  key={page.path} 
                  to={`/p${page.path}`} 
                  icon={<Layers size={20} />} 
                  label={page.title}
                  active={location.pathname === `/p${page.path}`}
                />
              ))}
            </nav>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Admin User</p>
              <p className="text-[10px] text-gray-500 truncate">Internal Tool</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="text-blue-600" size={20} />
          <h1 className="font-bold">Admin CMS</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-40 pt-16 p-4 overflow-y-auto">
           <nav className="space-y-2">
            {navigation.map((item) => (
              <NavItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to} 
              />
            ))}
            <div className="h-px bg-gray-100 my-4" />
            {customPages.map((page: any) => (
              <NavItem 
                key={page.path} 
                to={`/p${page.path}`} 
                icon={<Layers size={20} />} 
                label={page.title}
                active={location.pathname === `/p${page.path}`}
              />
            ))}
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
};
