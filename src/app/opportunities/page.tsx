"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { 
  Target, 
  ArrowUpRight, 
  RefreshCw, 
  Sparkles, 
  AlertCircle,
  Users,
  ShieldAlert
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

    // 2. Récupération des rapports (on monte à 50 pour une analyse plus fine)
    const { data } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setHistory(data);
    
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIQUE DE DÉTECTION D'OPPORTUNITÉS (LOGIQUE DE CONSENSUS) ---
  const calculateOpportunities = () => {
    const opps: { [key: string]: { 
      keyword: string, 
      competitionStrength: number, 
      mentionCount: number,
      dominatingCompetitors: string[] 
    } } = {};
    
    if (history.length === 0 || brand === "Loading...") return [];

    history.forEach(scan => {
      const keyword = scan.keyword || "Requête sans nom";
      let mentionCount = 0;
      const competitorsSet = new Set<string>();

      ['gpt', 'claude', 'gemini', 'perplexity'].forEach(m => {
        const modelData = scan.analysis_data?.[m] || {};
        
        // On compte combien de modèles citent la marque
        if (modelData.is_mentioned === true) {
          mentionCount++;
        }
        
        // Collecte des concurrents qui prennent la place
        if (modelData.competitors && Array.isArray(modelData.competitors)) {
          modelData.competitors.forEach((c: any) => {
            if (typeof c === 'string' && c.trim() !== "") {
              competitorsSet.add(c.trim());
            }
          });
        }
      });

      if (!opps[keyword]) {
        opps[keyword] = { 
          keyword, 
          competitionStrength: competitorsSet.size, 
          mentionCount: mentionCount,
          dominatingCompetitors: Array.from(competitorsSet).slice(0, 5)
        };
      } else {
        // On garde le score de mention le plus récent ou le plus bas
        opps[keyword].mentionCount = Math.min(opps[keyword].mentionCount, mentionCount);
      }
    });

    // CRITÈRE DE GAP : 
    // Un mot-clé est une opportunité si moins de 50% des modèles (2/4) citent la marque
    // ET qu'il y a au moins un concurrent cité (donc de la place pour du GEO).
    return Object.values(opps)
      .filter(o => o.mentionCount < 2 && o.competitionStrength > 0)
      .sort((a, b) => b.competitionStrength - a.competitionStrength);
  };

  const opportunities = calculateOpportunities();

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Opportunity Gap</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identify where competitors dominate</p>
        </div>
        <button onClick={fetchData} className="bg-white p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm transition-all active:scale-95">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* ALERT BOX DYNAMIQUE */}
        <div className={`rounded-2xl p-6 flex items-start gap-4 border ${opportunities.length > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className={`p-2 rounded-lg ${opportunities.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {opportunities.length > 0 ? <ShieldAlert size={20}/> : <Sparkles size={20}/>}
          </div>
          <div>
            <h3 className={`text-sm font-black uppercase tracking-tight mb-1 italic ${opportunities.length > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
              {opportunities.length > 0 ? 'Gaps de visibilité détectés' : 'Visibilité Optimale'}
            </h3>
            <p className={`text-xs leading-relaxed font-medium ${opportunities.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {opportunities.length > 0 
                ? `Nous avons identifié ${opportunities.length} mots-clés stratégiques où ${brand} est sous-représenté par rapport à la concurrence.`
                : `Bravo ! ${brand} est bien positionné sur l'ensemble de vos mots-clés suivis.`}
            </p>
          </div>
        </div>

        {/* LISTE DES ACTIONS */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="text-indigo-600" size={16} />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Actions</h3>
                </div>
            </div>
            
            <div className="divide-y divide-slate-50">
                {opportunities.map((opp, idx) => (
                    <div key={idx} className="p-6 hover:bg-slate-50/50 transition-all flex flex-col md:flex-row md:items-center justify-between group gap-4">
                        <div className="flex items-start gap-6">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-black italic text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                #{idx + 1}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-black text-slate-800 mb-2 italic tracking-tight">"{opp.keyword}"</p>
                                
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                                        Concurrence : {opp.competitionStrength} cités
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${opp.mentionCount === 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                        Visibilité IA : {opp.mentionCount}/4 modèles
                                    </span>
                                </div>

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
                        <button className="flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest md:opacity-0 group-hover:opacity-100 transition-all bg-indigo-50 md:bg-transparent py-2 px-4 md:py-0 rounded-lg">
                            Optimiser <ArrowUpRight size={14}/>
                        </button>
                    </div>
                ))}

                {opportunities.length === 0 && !loading && (
                    <div className="p-20 text-center">
                        <p className="text-xs text-slate-400 italic">Aucun gap critique détecté. Votre domination est totale ou les données sont en cours de chargement.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}