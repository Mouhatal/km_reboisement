'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MapPin, Calendar, Package, DollarSign, Users, LogOut } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/ilots', label: 'Îlots', icon: MapPin },
  { href: '/activites', label: 'Activités', icon: Calendar },
  { href: '/logistique', label: 'Logistique', icon: Package },
  { href: '/finances', label: 'Finances', icon: DollarSign },
  { href: '/administration', label: 'Administration', icon: Users, adminOnly: true },
];

export function Navigation() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="bg-green-800 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              Reboisement
            </Link>

            <div className="hidden md:flex space-x-1">
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
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-green-700 text-white'
                        : 'text-green-100 hover:bg-green-700 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <div className="font-medium">{profile?.full_name}</div>
              <div className="text-green-200 text-xs capitalize">{profile?.role}</div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-green-100 hover:bg-green-700 hover:text-white transition-colors"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
