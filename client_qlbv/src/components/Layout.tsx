import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import NotificationBell from '@/components/NotificationBell';
import { useCommandStore } from '@/store/commandStore';
import {
  LayoutDashboard, Users, UserRound, CalendarDays,
  FileText, Pill, Receipt, LogOut, Menu, X, Activity,
  GitBranch, FlaskConical, UserCog, BedDouble, Stethoscope,
  Scissors, ShieldCheck, Package, Video, ArrowRightLeft,
  FileCheck, ShoppingCart, Wrench, Search, ChevronDown,
} from 'lucide-react';
import { useState as useLocalState } from 'react';

const navGroups = [
  {
    label: 'Lam sang',
    items: [
      { href: '/dashboard',       label: 'Dashboard',       icon: LayoutDashboard },
      { href: '/patients',        label: 'Benh nhan',       icon: Users },
      { href: '/doctors',         label: 'Bac si',          icon: UserRound },
      { href: '/appointments',    label: 'Lich kham',       icon: CalendarDays },
      { href: '/encounters',      label: 'Dot dieu tri',    icon: Stethoscope },
      { href: '/beds',            label: 'Quan ly giuong',  icon: BedDouble },
      { href: '/medical-records', label: 'Ho so benh an',   icon: FileText },
      { href: '/lab',             label: 'Xet nghiem',      icon: FlaskConical },
      { href: '/surgery',         label: 'Phau thuat',      icon: Scissors },
    ],
  },
  {
    label: 'Dich vu',
    items: [
      { href: '/telemedicine', label: 'Kham tu xa',  icon: Video },
      { href: '/referrals',   label: 'Chuyen vien', icon: ArrowRightLeft },
      { href: '/consent',     label: 'Dong thuan',  icon: FileCheck },
      { href: '/pharmacy',    label: 'Nha thuoc',   icon: Pill },
    ],
  },
  {
    label: 'Quan tri',
    items: [
      { href: '/medicines',         label: 'Kho thuoc',  icon: Package },
      { href: '/billing',           label: 'Thanh toan', icon: Receipt },
      { href: '/insurance',         label: 'Bao hiem',   icon: ShieldCheck },
      { href: '/procurement',       label: 'Mua sam',    icon: ShoppingCart },
      { href: '/equipment',         label: 'Thiet bi',   icon: Wrench },
      { href: '/staff',             label: 'Nhan su',    icon: UserCog },
      { href: '/workflows',         label: 'Workflow',   icon: GitBranch },
      { href: '/admin/permissions', label: 'Phan quyen', icon: ShieldCheck },
    ],
  },
];

function NavItem({ href, label, icon: Icon, active }: { href: string; label: string; icon: typeof Activity; active: boolean }) {
  return (
    <Link href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group relative
        ${active
          ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgb(255_255_255/.1)]'
          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}>
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-400 rounded-r-full" />
      )}
      <Icon size={15} className={active ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'} />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

function NavGroup({ label, items, router }: { label: string; items: typeof navGroups[0]['items']; router: ReturnType<typeof useRouter> }) {
  const hasActive = items.some(i => router.pathname === i.href || (i.href !== '/dashboard' && router.pathname.startsWith(i.href)));
  const [collapsed, setCollapsed] = useLocalState(!hasActive && label !== 'Lam sang');

  return (
    <div>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-3 mb-1 group">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest group-hover:text-slate-400 transition-colors">{label}</span>
        <ChevronDown size={11} className={`text-slate-600 transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
      </button>
      {!collapsed && (
        <div className="space-y-0.5">
          {items.map(({ href, label: l, icon }) => (
            <NavItem key={href} href={href} label={l} icon={icon}
              active={router.pathname === href || (href !== '/dashboard' && router.pathname.startsWith(href))} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [open, setOpen] = useState(false);
  const { setOpen: openSearch } = useCommandStore();

  const handleLogout = () => { clearAuth(); router.push('/login'); };

  // Page title from current route
  const allItems = navGroups.flatMap(g => g.items);
  const currentItem = allItems.find(i => router.pathname === i.href || (i.href !== '/dashboard' && router.pathname.startsWith(i.href)));

  const sidebar = (
    <aside className="w-60 flex flex-col h-full" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0c1526 100%)' }}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 shrink-0 border-b border-white/5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-[0_0_12px_rgb(14_165_233/.4)]">
          <Activity size={15} className="text-white" />
        </div>
        <div>
          <span className="font-bold text-white text-sm tracking-wide">MedOS</span>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">Hospital System</p>
        </div>
        <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setOpen(false)}>
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3 pb-1 shrink-0">
        <button onClick={() => openSearch(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all text-xs">
          <Search size={13} />
          <span className="flex-1 text-left">Tim kiem...</span>
          <kbd className="text-[9px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-slate-600">⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {navGroups.map((group) => (
          <NavGroup key={group.label} label={group.label} items={group.items} router={router} />
        ))}
      </nav>

      {/* User footer — no notification bell here */}
      <div className="px-3 py-3 border-t border-white/5 shrink-0">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-300 text-xs w-full px-2 py-1.5 mt-0.5 rounded-xl hover:bg-white/5 transition-colors">
          <LogOut size={13} /> Dang xuat
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <div className="hidden lg:flex shrink-0">{sidebar}</div>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden">{sidebar}</div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar — desktop & mobile */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-3 shrink-0">
          {/* Mobile menu button */}
          <button onClick={() => setOpen(true)} className="btn-icon lg:hidden"><Menu size={20} /></button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Activity size={12} className="text-white" />
            </div>
            <span className="font-bold text-sm">MedOS</span>
          </div>

          {/* Page title — desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {currentItem && <currentItem.icon size={16} className="text-gray-400" />}
            <h1 className="text-sm font-semibold text-gray-700">{currentItem?.label || 'Dashboard'}</h1>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side: search + notification + user */}
          <div className="flex items-center gap-2">
            {/* Search shortcut — desktop */}
            <button onClick={() => openSearch(true)}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-xs">
              <Search size={13} />
              <span>Tim kiem</span>
              <kbd className="text-[9px] font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-500">⌘K</kbd>
            </button>

            {/* Notification Bell — TOP RIGHT */}
            <NotificationBell />

            {/* User avatar — desktop */}
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="hidden xl:block">
                <p className="text-xs font-semibold text-gray-700 leading-none">{user?.name}</p>
                <p className="text-[10px] text-gray-400 capitalize mt-0.5">{user?.role?.toLowerCase()}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
