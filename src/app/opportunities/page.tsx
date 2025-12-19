"use client";

import { useState, useEffect } from 'react';
// On garde l'importation centralisée
import { supabase } from '@/lib/supabase'; 
import { Award, PieChart, RefreshCw, BarChart3, Info } from 'lucide-react';

// ❌ J'AI SUPPRIMÉ LE BLOC "const supabase = createClient(...)" QUI ÉTAIT ICI
// Car il faisait doublon avec l'importation au-dessus.

export default function OpportunitiesPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const brand = "Shine";

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(20);
    if (data) setHistory(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIQUE DE DÉTECTION D'OPPORTUNITÉS ---
  const calculateOpportunities = () => {
    const opps: { [key: string]: { keyword: string, competitionStrength: number, ourPresence: boolean } } = {};
    
    history.forEach(scan => {
      const keyword = scan.keyword || "General Query";
      let isBrandMentioned = false;
      let competitorCount = 0;

      ['gpt', 'claude', 'gemini', 'perplexity'].forEach(m => {
        if (scan.analysis_data?.[m]?.is_mentioned) isBrandMentioned = true;
        competitorCount += (scan.analysis_data?.[m]?.competitors?.length || 0);
      });

      if (!opps[keyword]) {
        opps[keyword] = { keyword, competitionStrength: competitorCount, ourPresence: isBrandMentioned };
      }
    });

    return Object.values(opps)
      .filter(o => !o.ourPresence) // On ne garde que là où on est absent
      .sort((a, b) => b.competitionStrength - a.competitionStrength);
  };

  const opportunities = calculateOpportunities();

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <header className="flex justify-between items-center mb-6 text-left">
        <div>
          <h1 className="text-xl font-black text-slate-900 italic tracking-tight">Opportunity Gap</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identify where competitors dominate</p>
        </div>
        <button onClick={fetchData} className="bg-white p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm transition-all">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* TOP ALERT BOX */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><AlertCircle size={20}/></div>
          <div>
            <h3 className="text-sm font-black text-amber-800 uppercase tracking-tight mb-1 italic text-left">Critical Insight</h3>
            <p className="text-xs text-amber-700 leading-relaxed text-left font-medium">
              We detected <b>{opportunities.length} high-value keywords</b> where your competitors are consistently cited by AI engines, but <b>{brand}</b> is missing. 
            </p>
          </div>
        </div>

        {/* LISTE DES OPPORTUNITÉS */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-left">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-left">
                    <Sparkles className="text-indigo-600" size={16} />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Actions</h3>
                </div>
            </div>
            
            <div className="divide-y divide-slate-50">
                {opportunities.map((opp, idx) => (
                    <div key={idx} className="p-6 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-6">
                            <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black italic text-xs">
                                #{idx + 1}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-800 mb-1 italic tracking-tight">"{opp.keyword}"</p>
                                <div className="flex items-center gap-4">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Target size={10}/> Competition: {opp.competitionStrength} mentions
                                    </span>
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest px-2 py-0.5 bg-rose-50 rounded">Your Presence: 0%</span>
                                </div>
                            </div>
                        </div>
                        <button className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                            Boost Visibility <ArrowUpRight size={14}/>
                        </button>
                    </div>
                ))}

                {opportunities.length === 0 && (
                    <div className="p-20 text-center">
                        <p className="text-xs text-slate-400 italic">No major gaps detected. You are currently visible on all tracked keywords.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}