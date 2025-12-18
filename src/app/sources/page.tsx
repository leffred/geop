"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Link2, ExternalLink, RefreshCw, Globe, MessageSquare, ArrowUpRight } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const getBrandColor = (name: string) => {
  const presets: { [key: string]: string } = { "gpt": "#10a37f", "claude": "#d97757", "gemini": "#4285f4", "perplexity": "#20b2aa" };
  return presets[name.toLowerCase()] || "#94a3b8";
};

export default function SourcesFlowPage() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(1);
    if (data?.[0]) setReport(data[0]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const citationsData = (() => {
    if (!report?.analysis_data) return [];
    const map: { [key: string]: { count: number, reason: string, models: string[] } } = {};
    
    ['gpt', 'claude', 'gemini', 'perplexity'].forEach(model => {
      const data = report.analysis_data[model];
      if (!data) return;
      const raw = data.citations || data.sources || [];
      raw.forEach((s: any) => {
        const url = typeof s === 'string' ? s : (s.site || s.url || "");
        const domain = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
        if (!domain) return;
        if (!map[domain]) map[domain] = { count: 0, reason: (typeof s === 'object' && s.reason) ? s.reason : (data.reasoning || "Authority source"), models: [] };
        map[domain].count++;
        if (!map[domain].models.includes(model)) map[domain].models.push(model);
      });
    });
    return Object.entries(map).map(([site, d]) => ({ site, ...d })).sort((a, b) => b.count - a.count);
  })();

  return (
    <div className="animate-in fade-in duration-500 text-left">
      {/* Header Compact */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 italic tracking-tight">Sources Flow</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generative Citations Audit</p>
        </div>
        <button onClick={fetchData} className="bg-white p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Stats Ultra-Condensées */}
        {[
          { label: "Unique Domains", value: citationsData.length, color: "text-slate-900" },
          { label: "Total Mentions", value: citationsData.reduce((a, b) => a + b.count, 0), color: "text-slate-900" },
          { label: "Primary Engine", value: "Perplexity", color: "text-indigo-600" },
          { label: "Top Domain", value: citationsData[0]?.site || "None", color: "text-indigo-600 truncate" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`text-lg font-black italic ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tableau Compact Style "Logs" */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Domain Authority</th>
              <th className="py-3 px-2 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Weight</th>
              <th className="py-3 px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Engines</th>
              <th className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Context / Reason</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {citationsData.map((cit, idx) => (
              <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                <td className="py-2 px-4">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <Globe size={12} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 tracking-tight">{cit.site}</span>
                  </div>
                </td>
                <td className="py-2 px-2 text-center">
                  <span className="text-[9px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {cit.count}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <div className="flex gap-1">
                    {cit.models.map(m => (
                      <div 
                        key={m} 
                        className="h-1.5 w-1.5 rounded-full" 
                        title={m}
                        style={{ backgroundColor: getBrandColor(m) }}
                      ></div>
                    ))}
                  </div>
                </td>
                <td className="py-2 px-4">
                  <p className="text-[10px] text-slate-400 italic line-clamp-1 leading-tight">
                    {cit.reason}
                  </p>
                </td>
                <td className="py-2 px-4 text-right">
                  <a href={`https://${cit.site}`} target="_blank" className="text-slate-200 hover:text-indigo-600 transition-colors">
                    <ArrowUpRight size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}