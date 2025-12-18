"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Award, PieChart, RefreshCw, BarChart3, Info } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const getBrandColor = (name: string) => {
  const presets: { [key: string]: string } = { "Shine": "#4F46E5", "Qonto": "#EC4899", "Revolut": "#06B6D4", "N26": "#10B981" };
  if (presets[name]) return presets[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 50%)`; 
};

export default function InsightsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const brand = "Shine";

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setHistory(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const latestReport = history[0] || null;

  // --- LOGIQUE SOV (Basée sur l'historique pour lisser les parts de voix) ---
  const sovData = (() => {
    const counts: { [key: string]: number } = {};
    let total = 0;
    history.forEach(scan => {
      ['gpt', 'claude', 'gemini', 'perplexity'].forEach(m => {
        const comps = scan.analysis_data?.[m]?.competitors || [];
        comps.forEach((name: string) => { counts[name.trim()] = (counts[name.trim()] || 0) + 1; total++; });
        if (scan.analysis_data?.[m]?.is_mentioned) { counts[brand] = (counts[brand] || 0) + 1; total++; }
      });
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count, percentage: (count / total) * 100 })).sort((a, b) => b.count - a.count).slice(0, 8);
  })();

  // --- LOGIQUE SENTIMENT (Corrigée pour utiliser les données réelles du dernier scan) ---
  const sentimentStats = (() => {
    const counts = { Positif: 0, Neutre: 0, Négatif: 0 };
    let total = 0;
    
    if (!latestReport) return { counts, total };

    ['gpt', 'claude', 'gemini', 'perplexity'].forEach(m => {
      const s = latestReport.analysis_data?.[m]?.sentiment || "Neutre";
      const fmt = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      if (counts.hasOwnProperty(fmt)) { 
        counts[fmt as keyof typeof counts]++; 
        total++; 
      }
    });
    return { counts, total };
  })();

  const renderDonut = () => {
    let currentAngle = 0;
    if (sovData.length === 0) return <circle cx="50" cy="50" r="40" fill="#F8FAFC" />;
    return (
      <svg viewBox="0 0 100 100" className="w-48 h-48 transform -rotate-90">
        {sovData.map((item, i) => {
          const sliceAngle = (item.percentage / 100) * 360;
          const x1 = 50 + 40 * Math.cos((Math.PI * currentAngle) / 180);
          const y1 = 50 + 40 * Math.sin((Math.PI * currentAngle) / 180);
          currentAngle += sliceAngle;
          const x2 = 50 + 40 * Math.cos((Math.PI * currentAngle) / 180);
          const y2 = 50 + 40 * Math.sin((Math.PI * currentAngle) / 180);
          const largeArc = sliceAngle > 180 ? 1 : 0;
          return (
            <path key={i} d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={getBrandColor(item.name)} stroke="white" strokeWidth="1" />
          );
        })}
        <circle cx="50" cy="50" r="28" fill="white" />
      </svg>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 italic tracking-tight">Market Insights</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SOV & Sentiment Analysis</p>
        </div>
        <button onClick={fetchData} className="bg-white p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Share of Voice Section */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="text-indigo-600" size={16} />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Share of Voice (Latest Analysis)</h3>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="relative">
                {renderDonut()}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <p className="text-[8px] font-black text-slate-300 uppercase leading-none">Market</p>
                    <p className="text-sm font-black text-slate-900 italic">SOV</p>
                </div>
            </div>

            <div className="flex-grow max-w-md w-full space-y-3">
              {sovData.length > 0 ? sovData.map((item) => (
                <div key={item.name} className="flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: getBrandColor(item.name) }}>{item.name}</span>
                    <span className="text-[10px] font-black text-slate-400">{Math.round(item.percentage)}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ width: `${item.percentage}%`, backgroundColor: getBrandColor(item.name) }}></div>
                  </div>
                </div>
              )) : <p className="text-xs text-slate-300 italic">Awaiting data...</p>}
            </div>
          </div>
        </div>

        {/* Sentiment Section - BUG FIXÉ ICI */}
        <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-left">
                <div className="flex items-center gap-2 mb-6">
                    <BarChart3 className="text-indigo-600" size={16} />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reputation Flow</h3>
                </div>
                <div className="space-y-5">
                    {['Positif', 'Neutre', 'Négatif'].map((label) => {
                        const count = sentimentStats.counts[label as keyof typeof sentimentStats.counts];
                        const pct = sentimentStats.total > 0 ? Math.round((count / sentimentStats.total) * 100) : 0;
                        const color = label === 'Positif' ? 'bg-emerald-500' : label === 'Négatif' ? 'bg-red-400' : 'bg-slate-300';
                        return (
                            <div key={label}>
                                <div className="flex justify-between text-[9px] font-black uppercase mb-1.5">
                                    <span className="text-slate-500">{label}</span>
                                    <span className="text-slate-400">{pct}%</span>
                                </div>
                                <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-700 ${color}`} 
                                      style={{ width: `${pct}%` }} // Utilisation de la variable dynamique au lieu du 75% fixe
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 text-left">
                <div className="flex items-center gap-2 mb-3 text-left">
                    <Info size={14} className="text-indigo-200" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-100">AI Quick Insight</h3>
                </div>
                <p className="text-[11px] leading-relaxed font-medium">
                    {brand} visibility is currently <b>{Math.round(sovData.find(s => s.name === brand)?.percentage || 0)}%</b>. 
                    The overall sentiment across 4 models is primarily <b>{sentimentStats.counts.Positif >= sentimentStats.counts.Neutre ? 'Positive' : 'Neutral'}</b>.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}