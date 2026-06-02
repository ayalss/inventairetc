import React from 'react';
import { Department } from '../types';
import { useTranslation } from 'react-i18next';
import * as LucideIcons from 'lucide-react';
import { Network, Coins, Users, Cpu, Truck, Briefcase, Camera, Heart, Settings, FileSpreadsheet, ShieldAlert, Globe2, Smartphone } from 'lucide-react';

interface SidebarProps {
  departments: Department[];
  selectedDeptId: string;
  onSelectDept: (id: string) => void;
  selectedUtility: 'portal' | 'scanner' | 'management' | 'reports' | 'puce_reports';
  onSelectUtility: (utility: 'portal' | 'scanner' | 'management' | 'reports' | 'puce_reports') => void;
}

export default function Sidebar({
  departments,
  selectedDeptId,
  onSelectDept,
  selectedUtility,
  onSelectUtility
}: SidebarProps) {
  const { t } = useTranslation();
  
  // Resolve Lucide Icon component dynamically based on string
  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Network': return <Network className={className} />;
      case 'Coins': return <Coins className={className} />;
      case 'Users': return <Users className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Truck': return <Truck className={className} />;
      default: return <Briefcase className={className} />;
    }
  };

  return (
    <aside className="w-full md:w-64 bg-white text-[#424245] flex flex-col h-150 md:h-screen sticky top-0 shrink-0 border-r border-[#D2D2D7]">
      
      {/* BRAND HEADER */}
      <div className="p-5 border-b border-[#F5F5F7] flex flex-col gap-3 bg-linear-to-b from-slate-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0 flex items-center justify-center">

          </div>
          <div>
            <h1 className="text-[10px] font-black text-[#1D1D1F] tracking-[0.16em] uppercase leading-none font-display">
              TECHNOCERAM
            </h1>
            <span className="text-xs text-[#FF1E1E] uppercase tracking-[0.24em] mt-1 block leading-none font-sans font-semibold">
              LUXETILE
            </span>
          </div>
        </div>
        <div className="text-[9px] text-[#86868B] font-semibold tracking-wider bg-slate-100 rounded-md px-2 py-0.5 self-start uppercase">
          Enterprise Services Assets
        </div>
      </div>

      {/* CORE UTILITIES / WORKSPACE SECTOR */}
      <div className="p-4 space-y-1 select-none">
        <span className="px-3 text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block mb-2">
          {t('utilities')}
        </span>

        {/* 1. Barcode Scanner tab */}
        <button
          onClick={() => onSelectUtility('scanner')}
          className={`w-full py-2 px-3 rounded-md text-sm font-medium tracking-wide transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
            selectedUtility === 'scanner'
              ? 'bg-[#FF1E1E]/8 text-[#FF1E1E] font-semibold border border-[#FF1E1E]/15 shadow-sm'
              : 'hover:bg-[#F5F5F7] text-[#424245] border border-transparent hover:text-[#1D1D1F]'
          }`}
        >
          <Camera className={`w-4 h-4 shrink-0 ${selectedUtility === 'scanner' ? 'text-[#FF1E1E]' : 'text-[#86868B]'}`} />
          <span>{t('qr_scanner')}</span>
        </button>

        {/* 2. Management & User tools */}
        <button
          onClick={() => onSelectUtility('management')}
          className={`w-full py-2 px-3 rounded-md text-sm font-medium tracking-wide transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
            selectedUtility === 'management'
              ? 'bg-[#FF1E1E]/8 text-[#FF1E1E] font-semibold border border-[#FF1E1E]/15 shadow-sm'
              : 'hover:bg-[#F5F5F7] text-[#424245] border border-transparent hover:text-[#1D1D1F]'
          }`}
        >
          <Settings className={`w-4 h-4 shrink-0 ${selectedUtility === 'management' ? 'text-[#FF1E1E]' : 'text-[#86868B]'}`} />
          <span>{t('user_infrastructure')}</span>
        </button>

        {/* 3. Reports Tab */}
        <button
          onClick={() => onSelectUtility('reports')}
          className={`w-full py-2 px-3 rounded-md text-sm font-medium tracking-wide transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
            selectedUtility === 'reports'
              ? 'bg-[#FF1E1E]/8 text-[#FF1E1E] font-semibold border border-[#FF1E1E]/15 shadow-sm'
              : 'hover:bg-[#F5F5F7] text-[#424245] border border-transparent hover:text-[#1D1D1F]'
          }`}
        >
          <FileSpreadsheet className={`w-4 h-4 shrink-0 ${selectedUtility === 'reports' ? 'text-[#FF1E1E]' : 'text-[#86868B]'}`} />
          <span>{t('inventory_reports')}</span>
        </button>

        {/* 4. Puce Reports Tab */}
        <button
          onClick={() => onSelectUtility('puce_reports')}
          className={`w-full py-2 px-3 rounded-md text-sm font-medium tracking-wide transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
            selectedUtility === 'puce_reports'
              ? 'bg-[#FF1E1E]/8 text-[#FF1E1E] font-semibold border border-[#FF1E1E]/15 shadow-sm'
              : 'hover:bg-[#F5F5F7] text-[#424245] border border-transparent hover:text-[#1D1D1F]'
          }`}
        >
          <Smartphone className={`w-4 h-4 shrink-0 ${selectedUtility === 'puce_reports' ? 'text-[#FF1E1E]' : 'text-[#86868B]'}`} />
          <span>{t('puce_reports')}</span>
        </button>
      </div>

      {/* COMPARTMENTS CATEGORIES SECTOR */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider block">
            {t('departments')}
          </span>
          <span className="text-[9px] bg-[#F5F5F7] text-[#86868B] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
            {t('active')}
          </span>
        </div>

        {departments.map((dept) => {
          const isSelected = selectedUtility === 'portal' && selectedDeptId === dept.id;
          return (
            <button
              key={dept.id}
              onClick={() => {
                onSelectDept(dept.id);
                onSelectUtility('portal');
              }}
              className={`w-full py-2 px-3 rounded-md text-sm font-medium tracking-wide transition-all duration-150 flex items-center justify-between text-left cursor-pointer ${
                isSelected
                  ? 'bg-[#FF1E1E]/8 text-[#FF1E1E] font-semibold border border-[#FF1E1E]/15 shadow-sm'
                  : 'hover:bg-[#F5F5F7] text-[#424245] border border-transparent hover:text-[#1D1D1F]'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                {renderIcon(dept.icon, `w-4 h-4 shrink-0 ${isSelected ? 'text-[#FF1E1E]' : 'text-[#86868B]'}`)}
                <span className="truncate">{dept.name}</span>
              </div>
              <span className={`text-[10px] font-mono leading-none px-1.5 py-0.5 rounded ${
                isSelected ? 'bg-[#FF1E1E]/12 text-[#FF1E1E] font-bold' : 'bg-[#F5F5F7] text-[#86868B]'
              }`}>
                {dept.deptNum}
              </span>
            </button>
          );
        })}

        {departments.length === 0 && (
          <div className="p-3 text-center border border-dashed border-[#D2D2D7]/60 rounded-xl mt-2 bg-[#F5F5F7]/30">
            <p className="text-[11px] text-[#86868B] leading-relaxed">
              {t('no_custom_departments')}
            </p>
          </div>
        )}
      </div>

      {/* FOOTER METADATA */}
      <div className="p-4 border-t border-[#F5F5F7] bg-[#F5F5F7]/40 text-[10px] space-y-1 text-[#86868B] select-none">
        <div className="flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5 text-[#86868B]" />
          <span className="font-semibold text-[#424245]">{t('enterprise_asset_sync')}</span>
        </div>
        <p className="leading-relaxed">TECHNOCERAM, LUXETILE, PORCELENDA Group Services.</p>
      </div>

    </aside>
  );
}
