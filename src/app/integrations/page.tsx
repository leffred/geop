"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { 
  Link, 
  CheckCircle2, 
  RefreshCw, 
  Search, 
  BarChart3, 
  Settings,
  ShieldCheck
} from 'lucide-react';

export default function IntegrationsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [gscProperty, setGscProperty] = useState("");
  const [gaProperty, setGaProperty] = useState("");
  const [isConnected, setIsConnected] = useState({ gsc: false, ga: false });

  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
      if (data) {
        setGscProperty(data.gsc_property_id || "");
        setGaProperty(data.ga4_measurement_id || "");
        setIsConnected({
          gsc: !!data.gsc_access_token,
          ga: !!data.ga4_access_token
        });
      }
    };
    loadSettings();
  }, []);

  const handleConnect = (service: 'gsc' | 'ga4') => {
    // Remplacer par votre Client ID Google réel
    const clientId = "VOTRE_CLIENT_ID_GOOGLE"; 
    const redirectUri = encodeURIComponent("https://fredericlefebvre.app.n8n.cloud/webhook/auth-google-callback");
    const scope = service === 'gsc' 
      ? "https://www.googleapis.com/auth/webmasters.readonly" 
      : "https://www.googleapis.com/auth/analytics.readonly";
      
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
    
    window.location.href = authUrl;
  };

  const saveIds = async () => {
    setIsSaving(true);
    await supabase.from('settings').update({
      gsc_property_id: gscProperty,
      ga4_measurement_id: gaProperty,
      updated_at: new Date()
    }).eq('id', 1);
    setIsSaving(false);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto text-left pb-20">
      <header className="mb-10">
        <h1 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Data Integrations</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect your ecosystem to GEO metrics</p>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {/* GOOGLE SEARCH CONSOLE */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                <Search size={24}/>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase italic mb-1">Google Search Console</h3>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">Monitor keywords performance and identify traditional SEO gaps.</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px]">
              {isConnected.gsc ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                  <CheckCircle2 size={14}/> Connected
                </div>
              ) : (
                <button onClick={() => handleConnect('gsc')} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  <Link size={14}/> Connect GSC
                </button>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-50">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-3">Domain Property / URL</label>
            <input value={gscProperty} onChange={(e) => setGscProperty(e.target.value)} placeholder="sc-domain:example.com" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-300 transition-all" />
          </div>
        </div>

        {/* GOOGLE ANALYTICS 4 */}
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-orange-50 p-3 rounded-2xl text-orange-600">
                <BarChart3 size={24}/>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase italic mb-1">Google Analytics 4</h3>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">Track referrals from AI models (ChatGPT, Perplexity).</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px]">
              {isConnected.ga ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                  <CheckCircle2 size={14}/> Connected
                </div>
              ) : (
                <button onClick={() => handleConnect('ga4')} className="bg-orange-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-orange-100 hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
                  <Link size={14}/> Connect GA4
                </button>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-50">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-3">Measurement ID (G-XXXXX)</label>
            <input value={gaProperty} onChange={(e) => setGaProperty(e.target.value)} placeholder="G-ABC123XYZ" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-300 transition-all" />
          </div>
        </div>

        <button onClick={saveIds} disabled={isSaving} className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-sm flex items-center justify-center gap-4 transition-all hover:bg-black active:scale-[0.98]">
          {isSaving ? <RefreshCw className="animate-spin" size={20}/> : <Settings size={20}/>}
          SAVE INTEGRATION SETTINGS
        </button>
      </div>
    </div>
  );
}