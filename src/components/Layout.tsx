import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  Globe, 
  Layers, 
  BookOpen,
  Menu,
  X,
  Sun,
  Moon,
  History,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Activity,
  Zap,
  ExternalLink,
  Settings,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup,
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, icon, label, active, collapsed, onClick }: NavItemProps) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all group relative",
      active 
        ? "bg-primary text-primary-foreground shadow-sm" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}
  >
    <div className={cn("shrink-0 transition-transform duration-200", !active && "group-hover:scale-110")}>
      {icon}
    </div>
    {!collapsed && (
      <span className="text-sm truncate">
        {label}
      </span>
    )}
    {collapsed && (
      <div className="absolute left-full ml-4 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded border shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        {label}
      </div>
    )}
  </Link>
);

export const Layout = ({ children, customPages = [] }: { children: React.ReactNode, customPages?: any[] }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  const navigation = [
    { to: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
    { to: "/posts", icon: <FileText size={18} />, label: "Posts" },
    { to: "/models", icon: <Database size={18} />, label: "Data Models" },
    { to: "/connections", icon: <Globe size={18} />, label: "API Connections" },
    { to: "/audit", icon: <History size={18} />, label: "Audit Log" },
    { to: "/pages", icon: <Layers size={18} />, label: "Pages" },
    { to: "/docs", icon: <BookOpen size={18} />, label: "API Docs" },
  ];

  const SidebarContent = ({ collapsed = false, onNavItemClick = () => {} }) => (
    <div className="flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 h-20 shrink-0">
        <div className="bg-primary p-2 rounded-lg shrink-0">
          <LayoutDashboard className="text-primary-foreground" size={20} />
        </div>
        {!collapsed && (
          <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">
            Admin CMS
          </h1>
        )}
      </div>
      
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6 py-4">
          <nav className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Core</p>
            )}
            {navigation.map((item) => (
              <NavItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to} 
                collapsed={collapsed}
                onClick={onNavItemClick}
              />
            ))}
          </nav>

          {customPages.length > 0 && (
            <nav className="space-y-1">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Custom Pages</p>
              )}
              {customPages.map((page: any) => (
                <NavItem 
                  key={page.id} 
                  to={`/p${page.path}`} 
                  icon={<Layers size={18} />} 
                  label={page.title}
                  active={location.pathname === `/p${page.path}`}
                  collapsed={collapsed}
                  onClick={onNavItemClick}
                />
              ))}
            </nav>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto">
        <div className={cn(
          "bg-muted/50 rounded-xl p-3 flex items-center gap-3 transition-all border",
          collapsed && "p-2 justify-center"
        )}>
          <Avatar className="h-9 w-9 rounded-lg">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground rounded-lg text-xs font-bold">AD</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Admin User</p>
              <p className="text-[10px] text-muted-foreground truncate">brave4202@gmail.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex text-foreground transition-colors duration-300 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "bg-card border-r hidden lg:flex flex-col sticky top-0 h-screen transition-all duration-300 ease-in-out z-30",
          isSidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent collapsed={isSidebarCollapsed} />
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-3"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <PanelLeft size={18} /> : (
              <>
                <PanelLeftClose size={18} />
                <span className="text-xs font-medium">Collapse Sidebar</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 lg:h-20 items-center justify-between px-4 lg:px-8 bg-background/80 backdrop-blur-md border-b sticky top-0 z-20 flex">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Trigger */}
            <Sheet>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
                <Menu size={20} />
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <SidebarContent />
              </SheetContent>
            </Sheet>

            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer">CMS</span>
              <ChevronRight size={12} />
              <span className="text-foreground font-bold">
                {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1).split('/')[0].toUpperCase()}
              </span>
            </div>
            
            <div className="hidden lg:block h-6 w-px bg-border mx-2" />
            
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md text-muted-foreground cursor-pointer hover:bg-accent transition-all w-48 lg:w-64">
              <Search size={14} />
              <span className="text-xs">Search...</span>
              <span className="ml-auto text-[10px] opacity-50 hidden lg:inline">⌘K</span>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell size={18} />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="text-muted-foreground" />}>
                {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => theme !== 'light' && toggleTheme()}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => theme !== 'dark' && toggleTheme()}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6 hidden lg:block" />
            
            <Button 
              variant={isRightPanelOpen ? "secondary" : "ghost"} 
              size="sm"
              className="hidden lg:flex gap-2 font-bold text-xs"
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            >
              <Activity size={16} />
              <span>Insights</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" className="relative h-8 w-8 rounded-full lg:hidden" />}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px]">AD</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Admin User</p>
                      <p className="text-xs leading-none text-muted-foreground">brave4202@gmail.com</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth">
          {children}
        </div>
      </main>

      {/* Right Side Panel (System Status) */}
      <AnimatePresence>
        {isRightPanelOpen && (
          <motion.aside 
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="hidden xl:flex flex-col w-80 bg-card border-l sticky top-0 h-screen overflow-hidden z-30 shadow-xl"
          >
            <div className="p-6 border-b flex items-center justify-between h-20 shrink-0">
              <h3 className="font-bold flex items-center gap-2">
                <Zap size={18} className="text-yellow-500" />
                System Insights
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setIsRightPanelOpen(false)}>
                <X size={18} />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                {/* Quick Stats */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Performance</p>
                  <div className="space-y-3">
                    <div className="bg-muted/50 p-4 rounded-xl border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">API Health</span>
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20">Operational</Badge>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full w-[98%] bg-green-500 rounded-full" />
                      </div>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-xl border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">Database Latency</span>
                        <span className="text-xs font-bold text-primary">42ms</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div className="h-full w-[40%] bg-primary rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quick Actions</p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="justify-between h-auto py-3 px-4 group">
                      <div className="flex items-center gap-3">
                        <Settings size={16} className="text-muted-foreground group-hover:text-primary" />
                        <span className="text-xs font-medium">System Config</span>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </Button>
                    <Button variant="outline" className="justify-between h-auto py-3 px-4 group">
                      <div className="flex items-center gap-3">
                        <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary" />
                        <span className="text-xs font-medium">View Live Site</span>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Recent Activity Mini-Feed */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Activity</p>
                  <div className="space-y-5">
                    {[
                      { title: 'New Post "Hello World"', time: '2m ago', color: 'bg-blue-500' },
                      { title: 'Model "Users" updated', time: '15m ago', color: 'bg-purple-500' },
                      { title: 'API Connection failed', time: '1h ago', color: 'bg-red-500' },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 relative">
                        {i !== 2 && <div className="absolute left-[7px] top-4 bottom-[-20px] w-px bg-border" />}
                        <div className={cn("w-4 h-4 rounded-full border-4 border-card shrink-0 z-10 shadow-sm", item.color)} />
                        <div className="space-y-1">
                          <p className="text-xs font-medium leading-none">{item.title}</p>
                          <p className="text-[10px] text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="p-6 border-t">
              <div className="p-5 bg-primary rounded-xl text-primary-foreground space-y-3 relative overflow-hidden group cursor-pointer shadow-lg">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <Zap size={14} />
                  </div>
                  <p className="text-xs font-bold">Pro Account</p>
                </div>
                <p className="text-[10px] leading-relaxed opacity-90">Unlock advanced analytics and unlimited data models for your team.</p>
                <Button variant="secondary" size="sm" className="w-full text-[10px] font-bold h-8">
                  Upgrade Now
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};
