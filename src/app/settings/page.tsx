"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { 
  Save, 
  Loader2, 
  Plus, 
  X as CloseIcon, 
  MessageSquare, 
  Sparkles, 
  Trash2, 
  Zap,
  Globe,
  Monitor,
  Languages,
  MapPin,
  RefreshCw
} from 'lucide-react';

const getBrandColor = (name: string) => {
  if (!name || typeof name !== 'string') return "#94a3b8";
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

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  
  // États synchronisés avec la base de données
  const [brand, setBrand] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);
  
  // Nouveaux paramètres GEO pour l'IA
  const [country, setCountry] = useState("France");
  const [language, setLanguage] = useState("French");
  const [device, setDevice] = useState("Desktop");
  const [city, setCity] = useState("");

  const [newKeyword, setNewKeyword] = useState("");
  const [newComp, setNewComp] = useState("");

  // --- CHARGEMENT DES RÉGLAGES ---
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (data) {
        setBrand(data.brand || "");
        setKeywords(data.keywords || []);
        setCompetitors(data.competitors || []);
        setCountry(data.country || "France");
        setLanguage(data.language || "French");
        setDevice(data.device || "Desktop");
        setCity(data.city || "");
      }
      const { data: hist } = await supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(10);
      if (hist) setHistory(hist);
    };
    loadSettings();
  }, []);

  // --- SAUVEGARDE DANS LA BASE DE DONNÉES ---
  const saveSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('settings').update({
      brand,
      keywords,
      competitors,
      country,
      language,
      device,
      city,
      updated_at: new Date()
    }).eq('id', 1);
    
    if (error) alert("Erreur lors de la sauvegarde des paramètres");
    setIsSaving(false);
  };

  // --- SUGGESTION DE PROMPTS PAR IA ---
  const suggestPrompts = async () => {
    if (keywords.length >= 50) return;
    setIsSuggesting(true);
    setTimeout(() => {
      const intents = ["Comparatif", "Avis sur", "Frais de", "Alternative à", "Meilleur pour"];
      const targets = ["freelance", "SASU", "auto-entrepreneur", "PME", "startup"];
      const vs = competitors.length > 0 ? competitors[Math.floor(Math.random() * competitors.length)] : "le marché";
      const prompt = `${intents[Math.floor(Math.random() * intents.length)]} ${brand} vs ${vs} pour ${targets[Math.floor(Math.random() * targets.length)]}`;
      if (!keywords.includes(prompt)) setKeywords(prev => [...prev, prompt]);
      setIsSuggesting(false);
    }, 400);
  };

  // --- DÉTECTION AUTOMATIQUE DE CONCURRENTS ---
  const detectedCompetitors = (() => {
    const found: string[] = [];
    history.forEach(scan => {
      ['gpt', 'claude', 'gemini', 'perplexity'].forEach(m => {
        const comps = scan.analysis_data?.[m]?.competitors || [];
        comps.forEach((c: any) => {
          if (typeof c !== 'string') return;
          const name = c.trim();
          if (!competitors.includes(name) && name.toLowerCase() !== brand.toLowerCase() && !found.includes(name)) {
            found.push(name);
          }
        });
      });
    });
    return found;
  })();

  // --- LANCEMENT DU SCAN MASSIF (WEBHOOK n8n) ---
  const handleRunMassAnalysis = async () => {
    setLoading(true);
    await saveSettings();
    for (let i = 0; i < keywords.length; i++) {
      setProgress(Math.round(((i + 1) / keywords.length) * 100));
      try {
        // Envoi des 7 paramètres au webhook n8n
        await fetch("https://fredericlefebvre.app.n8n.cloud/webhook/48a1ec77-0327-4ec5-b934-aaa03cb0f6f6", {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            brand, 
            keyword: keywords[i], 
            competitors,
            country,
            language,
            device,
            city 
          }),
        });
        await new Promise(r => setTimeout(r, 2500)); 
      } catch (e) { console.error("Erreur Webhook:", e); }
    }
    setLoading(false); 
    setProgress(0);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto text-left pb-20">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Campaign Cockpit</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration persistante via DB</p>
        </div>
        <button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100 flex items-center gap-2 hover:bg-emerald-600 transition-all active:scale-95"
        >
          {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Save size={14} />}
          {isSaving ? "Saving..." : "Save Config"}
        </button>
      </header>

      {/* Barre de progression des scans */}
      {loading && (
        <div className="mb-6 bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-sm font-black flex items-center gap-2 italic uppercase">
              <RefreshCw className="animate-spin text-indigo-400" size={16}/> Bulk Analysis: {progress}%
            </h3>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Section Marque & GEO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2">My Brand</label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-300 transition-colors" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2 flex items-center gap-1"><Globe size={10}/> Country</label>
                <input value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2 flex items-center gap-1"><MapPin size={10}/> City (Opt)</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Paris" className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2 flex items-center gap-1"><Languages size={10}/> Language</label>
                <input value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2 flex items-center gap-1"><Monitor size={10}/> Device</label>
                <select value={device} onChange={(e) => setDevice(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-bold outline-none cursor-pointer">
                  <option value="Desktop">Desktop</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-4">Competitors to track</label>
            <div className="flex flex-wrap gap-2 mb-4 flex-grow content-start">
              {competitors.map(c => (
                <span key={c} className="px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 shadow-sm border border-slate-50 bg-white" style={{ color: getBrandColor(c) }}>
                  {c} <CloseIcon size={12} className="cursor-pointer text-slate-300 hover:text-rose-500" onClick={() => setCompetitors(competitors.filter(x => x !== c))} />
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newComp} onChange={(e) => setNewComp(e.target.value)} placeholder="Add brand..." className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-bold outline-none" />
              <button onClick={() => { if(newComp) { setCompetitors([...competitors, newComp]); setNewComp(""); } }} className="bg-slate-900 text-white px-4 rounded-xl font-bold text-[10px]">Add</button>
            </div>
          </div>
        </div>

        {/* Suggestion de concurrents détectés par l'IA */}
        {detectedCompetitors.length > 0 && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-in fade-in duration-700">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">AI Discovery Cloud</h3>
            <div className="flex flex-wrap gap-2">
              {detectedCompetitors.map(name => (
                <button key={name} onClick={() => setCompetitors([...competitors, name])} className="bg-slate-50 border border-slate-100 text-slate-500 hover:border-indigo-200 hover:text-indigo-600 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2">
                  <Plus size={10} /> {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bibliothèque de Prompts */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-left">
              <MessageSquare className="text-indigo-600" size={16} />
              <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Campaign Prompts ({keywords.length}/50)</h3>
            </div>
            <button onClick={suggestPrompts} disabled={isSuggesting || keywords.length >= 50} className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
              {isSuggesting ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12} />} AI SUGGEST
            </button>
          </div>
          
          <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto pr-2 border-y border-slate-50 py-4 custom-scrollbar">
            {keywords.map((kw, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-50/30 p-4 rounded-xl border border-slate-100 group">
                <span className="text-xs font-bold text-slate-600 italic">"{kw}"</span>
                <button onClick={() => setKeywords(keywords.filter((_, i) => i !== idx))} className="p-2 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} placeholder="Manual prompt..." className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 text-xs font-bold outline-none" />
            <button onClick={() => { if(newKeyword && keywords.length < 50) { setKeywords([...keywords, newKeyword]); setNewKeyword(""); } }} className="bg-indigo-600 text-white px-8 rounded-xl font-black text-xs uppercase">Add</button>
          </div>
        </div>

        {/* Bouton d'action principal */}
        <button 
          onClick={handleRunMassAnalysis} 
          disabled={loading || keywords.length === 0} 
          className={`w-full py-6 rounded-2xl font-black text-sm flex items-center justify-center gap-4 transition-all ${loading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white shadow-2xl hover:bg-black active:scale-[0.98]'}`}
        >
          {loading ? <RefreshCw className="animate-spin" size={20}/> : <Zap size={20} className="fill-white"/>}
          LAUNCH GLOBAL GEO SCAN
        </button>
      </div>
    </div>
  );
}