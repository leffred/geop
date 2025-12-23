"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { 
  Target, 
  ArrowUpRight, 
  RefreshCw, 
  Sparkles, 
  Users,
  ShieldAlert
} from 'lucide-react';

// Interface pour typer les données (Optionnel mais propre)
interface ScanResult {
  id: string;
  created_at: string;
  raw_response: string; // C'est une string JSON dans la DB
  prompt?: {
    text: string;
  };
}

export default function OpportunitiesPage() {
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState("Loading...");

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Récupération de la marque (depuis le premier projet trouvé)
    // On suppose que tu as au moins un projet. Sinon on met une valeur par défaut.
    const { data: project } = await supabase.from('projects').select('name').limit(1).single();
    if (project?.name) {
      setBrand(project.name);
    } else {
      setBrand("Ma Marque");
    }

    // 2. Récupération des résultats V2
    // On joint la table 'prompts' pour récupérer le texte du mot-clé
    const { data, error } = await supabase
      .from('monitoring_results')
      .select(`
        *,
        prompt:prompts (
          text
        )
      `)
      .order('run_date', { ascending: false })
      .limit(50);

    if (error) {
      console.error("Erreur de chargement:", error);
    }

    if (data) {
      setHistory(data as any);
    }
    
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- LOGIQUE DE DÉTECTION D'OPPORTUNITÉS (V2) ---
  const calculateOpportunities = () => {
    const opps: { [key: string]: { 
      keyword: string, 
      competitionStrength: number, 
      mentionCount: number,
      dominatingCompetitors: string[] 
    } } = {};
    
    if (history.length === 0) return [];

    history.forEach(scan => {
      // Récupération sécurisée du mot-clé
      // @ts-ignore
      const keyword = scan.prompt?.text || "Requête inconnue";
      
      let mentionCount = 0;
      const competitorsSet = new Set<string>();

      // Parsing de la réponse brute (stockée en string JSON par n8n)
      let analysisData: any = {};
      try {
        if (scan.raw_response) {
          // Double parse parfois nécessaire si n8n a stringifié deux fois, sinon un seul suffit
          analysisData = typeof scan.raw_response === 'string' ? JSON.parse(scan.raw_response) : scan.raw_response;
        }
      } catch (e) {
        console.error("Erreur JSON Parse pour", keyword, e);
      }

      // Analyse des modèles utilisés dans le workflow V2
      const models = ['gpt', 'perplexity'];

      models.forEach(m => {
        const modelData = analysisData[m] || {};
        
        // 1. On compte si la marque est citée
        if (modelData.is_mentioned === true) {
          mentionCount++;
        }
        
        // 2. Collecte des concurrents cités
        // Le prompt n8n renvoie "competitors_cited"
        if (modelData.competitors_cited && Array.isArray(modelData.competitors_cited)) {
          modelData.competitors_cited.forEach((c: string) => competitorsSet.add(c));
        }
        // Fallback ancienne structure (au cas où)
        if (modelData.competitors && Array.isArray(modelData.competitors)) {
          modelData.competitors.forEach((c: string) => competitorsSet.add(c));
        }
      });

      // Logique d'agrégation (on écrase si doublon pour garder le plus récent car history est trié par date)
      if (!opps[keyword]) {
        opps[keyword] = { 
          keyword, 
          competitionStrength: competitorsSet.size, 
          mentionCount: mentionCount,
          dominatingCompetitors: Array.from(competitorsSet).slice(0, 5) // Top 5
        };
      }
    });

    // RETOUR DES RÉSULTATS
    return Object.values(opps)
      // .filter(o => o.mentionCount < 2) // <--- J'AI COMMENTÉ LE FILTRE pour que tu voies tout !
      .sort((a, b) => b.competitionStrength - a.competitionStrength);
  };

  const opportunities = calculateOpportunities();

  return (
    <div className="animate-in fade-in duration-500 text-left pb-20">
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
        
        {/* ALERT BOX */}
        <div className={`rounded-2xl p-6 flex items-start gap-4 border ${opportunities.length > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className={`p-2 rounded-lg ${opportunities.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {opportunities.length > 0 ? <ShieldAlert size={20}/> : <Sparkles size={20}/>}
          </div>
          <div>
            <h3 className={`text-sm font-black uppercase tracking-tight mb-1 italic ${opportunities.length > 0 ? 'text-rose-800' : 'text-emerald-800'}`}>
              {opportunities.length > 0 ? 'Analyse Terminée' : 'Visibilité Optimale'}
            </h3>
            <p className={`text-xs leading-relaxed font-medium ${opportunities.length > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
              {opportunities.length > 0 
                ? `Voici les résultats de l'analyse IA pour ${brand}.`
                : `Bravo ! ${brand} est bien positionné partout.`}
            </p>
          </div>
        </div>

        {/* LISTE DES ACTIONS */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Target className="text-indigo-600" size={16} />
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gaps Prioritaires</h3>
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
                                        Concurrents : {opp.competitionStrength}
                                    </span>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${opp.mentionCount < 2 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        Visibilité IA : {opp.mentionCount} / 2
                                    </span>
                                </div>

                                {opp.dominatingCompetitors.length > 0 && (
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
                                )}
                            </div>
                        </div>
                        <button className="flex items-center justify-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest md:opacity-0 group-hover:opacity-100 transition-all bg-indigo-50 md:bg-transparent py-2 px-4 md:py-0 rounded-lg">
                            Optimiser <ArrowUpRight size={14}/>
                        </button>
                    </div>
                ))}

                {opportunities.length === 0 && !loading && (
                    <div className="p-20 text-center">
                        <p className="text-xs text-slate-400 italic">
                          {history.length === 0 ? "Aucune donnée. Lancez le workflow n8n !" : "Tout est parfait."}
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}