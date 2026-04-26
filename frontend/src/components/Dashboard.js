import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Plus, Eye, PencilSimple, Trash, Lightning, ChartLineUp, Target, Clock, Article, Archive, ImageSquare, Check, X
} from '@phosphor-icons/react';

export default function Dashboard({ setActiveView, setSelectedProject, setWizardResumeData }) {
  const { api } = useAuth();
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [renamingProjectId, setRenamingProjectId] = useState(null);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [api]);

  const deleteProject = async (id) => {
    if (!window.confirm(t('dashboard.deleteProjectConfirm'))) return;
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

  const resumeWizard = async (project) => {
    try {
      const { data } = await api.get(`/projects/${project.id}/wizard-state`);
      setWizardResumeData(data);
      setActiveView('wizard');
    } catch (e) {
      alert('Errore: ' + (e.response?.data?.detail || e.message));
    }
  };

  const startRenameProject = (project) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name || '');
  };

  const cancelRenameProject = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const renameProject = async (project) => {
    const nextName = editingProjectName.trim();
    if (!nextName) {
      toast.error(t('dashboard.renameProjectEmpty'));
      return;
    }
    if (nextName === project.name) {
      cancelRenameProject();
      return;
    }

    setRenamingProjectId(project.id);
    const tid = toast.loading(t('dashboard.renamingProject'));
    try {
      await api.put(`/projects/${project.id}`, { name: nextName });
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, name: nextName } : p));
      toast.success(t('dashboard.renameProjectSuccess'), { id: tid });
      cancelRenameProject();
    } catch (e) {
      toast.error(t('dashboard.renameProjectError') + ': ' + (e.response?.data?.detail || e.message), { id: tid });
    }
    setRenamingProjectId(null);
  };

  const stats = [
    { label: t('dashboard.activeProjects'), value: projects.filter(p => !p.archived).length, icon: Lightning, color: 'blue' },
    { label: t('dashboard.totalContent'), value: projects.reduce((a, p) => a + (p.content_count || 0), 0), icon: ChartLineUp, color: 'green' },
    { label: t('dashboard.completed'), value: projects.filter(p => p.status === 'completed').length, icon: Target, color: 'purple' },
    { label: t('dashboard.drafts'), value: projects.filter(p => p.status === 'draft').length, icon: Clock, color: 'orange' },
  ];

  const activeProjects = projects.filter(p => !p.archived);

  return (
    <div>
      <div className="flex items-start sm:items-center justify-between mb-6 md:mb-8 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold gradient-text" data-testid="dashboard-title">{t('dashboard.title')}</h1>
          <p className="text-[var(--text-secondary)] mt-1 text-xs md:text-sm">{t('dashboard.subtitle')}</p>
        </div>
        <button data-testid="new-project-btn" className="btn-gradient text-sm" onClick={() => setActiveView('wizard')}>
          <Plus weight="bold" size={16} /> {t('dashboard.newProject')}
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
          <h2 className="text-lg font-semibold">{t('nav.project')}</h2>
        </div>

        {loading ? (
          <p className="text-[var(--text-muted)] text-sm text-center py-8">{t('common.loading')}</p>
        ) : activeProjects.length === 0 ? (
          <div className="empty-state">
            <Lightning size={64} className="empty-state-icon" />
            <h3 className="text-lg font-semibold mb-2 text-[var(--text-secondary)]">{t('dashboard.noProjects')}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-6">{t('dashboard.noProjectsHint')}</p>
            <button className="btn-gradient" onClick={() => setActiveView('wizard')}>
              <Plus size={18} /> {t('dashboard.newProject')}
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
                  <div className="flex-1 min-w-0">
                    {editingProjectId === project.id ? (
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          className="input-dark text-sm py-2 flex-1"
                          value={editingProjectName}
                          onChange={e => setEditingProjectName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') renameProject(project);
                            if (e.key === 'Escape') cancelRenameProject();
                          }}
                          autoFocus
                          style={{ paddingLeft: '0.75rem' }}
                        />
                        <button
                          className="btn-ghost p-2"
                          onClick={() => renameProject(project)}
                          disabled={renamingProjectId === project.id}
                          title={t('common.save')}
                        >
                          {renamingProjectId === project.id
                            ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            : <Check size={14} />}
                        </button>
                        <button className="btn-ghost p-2" onClick={cancelRenameProject} title={t('common.cancel')}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        <button
                          className="btn-ghost p-1.5 flex-shrink-0"
                          title={t('dashboard.renameProject')}
                          onClick={() => startRenameProject(project)}
                        >
                          <PencilSimple size={13} />
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-[var(--text-secondary)]">{project.sector}</p>
                  </div>
                  <span className={`badge ${project.status === 'active' ? 'green' : project.status === 'completed' ? 'purple' : 'orange'}`}>
                    {project.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-4">
                  <span className="flex items-center gap-1"><Article size={14} /> {project.content_count || 0} {t('dashboard.contents')}</span>
                </div>
                <div className="flex gap-2">
                  {project.status === 'draft' && (project.wizard_step || 0) < 4
                    ? <button className="btn-gradient text-xs md:text-sm py-2 px-3 flex-1" onClick={() => resumeWizard(project)}>▶ {t('dashboard.resumeWizard')}</button>
                    : <button className="btn-ghost text-xs md:text-sm py-2 px-3 flex-1" onClick={() => openProject(project)}><Eye size={14} /> {t('dashboard.openProject')}</button>
                  }
                  <button className="btn-ghost text-xs md:text-sm py-2 px-3" title={t(project.archived ? 'dashboard.unarchiveProject' : 'dashboard.archiveProject')} onClick={() => archiveProject(project.id, project.archived)}><Archive size={14} /></button>
                  <button className="btn-ghost text-xs md:text-sm py-2 px-3" title={t('dashboard.deleteProject')} onClick={() => deleteProject(project.id)}><Trash size={14} /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
