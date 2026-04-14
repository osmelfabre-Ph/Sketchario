import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Eye, PencilSimple, Trash, Lightning, ChartLineUp, Target, Clock, Article, MagnifyingGlass, Archive, ImageSquare
} from '@phosphor-icons/react';

export default function Dashboard({ setActiveView, setSelectedProject }) {
  const { api } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [api]);

  const deleteProject = async (id) => {
    if (!window.confirm('Eliminare questo progetto e tutti i suoi contenuti?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert('Errore eliminazione: ' + (e.response?.data?.detail || e.message));
    }
  };

  const archiveProject = async (id, archived) => {
    await api.post(`/projects/${id}/${archived ? 'unarchive' : 'archive'}`);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, archived: !archived } : p));
  };

  const openProject = async (project) => {
    try {
      const { data } = await api.get(`/projects/${project.id}`);
      setSelectedProject(data);
      setActiveView('project');
    } catch {
      setSelectedProject(project);
      setActiveView('project');
    }
  };

  const stats = [
    { label: 'Progetti Attivi', value: projects.filter(p => !p.archived).length, icon: Lightning, color: 'blue' },
    { label: 'Contenuti Totali', value: projects.reduce((a, p) => a + (p.content_count || 0), 0), icon: ChartLineUp, color: 'green' },
    { label: 'Completati', value: projects.filter(p => p.status === 'completed').length, icon: Target, color: 'purple' },
    { label: 'Bozze', value: projects.filter(p => p.status === 'draft').length, icon: Clock, color: 'orange' },
  ];

  const activeProjects = projects.filter(p => !p.archived);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text" data-testid="dashboard-title">Dashboard</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-sm">Gestisci i tuoi progetti editoriali</p>
        </div>
        <button data-testid="new-project-btn" className="btn-gradient" onClick={() => setActiveView('wizard')}>
          <Plus weight="bold" size={18} /> Crea Progetto
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card">
            <div>
              <p className="text-[var(--text-secondary)] text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </div>
            <div className={`stat-icon ${stat.color}`}>
              <stat.icon weight="fill" size={24} color="white" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">I Tuoi Progetti</h2>
        </div>

        {loading ? (
          <p className="text-[var(--text-muted)] text-sm text-center py-8">Caricamento...</p>
        ) : activeProjects.length === 0 ? (
          <div className="empty-state">
            <Lightning size={64} className="empty-state-icon" />
            <h3 className="text-lg font-semibold mb-2 text-[var(--text-secondary)]">Nessun progetto</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">Crea il tuo primo progetto per iniziare</p>
            <button className="btn-gradient" onClick={() => setActiveView('wizard')}>
              <Plus size={18} /> Crea il Tuo Primo Progetto
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {activeProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                data-testid={`project-card-${project.id}`}
                className="card project-card"
              >
                {/* Cover Image */}
                {project.cover_url ? (
                  <div className="relative -mx-6 -mt-6 mb-4 h-32 rounded-t-[0.9rem] overflow-hidden">
                    <img src={`${process.env.REACT_APP_BACKEND_URL}${project.cover_url}`} alt="" className="w-full h-full object-cover" />
                    <label className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors">
                      <ImageSquare size={14} color="white" />
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files[0]; if (!file) return;
                        const fd = new FormData(); fd.append('file', file);
                        const { data } = await api.post(`/projects/${project.id}/cover`, fd);
                        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, cover_url: data.cover_url } : p));
                      }} />
                    </label>
                  </div>
                ) : (
                  <label className="-mx-6 -mt-6 mb-4 h-24 rounded-t-[0.9rem] flex items-center justify-center cursor-pointer border-b border-[var(--border-color)]" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs">
                      <ImageSquare size={16} /> Aggiungi copertina
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files[0]; if (!file) return;
                      const fd = new FormData(); fd.append('file', file);
                      const { data } = await api.post(`/projects/${project.id}/cover`, fd);
                      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, cover_url: data.cover_url } : p));
                    }} />
                  </label>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">{project.name}</h3>
                    <p className="text-sm text-[var(--text-secondary)]">{project.sector}</p>
                  </div>
                  <span className={`badge ${project.status === 'active' ? 'green' : project.status === 'completed' ? 'purple' : 'orange'}`}>
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-4">
                  <span className="flex items-center gap-1"><Article size={14} /> {project.content_count || 0} contenuti</span>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost text-sm py-2 px-3 flex-1" onClick={() => openProject(project)}><Eye size={14} /> Apri</button>
                  <button className="btn-ghost text-sm py-2 px-3" onClick={() => archiveProject(project.id, project.archived)}><Archive size={14} /></button>
                  <button className="btn-ghost text-sm py-2 px-3" onClick={() => deleteProject(project.id)}><Trash size={14} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
