"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { RefreshCw } from 'lucide-react';

// --- UTILS : GESTION DES COULEURS ---
const getBrandColor = (name: string) => {
  const presets: { [key: string]: string } = { 
    "Shine": "#4F46E5", 
    "Qonto": "#EC4899", 
    "Revolut": "#06B6D4",
    "N26": "#10B981",
    "Pennylane": "#F59E0B"
  };
  // Si le nom existe dans les presets, on retourne la couleur
  if (presets[name]) return presets[name];
  // Sinon génération aléatoire mais stable basée sur le nom
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 65%, 50%)`; 
};

// --- TYPES ---
interface ChartDataPoint {
  date: string;
  originalDate: Date;
  scores: { [brand: string]: number }; // ex: { "Jourdechance": 80, "Agence X": 20 }
}

export default function OverviewPage() {
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState("Loading...");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  const fetchAllData = async () => {
    setLoading(true);

    // 1. Récupération de la configuration (Table Projects)
    const { data: project } = await supabase.from('projects').select('*').limit(1).single();
    
    let currentBrand = "Marque Inconnue";
    let currentCompetitors: string[] = [];

    if (project) {
      currentBrand = project.name;
      currentCompetitors = project.competitors || [];
      setBrand(currentBrand);
      setCompetitors(currentCompetitors);
    }

    // 2. Récupération des résultats bruts (Table Monitoring Results)
    const { data: results } = await supabase
      .from('monitoring_results')
      .select('run_date, raw_response')
      .order('run_date', { ascending: true }); // On veut du plus vieux au plus récent pour le graphe

    if (results && results.length > 0) {
      processChartData(results, currentBrand, currentCompetitors);
    }

    setLoading(false);
  };

  // --- LOGIQUE D'AGRÉGATION V2 ---
  const processChartData = (results: any[], myBrand: string, myCompetitors: string[]) => {
    const groupedByDay: { [date: string]: { count: number, brands: { [key: string]: number } } } = {};

    results.forEach(scan => {
      // 1. Normalisation de la date (Jour/Mois)
      const dateKey = new Date(scan.run_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      if (!groupedByDay[dateKey]) {
        groupedByDay[dateKey] = { count: 0, brands: { [myBrand]: 0 } };
        myCompetitors.forEach(c => groupedByDay[dateKey].brands[c] = 0);
      }

      groupedByDay[dateKey].count++;

      // 2. Parsing des résultats IA
      let data = {};
      try {
        data = typeof scan.raw_response === 'string' ? JSON.parse(scan.raw_response) : scan.raw_response;
      } catch (e) { return; }

      // 3. Analyse des mentions pour chaque modèle
      const models = ['gpt', 'perplexity'];
      const foundInScan = new Set<string>();

      models.forEach(m => {
        // @ts-ignore
        const modelData = data[m] || {};

        // A. Est-ce que MA marque est citée ?
        if (modelData.is_mentioned) foundInScan.add(myBrand);

        // B. Est-ce que les CONCURRENTS sont cités ?
        const cited = modelData.competitors_cited || modelData.competitors || [];
        if (Array.isArray(cited)) {
          cited.forEach((c: string) => {
             // Matching simple (contient le nom)
             myCompetitors.forEach(comp => {
               if (c.toLowerCase().includes(comp.toLowerCase())) foundInScan.add(comp);
             });
          });
        }
      });

      // 4. Incrémentation des compteurs
      foundInScan.forEach(b => {
        if (groupedByDay[dateKey].brands[b] !== undefined) {
          groupedByDay[dateKey].brands[b]++;
        }
      });
    });

    // 5. Transformation en % (Score moyen journalier)
    const finalChartData: ChartDataPoint[] = Object.keys(groupedByDay).map(date => {
      const dayData = groupedByDay[date];
      const scores: { [key: string]: number } = {};
      
      Object.keys(dayData.brands).forEach(b => {
        // (Nombre de fois cité / Nombre de prompts scannés ce jour-là) * 100
        scores[b] = Math.round((dayData.brands[b] / dayData.count) * 100);
      });

      return {
        date,
        originalDate: new Date(), // Juste pour le type, pas utilisé pour l'affichage
        scores
      };
    });

    // On garde les 10 derniers jours pour l'affichage
    setChartData(finalChartData.slice(-10));
  };

  useEffect(() => { fetchAllData(); }, []);

  // --- RENDER DU GRAPHIQUE (SVG) ---
  const renderSmoothCurve = (brandName: string) => {
    if (chartData.length < 2 || !brandName) return null;
    
    const width = 1000; 
    const height = 200;
    
    const points = chartData.map((d, i) => ({
      x: (i / (chartData.length - 1)) * width,
      y: height - ((d.scores[brandName] || 0) / 100) * height
    }));

    let pathData = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cpX = (points[i].x + points[i + 1].x) / 2;
      pathData += ` C ${cpX},${points[i].y} ${cpX},${points[i+1].y} ${points[i+1].x},${points[i+1].y}`;
    }

    const isMainBrand = brandName === brand;

    return (
      <g key={brandName}>
        <path 
          d={pathData} 
          fill="none" 
          stroke={getBrandColor(brandName)} 
          strokeWidth={isMainBrand ? "4" : "2"} 
          style={{ opacity: isMainBrand ? 1 : 0.3 }} 
          className="transition-all duration-1000" 
        />
        {/* Points pour le debug visuel si peu de données */}
        {chartData.length < 5 && points.map((p, idx) => (
             <circle key={idx} cx={p.x} cy={p.y} r={isMainBrand ? 4 : 2} fill={getBrandColor(brandName)} />
        ))}
      </g>
    );
  };

  // Données pour le Leaderboard (Dernier jour connu)
  const lastDayData = chartData.length > 0 ? chartData[chartData.length - 1].scores : {};
  const rankedBrands = [brand, ...competitors]
    .filter(name => name && name !== "Loading...")
    .map(name => ({ name, score: lastDayData[name] || 0 }))
    .sort((a, b) => b.score - a.score);

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
        
        {/* LEADERBOARD */}
        <div className="lg:col-span-4 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col h-[520px]">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Share of Voice (Today)</h3>
          
          {chartData.length === 0 && !loading ? (
             <div className="flex-grow flex items-center justify-center text-slate-300 italic text-xs">
                Aucune donnée. Attendez le scan de 4h.
             </div>
          ) : (
            <div className="space-y-6 flex-grow overflow-y-auto">
              {rankedBrands.map((item, idx) => (
                <div key={item.name} className="flex flex-col gap-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: getBrandColor(item.name) }}>#{idx + 1} {item.name}</span>
                    <span className="text-sm font-black text-slate-900">{item.score}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.score}%`, backgroundColor: getBrandColor(item.name) }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GRAPHIQUE */}
        <div className="lg:col-span-8 bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col h-[520px] text-left">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 italic">Visibility Evolution (Last 10 Scans)</h3>
          <div className="flex-grow flex relative mt-4">
            <div className="flex flex-col justify-between text-[10px] font-bold text-slate-300 pr-4 pb-8 border-r border-slate-50">
              <span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span>
            </div>
            <div className="flex-grow relative px-4">
              {chartData.length > 0 ? (
                <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  {/* Lignes de grille */}
                  {[0, 25, 50, 75, 100].map(v => (
                    <line key={v} x1="0" y1={200 - (v * 2)} x2="1000" y2={200 - (v * 2)} stroke="#F8FAFC" strokeWidth="1" />
                  ))}
                  
                  {/* Courbes Concurrents */}
                  {competitors.map(c => renderSmoothCurve(c))}
                  
                  {/* Courbe Marque Principale (au dessus) */}
                  {renderSmoothCurve(brand)}
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 italic text-sm">
                    En attente de données...
                </div>
              )}

              {/* Axe X (Dates) */}
              <div className="absolute -bottom-8 left-4 right-4 flex justify-between text-[9px] font-black text-slate-300 uppercase">
                {chartData.map((d, i) => (
                  <span key={i}>{d.date}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}