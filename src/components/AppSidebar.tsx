import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, FileText, Bell, Settings, Menu, X, Users, LogOut, ChevronDown, ClipboardList, Layers } from 'lucide-react';
import { useState } from 'react';
import { useSidebarLogo } from '@/hooks/useBranding';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const navItems = [
{ to: '/', label: 'Dashboard', icon: LayoutDashboard },
{ to: '/kunder', label: 'Kunder', icon: Building2 },
{ to: '/avtal', label: 'Avtal', icon: FileText },
{ to: '/paminnelser', label: 'Påminnelser', icon: Bell },
{ to: '/mallar', label: 'Avtalsmallar', icon: ClipboardList },
{ to: '/installningar', label: 'Inställningar', icon: Settings, adminOnly: true }];


export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user, profile, role, isAdmin, signOut } = useAuth();
  const { data: sidebarLogo } = useSidebarLogo();

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??';
  };

  const roleLabel = role === 'admin' ? 'Admin' : role === 'user' ? 'Användare' : 'Läsare';

  const renderNavItem = (item: typeof navItems[0], isActive: boolean) =>
  <NavLink
    key={item.to}
    to={item.to}
    onClick={() => setMobileOpen(false)}
    className={cn(
      'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
      isActive ?
      'bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_0_16px_hsl(var(--sidebar-primary)/0.3)]' :
      'text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground'
    )}>
    {isActive &&
    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-[3px] bg-gradient-to-b from-transparent via-sidebar-primary to-transparent shadow-[0_0_12px_hsl(var(--sidebar-primary))] rounded-r-full" />
    }
      <item.icon className={cn(
      'h-[18px] w-[18px] shrink-0 transition-colors',
      isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
    )} strokeWidth={isActive ? 2 : 1.5} />
      <span>{item.label}</span>
      {isActive &&
    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary shadow-[0_0_8px_hsl(var(--sidebar-primary))]" />
    }
    </NavLink>;


  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-6 left-4 z-[60] md:hidden rounded-lg bg-sidebar p-2 text-sidebar-foreground shadow-lg"
        aria-label="Öppna meny">
        
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {mobileOpen &&
      <div
        className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm md:hidden"
        onClick={() => setMobileOpen(false)} />

      }

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 shrink-0 flex flex-col bg-sidebar transition-all duration-300 md:relative md:translate-x-0 md:w-60 pattern-binding-perforation',
          mobileOpen ? 'translate-x-0 w-60' : '-translate-x-full w-0'
        )}>

        {/* Logo */}
        <div className="flex flex-col border-b border-sidebar-border">
          <div className="flex h-16 items-center justify-between px-5">
            <div className="flex items-center gap-3">
              {sidebarLogo &&
              <img src={sidebarLogo} alt="Logo" className="h-9 w-9 rounded-lg object-contain border-none shadow-none" />
              }
              <div className="flex flex-col">
                <span className="font-heading text-[15px] font-semibold text-sidebar-accent-foreground tracking-tight leading-tight">
                  Prefabmästarna
                </span>
                <span className="text-[10px] text-sidebar-foreground/50 tracking-wide">
                  Avtalsportalen
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden text-sidebar-foreground"
              aria-label="Stäng meny">
              
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="h-px bg-gradient-to-r from-sidebar-primary/40 via-accent-copper/20 to-transparent" />
            </div>
        {/* Section label */}
        <div className="px-5 pt-5 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            Meny
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto space-y-0.5 pb-4 px-[12px] border-none rounded-none">
          {visibleNavItems.map((item) => {
            const isActive = item.to === '/' ?
            location.pathname === '/' :
            location.pathname.startsWith(item.to);
            return renderNavItem(item, isActive);
          })}

          {/* Admin-only: Users */}
          {isAdmin &&
          <>
              <div className="px-2 pt-4 pb-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  Administration
                </span>
              </div>
              <NavLink
              to="/anvandare"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                location.pathname === '/anvandare' ?
                'bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_0_16px_hsl(var(--sidebar-primary)/0.3)]' :
                'text-sidebar-foreground hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground'
              )}>
              {location.pathname === '/anvandare' &&
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-[3px] bg-gradient-to-b from-transparent via-sidebar-primary to-transparent shadow-[0_0_12px_hsl(var(--sidebar-primary))] rounded-r-full" />
              }
                <Users className={cn(
                'h-[18px] w-[18px] shrink-0 transition-colors',
                location.pathname === '/anvandare' ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground'
              )} strokeWidth={location.pathname === '/anvandare' ? 2 : 1.5} />
                <span>Användare</span>
                {location.pathname === '/anvandare' &&
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary shadow-[0_0_8px_hsl(var(--sidebar-primary))]" />
              }
              </NavLink>
            </>
          }
        </nav>

        {/* User menu */}
        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-sidebar-accent/40 transition-colors focus:outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-sidebar-primary/20 text-sidebar-primary text-[11px] font-semibold">
                  {getInitials(profile?.full_name || user?.email || '')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-sidebar-accent-foreground truncate">
                  {profile?.full_name || user?.email || 'Användare'}
                </p>
                <p className="text-[11px] text-sidebar-foreground/50">{roleLabel}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/40" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem onClick={signOut} className="text-status-expired focus:text-status-expired">
                <LogOut className="mr-2 h-4 w-4" />
                Logga ut
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>);

}