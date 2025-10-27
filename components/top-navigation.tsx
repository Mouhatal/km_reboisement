'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, MapPin, Calendar, Package, DollarSign, Users, LogOut, Menu, X } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, adminOnly: true },
  { href: '/ilots', label: 'Îlots', icon: MapPin },
  { href: '/activites', label: 'Activités', icon: Calendar },
  { href: '/logistique', label: 'Logistique', icon: Package },
  { href: '/finances', label: 'Finances', icon: DollarSign, adminOnly: true },
  { href: '/administration', label: 'Administration', icon: Users, adminOnly: true },
];

export function TopNavigation() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-green-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center">
            <Link
              href={profile?.role === 'administrateur' ? '/dashboard' : '/ilots'}
              className="text-xl font-bold"
            >
              Reboisement
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => {
                if (item.adminOnly && profile?.role !== 'administrateur') {
                  return null;
                }
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-green-700 text-white'
                        : 'text-green-100 hover:bg-green-700 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Info & Logout (Desktop) */}
          <div className="hidden lg:flex items-center ml-auto space-x-4">
            <div className="text-sm text-right">
              <div className="font-medium truncate">{profile?.full_name}</div>
              <div className="text-green-200 text-xs capitalize">{profile?.role}</div>
            </div>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-green-100 hover:bg-green-700 hover:text-white transition-colors"
            >
              <LogOut size={20} />
              <span>Déconnexion</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-green-100 hover:text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <X size={24} aria-hidden="true" />
              ) : (
                <Menu size={24} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {isMobileMenuOpen && (
        <div className="lg:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              if (item.adminOnly && profile?.role !== 'administrateur') {
                return null;
              }
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 block px-3 py-2 rounded-md text-base font-medium transition-colors ${
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
          <div className="border-t border-green-700 pt-4 pb-3">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                {/* Placeholder for user avatar if needed */}
                <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm">
                  {profile?.full_name ? profile.full_name[0].toUpperCase() : '?'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium leading-none text-white">{profile?.full_name}</div>
                <div className="text-sm font-medium leading-none text-green-200 capitalize">{profile?.role}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={() => {
                  signOut();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 block w-full text-left px-3 py-2 rounded-md text-base font-medium text-green-100 hover:text-white hover:bg-green-700 transition-colors"
              >
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}