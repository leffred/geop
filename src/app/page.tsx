"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Bot, Search, Brain, Globe, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Zap } from 'lucide-react';

// Configuration Supabase utilisant tes variables d'environnement
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GeopDashboard() {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState("Shine");
  const [keyword, setKeyword] = useState("Meilleure banque pro pour auto-entrepreneur");

  // Fonction pour charger le dernier rapport depuis Supabase
  const fetchLatestReport = async () => {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) setReport(data);
  };

  useEffect(() => {
    fetchLatestReport();
  }, []);

  // Fonction pour déclencher ton workflow n8n en production
  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const WEBHOOK_URL = "https://fredericlefebvre.app.n8n.cloud/webhook/48a1ec77-0327-4ec5-b934-aaa03cb0f6f6";
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand, keyword }),
      });

      if (response.ok) {
        // Rafraîchissement automatique toutes les 10s pendant 1min pour capter la fin de l'analyse
        const interval = setInterval(fetchLatestReport, 10000);
        setTimeout(() => clearInterval(interval), 60000);
      }
    } catch (error) {
      console.error("Erreur n8n:", error);
    } finally {
      setLoading(false);
    }
  };

  const results = report?.analysis_data || {};

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans">
      <header className="max-w-7xl mx-auto mb-10">
        <div className="flex items-center gap-2 mb-8">
          <Zap className="text-blue-600 fill-blue-600" size={28} />
          <h1 className="text-2xl font-black tracking-tight text-slate-900">GEOP <span className="text-blue-600">MONITOR</span></h1>
        </div>

        {/* Barre de contrôle interactive */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block ml-1">Marque</label>
            <input 
              value={brand} 
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-[2] w-full">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block ml-1">Mot-clé cible</label>
            <input 
              value={keyword} 
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button 
            onClick={handleRunAnalysis}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white w-full md:w-auto transition-all ${
              loading ? 'bg-slate-400 animate-pulse' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'
            }`}
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
            {loading ? 'Analyse...' : 'Scanner'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Rappel du contexte du dernier rapport affiché */}
        <div className="mb-8 flex items-center gap-4 text-[11px] text-slate-400 font-medium">
          <span>Dernier scan : {report ? new Date(report.created_at).toLocaleString() : 'Aucun'}</span>
          <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
          <span>Status: {loading ? 'En cours de mise à jour...' : 'À jour'}</span>
        </div>

        {/* Grille des résultats IA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AICard name="GPT-4o" data={results.gpt} icon={<Bot size={20} className="text-emerald-500" />} />
          <AICard name="Claude 3.5" data={results.claude} icon={<Brain size={20} className="text-orange-400" />} />
          <AICard name="Gemini 1.5" data={results.gemini} icon={<Search size={20} className="text-blue-500" />} />
          <AICard name="Perplexity" data={results.perplexity} icon={<Globe size={20} className="text-cyan-500" />} />
        </div>
      </main>
    </div>
  );
}

function AICard({ name, data, icon }: any) {
  const isMentioned = data?.is_mentioned;
  const score = data?.visibility_score || 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      <div className="p-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-bold text-slate-800 text-sm">{name}</span>
        </div>
        {isMentioned ? (
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <CheckCircle2 size={12} /> CITÉ
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
            <AlertCircle size={12} /> NON CITÉ
          </div>
        )}
      </div>
      
      <div className="p-6 flex-grow">
        <div className="mb-6">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-black text-slate-900">{Math.round(score * 100)}</span>
            <span className="text-slate-400 font-bold text-lg mb-1">%</span>
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tight">GEO Visibility Index</p>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Sources Extraites</h4>
          <div className="space-y-3">
            {data?.citations?.map((c: any, i: number) => (
              <div key={i} className="group">
                <div className="flex items-center gap-1 text-blue-600 mb-1">
                  <span className="text-[11px] font-bold truncate">{c.site}</span>
                  <ExternalLink size={10} className="opacity-0 group-hover:opacity-100" />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-3 italic">"{c.reason}"</p>
              </div>
            ))}
            {(!data?.citations || data.citations.length === 0) && (
              <p className="text-[10px] text-slate-400 italic py-2 text-center">Aucune source trouvée.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-slate-50 mt-auto border-t border-slate-100 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Sentiment Global</span>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
          data?.sentiment === 'Positif' ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 bg-slate-100'
        }`}>
          {data?.sentiment || 'Neutre'}
        </span>
      </div>
    </div>
  );
}