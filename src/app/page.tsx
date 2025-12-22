"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { RefreshCw } from 'lucide-react';

const getBrandColor = (name: string) => {
  const presets: { [key: string]: string } = { 
    "Shine": "#4F46E5", 
    "Qonto": "#EC4899", 
    "Revolut": "#06B6D4",
    "N26": "#10B981"
  };
  if (presets[name]) return presets[name];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 50%)`; 
};

export default function OverviewPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Réglages dynamiques chargés depuis la DB
  const [brand, setBrand] = useState("Loading...");
  const [competitors, setCompetitors] = useState<string[]>([]);

  const fetchAllData = async () => {
    setLoading(true);
    // 1. Charger les réglages (Marque principale et concurrents)
    const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single();
    if (settings) {
      setBrand(settings.brand || "Marque inconnue");
      setCompetitors(settings.competitors || []);
    }

    // 2. Charger l'historique des rapports
    const { data: reports } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(10);
    if (reports) setHistory([...reports].reverse());
    setLoading(false);
  };

  useEffect(() => { fetchAllData(); }, []);

  // Fonction de calcul de score sécurisée contre les valeurs nulles/undefined
  const getBrandScore = (brandName: string, data: any) => {
    if (!data || !brandName || typeof brandName !== 'string') return 0;
    
    let total = 0;
    const models = ['gpt', 'claude', 'gemini', 'perplexity'];
    
    models.forEach(m => {
      const modelData = data[m] || {};
      const mainBrand = brand || "";

      // Comparaison sécurisée pour la marque principale
      if (typeof mainBrand === 'string' && brandName.toLowerCase() === mainBrand.toLowerCase()) {
        const score = modelData.visibility_score || 0;
        total += (score > 1 ? score : score * 100);
      } else {
        // Comparaison sécurisée pour les concurrents
        const isPresent = modelData.competitors?.some((c: any) => 
          typeof c === 'string' && c.toLowerCase() === brandName.toLowerCase()
        );
        total += isPresent ? 75 : 0; 
      }
    });
    return Math.round(total / 4);
  };

  // Liste des marques triées par score (avec filtrage des valeurs invalides)
  const rankedBrands = [brand, ...competitors]
    .filter(name => name && typeof name === 'string' && name !== "Loading...")
    .map(name => ({ 
      name, 
      score: getBrandScore(name, history[history.length - 1]?.analysis_data) 
    }))
    .sort((a, b) => b.score - a.score);

  const renderSmoothCurve = (brandName: string) => {
    if (history.length < 2 || !brandName) return null;
    const width = 1000; const height = 200;
    const points = history.map((h, i) => ({
      x: (i / (history.length - 1)) * width,
      y: height - (getBrandScore(brandName, h.analysis_data) / 100) * height
    }));
    
    let pathData = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cpX = (points[i].x + points[i + 1].x) / 2;
      pathData += ` C ${cpX},${points[i].y} ${cpX},${points[i+1].y} ${points[i+1].x},${points[i+1].y}`;
    }
    
    return (
      <g key={brandName}>
        <path 
          d={pathData} 
          fill="none" 
          stroke={getBrandColor(brandName)} 
          strokeWidth={brandName === brand ? "4" : "2"} 
          style={{ opacity: brandName === brand ? 1 : 0.4 }} 
          className="transition-all duration-1000" 
        />
      </g>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 text-left">
      <header className="flex justify-between items-center mb-10 text-left">
        <div>
          <h1 className="text-2xl font-black text-slate-900 italic tracking-tight uppercase">Market Overview</h1>
          <p className="text-sm text-slate-400 font-medium">Live Intelligence for {brand}</p>
        </div>
        <button onClick={fetchAllData} className="bg-white p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all active:scale-95">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
        {/* LEADERBOARD DYNAMIQUE */}
        <div className="lg:col-span-4 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col h-[520px]">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Competitive Leaderboard</h3>
          <div className="space-y-6 flex-grow overflow-y-auto">
            {rankedBrands.map((item, idx) => (
              <div key={item.name} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: getBrandColor(item.name) }}>#{idx + 1} {item.name}</span>
                  <span className="text-sm font-black text-slate-900">{item.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${item.score}%`, backgroundColor: getBrandColor(item.name) }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EVOLUTION FLOW */}
        <div className="lg:col-span-8 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col h-[520px] text-left">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 italic">Visibility Score Evolution</h3>
          
          <div className="flex-grow flex relative mt-4">
            <div className="flex flex-col justify-between text-[10px] font-bold text-slate-300 pr-4 pb-8 border-r border-slate-50">
              <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
            </div>
            
            <div className="flex-grow relative px-4">
              <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                {[0, 25, 50, 75, 100].map(v => (
                  <line key={v} x1="0" y1={200 - (v * 2)} x2="1000" y2={200 - (v * 2)} stroke="#F8FAFC" strokeWidth="1" />
                ))}
                {competitors.filter(c => typeof c === 'string').map(c => renderSmoothCurve(c))}
                {renderSmoothCurve(brand)}
              </svg>
              
              <div className="absolute -bottom-8 left-4 right-4 flex justify-between text-[9px] font-black text-slate-300 uppercase">
                {history.map((h, i) => (
                  <span key={i}>{new Date(h.created_at).toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit'})}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-6 pt-6 border-t border-slate-50">
            {[brand, ...competitors].filter(n => typeof n === 'string').map(name => (
              <div key={name} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getBrandColor(name) }}></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}