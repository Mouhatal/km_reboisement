'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MapPin, Calendar, Package, DollarSign, Users, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, adminOnly: true },
  { href: '/ilots', label: 'Îlots', icon: MapPin },
  { href: '/activites', label: 'Activités', icon: Calendar },
  { href: '/logistique', label: 'Logistique', icon: Package },
  { href: '/finances', label: 'Finances', icon: DollarSign, adminOnly: true },
  { href: '/administration', label: 'Administration', icon: Users, adminOnly: true },
];

export function Navigation() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-green-800 text-white w-64 min-h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-green-700">
        <Link 
          href={profile?.role === 'administrateur' ? '/dashboard' : '/ilots'} 
          className="text-xl font-bold"
        >
          Reboisement
        </Link>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4">
        <div className="space-y-1 px-4">
          {navItems.map((item) => {
            if (item.adminOnly && profile?.role !== 'administrateur') {
              return null;
            }

            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-700 text-white'
                    : 'text-green-100 hover:bg-green-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Info & Logout */}
      <div className="border-t border-green-700 p-4">
        <div className="mb-4">
          <div className="text-sm font-medium">{profile?.full_name}</div>
          <div className="text-green-200 text-xs capitalize">{profile?.role}</div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center space-x-3 w-full px-3 py-3 rounded-md text-sm font-medium text-green-100 hover:bg-green-700 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span>Déconnexion</span>
        </button>
      </div>
    </nav>
  );
}
