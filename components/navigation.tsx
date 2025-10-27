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

export function Navigation() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-green-800 text-white px-3 py-2 sm:px-4 sm:py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <Link 
          href={profile?.role === 'administrateur' ? '/dashboard' : '/ilots'} 
          className="text-sm sm:text-base md:text-lg font-bold truncate max-w-[200px] sm:max-w-none"
        >
          Reboisement
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 sm:p-2 hover:bg-green-700 rounded-md transition-colors flex-shrink-0"
          aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {isMobileMenuOpen ? <X size={20} className="sm:hidden" /> : <Menu size={20} className="sm:hidden" />}
          {isMobileMenuOpen ? <X size={24} className="hidden sm:block" /> : <Menu size={24} className="hidden sm:block" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`bg-green-800 text-white w-64 sm:w-72 lg:w-64 min-h-screen flex flex-col fixed lg:static z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Desktop Header */}
        <div className="hidden lg:block p-4 lg:p-6 border-b border-green-700">
          <Link 
            href={profile?.role === 'administrateur' ? '/dashboard' : '/ilots'} 
            className="text-lg lg:text-xl font-bold"
          >
            Reboisement
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-3 lg:py-4 overflow-y-auto">
          <div className="space-y-1 px-3 lg:px-4">
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
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 lg:space-x-3 px-2 lg:px-3 py-2 lg:py-3 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-700 text-white'
                      : 'text-green-100 hover:bg-green-700 hover:text-white'
                  }`}
                >
                  <Icon size={16} className="lg:hidden" />
                  <Icon size={20} className="hidden lg:block" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="border-t border-green-700 p-3 lg:p-4 flex-shrink-0">
          <div className="mb-3 lg:mb-4">
            <div className="text-xs lg:text-sm font-medium truncate">{profile?.full_name}</div>
            <div className="text-green-200 text-xs capitalize">{profile?.role}</div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center space-x-2 lg:space-x-3 w-full px-2 lg:px-3 py-2 lg:py-3 rounded-md text-xs lg:text-sm font-medium text-green-100 hover:bg-green-700 hover:text-white transition-colors"
          >
            <LogOut size={16} className="lg:hidden" />
            <LogOut size={20} className="hidden lg:block" />
            <span className="truncate">Déconnexion</span>
          </button>
        </div>
      </nav>
    </>
  );
}
