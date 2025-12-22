"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { 
  Target, 
  ArrowUpRight, 
  RefreshCw, 
  Sparkles, 
  AlertCircle,
  Users
} from 'lucide-react';

export default function OpportunitiesPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState("Loading...");

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Récupération de la marque configurée
    const { data: settings } = await supabase.from('settings').select('brand').eq('id', 1).single();
    if (settings?.brand) {
      setBrand(settings.brand);
    }

    // 2. Récupération des derniers rapports (on élargit à 50 pour avoir plus de données)
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setHistory(data);
    
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIQUE DE DÉTECTION D'OPPORTUNITÉS ---
  const calculateOpportunities = () => {
    // Structure pour regrouper les données par mot-clé
    const opps: { [key: string]: { 
      keyword: string, 
      competitionStrength: number, 
      ourPresence: boolean,
      dominatingCompetitors: string[] 
    } } = {};
    
    if (history.length === 0 || brand === "Loading...") return [];

    history.forEach(scan => {
      const keyword = scan.keyword || "General Query";
      let isBrandMentioned = false;
      const competitorsSet = new Set<string>();

      ['gpt', 'claude', 'gemini', 'perplexity'].forEach(m => {
        const modelData = scan.analysis_data?.[m] || {};
        
        // Vérification de présence de la marque
        if (modelData.is_mentioned === true) isBrandMentioned = true;
        
        // Identification des concurrents dominants
        if (modelData.competitors && Array.isArray(modelData.competitors)) {
          modelData.competitors.forEach((c: any) => {
            if (typeof c === 'string' && c.trim() !== "") {
              competitorsSet.add(c.trim());
            }
          });
        }
      });

      // On n'enregistre que si le mot-clé présente un intérêt (concurrents présents)
      if (!opps[keyword]) {
        opps[keyword] = { 
          keyword, 
          competitionStrength: competitorsSet.size, 
          ourPresence: isBrandMentioned,
          dominatingCompetitors: Array.from(competitorsSet).slice(0, 5) // Top 5
        };
      } else {
        // Si le mot-clé apparaît plusieurs fois, on met à jour la présence
        if (isBrandMentioned) opps[keyword].ourPresence = true;
      }
    });

    // On ne garde que les "Gaps" : là où les concurrents sont cités mais pas nous
    return Object.values(opps)
      .filter(o => !o.ourPresence && o.competitionStrength > 0)
      .sort((a, b) => b.competitionStrength - a.competitionStrength);
  };

  const opportunities = calculateOpportunities();

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <header className="flex justify-between items-center mb-6 text-left">
        <div>
          <h1 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Opportunity Gap</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identify where competitors dominate</p>
        </div>
        <button onClick={fetchData} className="bg-white p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm transition-all active:scale-95">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* TOP ALERT BOX */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
            <AlertCircle size={20}/>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black text-amber-800 uppercase tracking-tight mb-1 italic">Critical Insight</h3>
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              We detected <b>{opportunities.length} high-value keywords</b> where your competitors are consistently cited by AI engines, but <b>{brand}</b> is missing. 
            </p>
          </div>
        </div>

        {/* LISTE DES OPPORTUNITÉS */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-indigo-600" size={16} />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Actions</h3>
                </div>
            </div>
            
            <div className="divide-y divide-slate-50">
                {opportunities.map((opp, idx) => (
                    <div key={idx} className="p-6 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between group gap-4">
                        <div className="flex items-start gap-6">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black italic text-xs">
                                #{idx + 1}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-800 mb-2 italic tracking-tight">"{opp.keyword}"</p>
                                
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                        <Target size={10}/> {opp.competitionStrength} competitors cited
                                    </span>
                                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest px-2 py-1 bg-rose-50 rounded">Your Presence: 0%</span>
                                </div>

                                {/* Liste des concurrents qui dominent ce mot-clé */}
                                <div className="mt-3 flex items-center gap-2">
                                  <Users size={10} className="text-slate-300"/>
                                  <div className="flex flex-wrap gap-1">
                                    {opp.dominatingCompetitors.map(comp => (
                                      <span key={comp} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                        {comp}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                            </div>
                        </div>
                        <button className="flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest md:opacity-0 group-hover:opacity-100 transition-all bg-indigo-50 md:bg-transparent py-2 md:py-0 rounded-lg">
                            Boost Visibility <ArrowUpRight size={14}/>
                        </button>
                    </div>
                ))}

                {opportunities.length === 0 && !loading && (
                    <div className="p-20 text-center">
                        <p className="text-xs text-slate-400 italic">No major gaps detected. You are currently visible on all tracked keywords or no data is available.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}