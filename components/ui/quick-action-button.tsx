import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  bgColor: string;
  textColor: string;
}

export function QuickActionButton({ label, icon: Icon, onClick, bgColor, textColor }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-sm transition-all duration-200 ease-in-out
        ${bgColor} ${textColor} hover:shadow-md hover:scale-105`}
    >
      <Icon size={32} className="mb-2" />
      <span className="text-sm font-medium text-center">{label}</span>
    </button>
  );
}