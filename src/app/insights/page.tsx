"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { PieChart, RefreshCw, BarChart3, Info } from 'lucide-react';

const getBrandColor = (name: string) => {
  if (!name || typeof name !== 'string') return "#94a3b8";
  const presets: { [key: string]: string } = { "Shine": "#4F46E5", "Qonto": "#EC4899", "Revolut": "#06B6D4", "N26": "#10B981" };
  if (presets[name]) return presets[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 50%)`; 
};

export default function InsightsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState("Loading...");

  const fetchData = async () => {
    setLoading(true);
    const { data: settings } = await supabase.from('settings').select('brand').eq('id', 1).single();
    if (settings?.brand) setBrand(settings.brand);
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setHistory(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const latestReport = history[0] || null;

  const sovData = (() => {
    const counts: { [key: string]: number } = {};
    let total = 0;
    if (history.length === 0 || brand === "Loading...") return [];
    history.forEach(scan => {
      ['gpt', 'claude', 'gemini', 'perplexity'].forEach(m => {
        const modelData = scan.analysis_data?.[m] || {};
        const comps = modelData.competitors || [];
        comps.forEach((name: any) => { 
          if (name && typeof name === 'string') {
            const cleanName = name.trim();
            counts[cleanName] = (counts[cleanName] || 0) + 1; 
            total++; 
          }
        });
        if (modelData.is_mentioned) { 
          counts[brand] = (counts[brand] || 0) + 1; 
          total++; 
        }
      });
    });
    if (total === 0) return [];
    return Object.entries(counts).map(([name, count]) => ({ name, count, percentage: (count / total) * 100 })).sort((a, b) => b.count - a.count).slice(0, 8);
  })();

  const sentimentStats = (() => {
    const counts = { Positif: 0, Neutre: 0, Négatif: 0 };
    let total = 0;
    if (!latestReport) return { counts, total };
    ['gpt', 'claude', 'gemini', 'perplexity'].forEach(m => {
      let s = latestReport.analysis_data?.[m]?.sentiment || "Neutre";
      if (typeof s !== 'string') s = "Neutre";
      const fmt = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      if (Object.prototype.hasOwnProperty.call(counts, fmt)) { 
        counts[fmt as keyof typeof counts]++; 
        total++; 
      }
    });
    return { counts, total };
  })();

  const renderDonut = () => {
    let currentAngle = 0;
    if (sovData.length === 0) return (
      <svg viewBox="0 0 100 100" className="w-48 h-48"><circle cx="50" cy="50" r="40" fill="#F8FAFC" /></svg>
    );
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
          return <path key={i} d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={getBrandColor(item.name)} stroke="white" strokeWidth="1" />;
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
        <button onClick={fetchData} className="bg-white p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm transition-all active:scale-95">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex flex-col md:flex-row items-center justify-around gap-8">
            <div className="relative">{renderDonut()}</div>
            <div className="flex-grow max-w-md w-full space-y-3">
              {sovData.map((item) => (
                <div key={item.name} className="flex flex-col gap-1 text-left">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: getBrandColor(item.name) }}>{item.name}</span>
                    <span className="text-[10px] font-black text-slate-400">{Math.round(item.percentage)}%</span>
                  </div>
                  <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-1000" style={{ width: `${item.percentage}%`, backgroundColor: getBrandColor(item.name) }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4 text-left">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100">
            <p className="text-[11px] leading-relaxed font-medium">
              {brand} visibility is currently <b>{Math.round(sovData.find(s => s.name === brand)?.percentage || 0)}%</b>. 
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}