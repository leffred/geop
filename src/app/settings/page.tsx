"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { 
  Save, 
  Plus, 
  Trash2, 
  Layout, 
  MessageSquare, 
  Globe, 
  Target,
  Loader2
} from 'lucide-react';

// Types utilitaires dérivés de la DB
type Project = Database['public']['Tables']['projects']['Row'];
type Topic = Database['public']['Tables']['topics']['Row'];
type Prompt = Database['public']['Tables']['prompts']['Row'];

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Data State
  const [project, setProject] = useState<Project | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  
  // UI State
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [newTopicName, setNewTopicName] = useState("");
  const [newPromptText, setNewPromptText] = useState("");

  // Form State pour le projet
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    language: 'fr',
    country: 'FR'
  });

  // 1. Initialisation : Récupérer User + Projet
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      // A. Récupérer l'utilisateur (Auth)
      const { data: { user } } = await supabase.auth.getUser();
      
      // FALLBACK DEV : Si pas d'auth, on utilise un ID fictif pour tester (si ta DB le permet)
      // Sinon, assure-toi d'être logué via Supabase Auth
      const uid = user?.id || '00000000-0000-0000-0000-000000000000'; 
      setUserId(uid);

      // B. Récupérer le projet existant
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .limit(1);

      if (projects && projects.length > 0) {
        const p = projects[0];
        setProject(p);
        setFormData({
          name: p.name,
          domain: p.domain || '',
          language: p.language || 'fr',
          country: p.country || 'FR'
        });
        // Charger les topics liés
        fetchTopics(p.id);
      }
      
      setLoading(false);
    };
    init();
  }, []);

  // 2. Fonctions de Fetch (Chargement)
  const fetchTopics = async (projectId: string) => {
    const { data } = await supabase
      .from('topics')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setTopics(data);
      if (data.length > 0 && !selectedTopicId) {
        setSelectedTopicId(data[0].id);
        fetchPrompts(data[0].id);
      }
    }
  };

  const fetchPrompts = async (topicId: string) => {
    const { data } = await supabase
      .from('prompts')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });
    if (data) setPrompts(data);
  };

  // 3. Actions : Projet
  const handleSaveProject = async () => {
    if (!userId) return alert("Utilisateur non identifié");
    
    const payload = {
      user_id: userId,
      name: formData.name,
      domain: formData.domain,
      language: formData.language,
      country: formData.country
    };

    if (project) {
      // Update
      const { error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', project.id);
      if (!error) alert("Projet mis à jour !");
    } else {
      // Create
      const { data, error } = await supabase
        .from('projects')
        .insert(payload)
        .select()
        .single();
      
      if (data) {
        setProject(data);
        alert("Projet créé !");
      }
      if (error) {
        console.error(error);
        alert("Erreur création projet: " + error.message);
      }
    }
  };

  // 4. Actions : Topics
  const handleAddTopic = async () => {
    if (!project || !newTopicName.trim()) return;
    
    const { data, error } = await supabase
      .from('topics')
      .insert({
        project_id: project.id,
        name: newTopicName,
        volume_estimation: 0
      })
      .select()
      .single();

    if (data) {
      setTopics([...topics, data]);
      setNewTopicName("");
      // Sélectionner automatiquement le nouveau topic
      setSelectedTopicId(data.id);
      fetchPrompts(data.id);
    }
  };

  const handleDeleteTopic = async (id: string) => {
    await supabase.from('topics').delete().eq('id', id);
    setTopics(topics.filter(t => t.id !== id));
    if (selectedTopicId === id) {
      setSelectedTopicId(null);
      setPrompts([]);
    }
  };

  // 5. Actions : Prompts
  const handleAddPrompt = async () => {
    if (!selectedTopicId || !newPromptText.trim()) return;

    const { data, error } = await supabase
      .from('prompts')
      .insert({
        topic_id: selectedTopicId,
        text: newPromptText,
        intent: 'informational' // Default
      })
      .select()
      .single();

    if (data) {
      setPrompts([data, ...prompts]);
      setNewPromptText("");
    }
  };

  const handleDeletePrompt = async (id: string) => {
    await supabase.from('prompts').delete().eq('id', id);
    setPrompts(prompts.filter(p => p.id !== id));
  };

  // --- RENDER ---
  if (loading) return <div className="p-10 flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin"/> Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Configuration du Projet</h1>
        <p className="text-slate-500">Définissez votre marque, vos thématiques et les questions à surveiller.</p>
      </div>

      {/* 1. PROJECT SETTINGS */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
          <Layout className="text-indigo-600" size={20} />
          <h2 className="font-bold text-slate-800">Paramètres Généraux</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Nom du Projet / Marque</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ex: Nike, Ma Startup..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Domaine (Site Web)</label>
            <input 
              type="text" 
              value={formData.domain}
              onChange={e => setFormData({...formData, domain: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="mondomaine.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Langue</label>
            <select 
              value={formData.language}
              onChange={e => setFormData({...formData, language: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg bg-white"
            >
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
              <option value="es">Espagnol</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">Pays Cible</label>
            <input 
              type="text" 
              value={formData.country}
              onChange={e => setFormData({...formData, country: e.target.value})}
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="FR, US, UK..."
            />
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSaveProject}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all font-medium text-sm"
          >
            <Save size={16} />
            {project ? 'Mettre à jour' : 'Créer le projet'}
          </button>
        </div>
      </div>

      {project && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          
          {/* 2. TOPICS LIST (Left Column) */}
          <div className="md:col-span-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="text-indigo-600" size={18} />
                <h3 className="font-bold text-slate-700 text-sm">Topics (Thèmes)</h3>
              </div>
              <span className="text-xs bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-500 font-medium">{topics.length}</span>
            </div>

            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  placeholder="Nouveau topic..."
                  className="flex-1 text-sm p-2 border border-slate-200 rounded-md outline-none focus:border-indigo-500"
                  onKeyDown={e => e.key === 'Enter' && handleAddTopic()}
                />
                <button 
                  onClick={handleAddTopic}
                  className="bg-indigo-50 text-indigo-600 p-2 rounded-md hover:bg-indigo-100 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {topics.map(topic => (
                <div 
                  key={topic.id}
                  onClick={() => { setSelectedTopicId(topic.id); fetchPrompts(topic.id); }}
                  className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 flex items-center justify-between group transition-all ${selectedTopicId === topic.id ? 'bg-indigo-50/50 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <span className={`text-sm font-medium ${selectedTopicId === topic.id ? 'text-indigo-900' : 'text-slate-600'}`}>
                    {topic.name}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic.id); }}
                    className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {topics.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Aucun topic défini.<br/>Commencez par en ajouter un.
                </div>
              )}
            </div>
          </div>

          {/* 3. PROMPTS MANAGER (Right Column) */}
          <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm min-h-[400px] flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <MessageSquare className="text-indigo-600" size={18} />
              <h3 className="font-bold text-slate-700 text-sm">
                Prompts à surveiller {selectedTopicId ? `pour "${topics.find(t => t.id === selectedTopicId)?.name}"` : ''}
              </h3>
            </div>

            {!selectedTopicId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10">
                <Target size={48} className="mb-4 opacity-20"/>
                <p>Sélectionnez un topic à gauche pour gérer ses prompts.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                {/* Add Prompt Area */}
                <div className="p-4 border-b border-slate-100 bg-white">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newPromptText}
                      onChange={e => setNewPromptText(e.target.value)}
                      placeholder="Ex: Quelle est la meilleure alternative à [Ma Marque] ?"
                      className="flex-1 text-sm p-3 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                      onKeyDown={e => e.key === 'Enter' && handleAddPrompt()}
                    />
                    <button 
                      onClick={handleAddPrompt}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-medium text-sm flex items-center gap-2"
                    >
                      <Plus size={16} /> Ajouter
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 pl-1">
                    💡 Astuce : Utilisez des questions que vos clients posent réellement aux IA (comparatifs, avis, tutoriels).
                  </p>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
                  {prompts.map(prompt => (
                    <div key={prompt.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm group flex items-start gap-3 hover:border-indigo-200 transition-all">
                      <div className="mt-1">
                        <Globe size={14} className="text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">"{prompt.text}"</p>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded mt-2 inline-block">
                          {prompt.intent || 'Informational'}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  
                  {prompts.length === 0 && (
                    <div className="p-10 text-center">
                      <p className="text-sm text-slate-400">Aucun prompt pour ce topic.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}