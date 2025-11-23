'use client';

import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  Users,
  LogOut,
  Menu,
  X,
  Trees,
} from 'lucide-react';

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      <nav className="bg-green-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Titre */}
            <div className="flex items-center space-x-2">
              <Trees size={28} />
              <Link
                href={profile?.role === 'administrateur' ? '/dashboard' : '/ilots'}
                className="text-xl font-bold"
              >
                EcoTracker
              </Link>
            </div>

            {/* Liens Desktop */}
            <div className="hidden lg:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => {
                  if (item.adminOnly && profile?.role !== 'administrateur') return null;
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

            {/* Info utilisateur + Déconnexion (Desktop) */}
            <div className="hidden lg:flex items-center ml-auto space-x-4">
              <div className="text-sm text-right">
                <div className="font-medium truncate">{profile?.full_name}</div>
                <div className="text-green-200 text-xs capitalize">{profile?.role}</div>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-green-100 hover:bg-green-700 hover:text-white transition-colors"
              >
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </div>

            {/* Menu mobile */}
            <div className="-mr-2 flex lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-green-100 hover:text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-800 focus:ring-white"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden" id="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navItems.map((item) => {
                if (item.adminOnly && profile?.role !== 'administrateur') return null;
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
                  onClick={() => setShowLogoutConfirm(true)}
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

      {/* Fenêtre de déconnexion améliorée */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-100 shadow-xl">
            {/* Titre avec logo */}
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Trees size={32} className="text-green-700" />
              <h2 className="text-2xl font-bold text-green-800">EcoTracker</h2>
            </div>

            {/* Texte de confirmation */}
            <p className="text-gray-700 text-center mb-6">
              Êtes vous sûre de vouloir vous déconnecter ?.
            </p>

         
            {/* Boutons */}
<div className="flex justify-between">
  <button
    onClick={() => setShowLogoutConfirm(false)}
    className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
  >
    Annuler
  </button>
  <button
    onClick={() => {
      signOut();
      setShowLogoutConfirm(false);
    }}
    className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
  >
    Déconnexion
  </button>
</div>

          </div>
        </div>
      )}
    </>
  );
}
