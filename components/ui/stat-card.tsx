import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  iconColor: string;
}

export function StatCard({ title, value, description, icon: Icon, bgColor, textColor, iconColor }: StatCardProps) {
  return (
    <div className={`p-6 rounded-lg shadow-sm ${bgColor} ${textColor}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <Icon size={24} className={iconColor} />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {description && <p className="text-xs mt-1">{description}</p>}
    </div>
  );
}