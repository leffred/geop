"use client";

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  TrendingUp, 
  Share2, 
  Settings as SettingsIcon, 
  Lightbulb // Import de l'icône pour Opportunities
} from 'lucide-react';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const NavItem = ({ icon, label, path }: any) => {
    const active = pathname === path;
    return (
      <div 
        onClick={() => router.push(path)}
        className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
          active ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm' : 'text-slate-400 hover:bg-slate-50'
        }`}
      >
        {icon} <span className="text-sm tracking-tight">{label}</span>
      </div>
    );
  };

  return (
    <html lang="fr">
      <body className="antialiased bg-[#F3F5F9]">
        <div className="min-h-screen flex">
          {/* SIDEBAR FIXE */}
          <aside className="w-64 bg-white border-r border-slate-200 p-6 hidden lg:flex flex-col fixed h-full z-20 text-left">
            <div className="flex items-center gap-3 mb-10">
              <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shadow-indigo-100 text-xl">G</div>
              <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">GetGeop</span>
            </div>
            
            <nav className="space-y-1 flex-grow">
              <NavItem icon={<LayoutGrid size={18}/>} label="Overview" path="/" />
              <NavItem icon={<TrendingUp size={18}/>} label="Market Insights" path="/insights" />
              <NavItem icon={<Share2 size={18}/>} label="Sources Flow" path="/sources" />
              
              {/* NOUVELLE LIGNE AJOUTÉE ICI */}
              <NavItem icon={<Lightbulb size={18}/>} label="Opportunities" path="/opportunities" />
              
              <div className="pt-10 pb-4 text-[10px] font-black text-slate-300 uppercase tracking-widest px-4 text-left">Admin</div>
              <NavItem icon={<SettingsIcon size={18}/>} label="Settings" path="/settings" />
            </nav>

            <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase">Engine Live</span>
                </div>
            </div>
          </aside>

          {/* CONTENU DE LA PAGE */}
          <main className="flex-1 lg:ml-64 p-8 overflow-x-hidden relative min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}