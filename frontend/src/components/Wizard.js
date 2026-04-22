import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, Palette, Lightning, Sparkle, ArrowRight, Check, PencilSimple, Video, Image, ArrowLeft
} from '@phosphor-icons/react';

export default function Wizard({ setActiveView, setSelectedProject, resumeData, setWizardResumeData }) {
  const { api } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 0: Create project
  const [projectName, setProjectName] = useState('');
  const [sector, setSector] = useState('');
  const [description, setDescription] = useState('');
  const [awareness, setAwareness] = useState(60);
  const [education, setEducation] = useState(30);
  const [monetizing, setMonetizing] = useState(10);
  const [formats, setFormats] = useState(['reel', 'carousel']);
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [geo, setGeo] = useState('');
  const [briefNotes, setBriefNotes] = useState('');
  const [projectId, setProjectId] = useState(null);

  // Step 1: Personas
  const [personas, setPersonas] = useState([]);

  // Step 2: ToV
  const [tovPreset, setTovPreset] = useState('');
  const [formality, setFormality] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [empathy, setEmpathy] = useState(5);
  const [humor, setHumor] = useState(3);
  const [storytelling, setStorytelling] = useState(5);
  const [customInstructions, setCustomInstructions] = useState('');
  const [captionLength, setCaptionLength] = useState('medium');

  // Step 3: Hooks
  const [hooks, setHooks] = useState([]);

  // Step 4: Content generation
  const [genProgress, setGenProgress] = useState(0);
  const [genTotal, setGenTotal] = useState(0);

  const steps = [
    { label: 'Brief', icon: Sparkle },
    { label: 'Personas', icon: Users },
    { label: 'Tono', icon: Palette },
    { label: 'Hook', icon: Lightning },
    { label: 'Contenuti', icon: Sparkle },
  ];

  const presets = [
    { id: 'professionale', label: 'Professionale', f: 8, e: 4, em: 5, h: 2, s: 4 },
    { id: 'amichevole', label: 'Amichevole', f: 3, e: 7, em: 8, h: 6, s: 7 },
    { id: 'ispirazionale', label: 'Ispirazionale', f: 5, e: 9, em: 7, h: 3, s: 8 },
    { id: 'provocatorio', label: 'Provocatorio', f: 4, e: 9, em: 3, h: 7, s: 6 },
    { id: 'educativo', label: 'Educativo', f: 7, e: 5, em: 6, h: 3, s: 5 },
  ];

  useEffect(() => {
    if (!resumeData) return;
    const { project, personas: p, tov, hooks: h } = resumeData;
    setProjectId(project.id);
    setProjectName(project.name || '');
    setSector(project.sector || '');
    setDescription(project.description || '');
    setAwareness(project.objective_awareness ?? 60);
    setEducation(project.objective_education ?? 30);
    setMonetizing(project.objective_monetizing ?? 10);
    setFormats(project.formats || ['reel', 'carousel']);
    setDurationWeeks(project.duration_weeks || 1);
    setGeo(project.geo || '');
    setBriefNotes(project.brief_notes || '');
    if (p?.length) setPersonas(p);
    if (tov) {
      setTovPreset(tov.preset || '');
      setFormality(tov.formality ?? 5);
      setEnergy(tov.energy ?? 5);
      setEmpathy(tov.empathy ?? 5);
      setHumor(tov.humor ?? 3);
      setStorytelling(tov.storytelling ?? 5);
      setCustomInstructions(tov.custom_instructions || '');
      setCaptionLength(tov.caption_length || 'medium');
    }
    if (h?.length) setHooks(h);
    const wizardStep = project.wizard_step || 0;
    setStep(Math.min(wizardStep + 1, 4));
    if (setWizardResumeData) setWizardResumeData(null);
  }, [resumeData]);

  const applyPreset = (p) => {
    setTovPreset(p.id);
    setFormality(p.f); setEnergy(p.e); setEmpathy(p.em); setHumor(p.h); setStorytelling(p.s);
  };

  const createProject = async () => {
    if (!projectName.trim() || !sector.trim()) { setError('Nome e settore sono obbligatori'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/projects', {
        name: projectName, sector, description, objective_awareness: awareness,
        objective_education: education, objective_monetizing: monetizing,
        formats, duration_weeks: durationWeeks, geo, brief_notes: briefNotes
      });
      setProjectId(data.id);
      setStep(1);
    } catch (e) {
      setError(e.response?.data?.detail || 'Errore creazione progetto');
    } finally { setLoading(false); }
  };

  const generatePersonas = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/personas/generate', { project_id: projectId });
      setPersonas(data.personas || []);
    } catch (e) {
      setError('Errore generazione personas: ' + (e.response?.data?.detail || e.message));
    } finally { setLoading(false); }
  };

  const savePersonasAndContinue = async () => {
    setLoading(true);
    try {
      await api.post('/personas/save', { project_id: projectId, personas });
      setStep(2);
    } catch (e) { setError('Errore salvataggio'); }
    finally { setLoading(false); }
  };

  const saveTovAndContinue = async () => {
    setLoading(true);
    try {
      await api.post('/tov/save', {
        project_id: projectId, preset: tovPreset, formality, energy, empathy,
        humor, storytelling, custom_instructions: customInstructions, caption_length: captionLength
      });
      setStep(3);
    } catch (e) { setError('Errore salvataggio ToV'); }
    finally { setLoading(false); }
  };

  const generateHooks = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/hooks/generate', { project_id: projectId });
      setHooks(data.hooks || []);
    } catch (e) {
      setError('Errore generazione hook: ' + (e.response?.data?.detail || e.message));
    } finally { setLoading(false); }
  };

  const saveHooksAndGenerate = async () => {
    setLoading(true); setError('');
    try {
      await api.post('/hooks/save', { project_id: projectId, hooks });
      setStep(4);
      setGenTotal(hooks.length);
      const { data } = await api.post('/content/generate', { project_id: projectId });
      setGenProgress(data.count || 0);
      const { data: proj } = await api.get(`/projects/${projectId}`);
      setSelectedProject(proj);
      setActiveView('project');
    } catch (e) {
      setError('Errore generazione contenuti: ' + (e.response?.data?.detail || e.message));
    } finally { setLoading(false); }
  };

  const openProject = async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}`);
      setSelectedProject(data);
      setActiveView('project');
    } catch { setActiveView('dashboard'); }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress */}
      <div className="wizard-progress mb-4">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`wizard-step-item ${step === i ? 'active' : step > i ? 'completed' : ''}`}>
              <div className="wizard-step-number">
                {step > i ? <Check weight="bold" size={14} /> : i + 1}
              </div>
              <span className="text-sm hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`wizard-step-line ${step > i ? 'active' : ''}`} />}
          </div>
        ))}
      </div>
      <div className="progress-bar mb-8">
        <div className="progress-fill" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>

      {error && <div className="text-sm text-[var(--accent-pink)] mb-4 p-3 rounded-lg" style={{ background: 'rgba(236,72,153,0.1)' }}>{error}</div>}

      <AnimatePresence mode="wait">
        {/* STEP 0: Brief */}
        {step === 0 && (
          <motion.div key="brief" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold mb-2">Brief del Progetto</h2>
            <p className="text-[var(--text-secondary)] mb-6 text-sm">Definisci l'identit&agrave; e gli obiettivi del progetto.</p>
            <div className="card space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Nome del progetto *</label>
                <input data-testid="wizard-project-name" className="input-dark" placeholder="Es. Strategia Gennaio 2026" value={projectName} onChange={e => setProjectName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Settore / Niche *</label>
                <input data-testid="wizard-sector" className="input-dark" placeholder="Es. Fotografo ritrattista, Life Coach..." value={sector} onChange={e => setSector(e.target.value)} style={{ paddingLeft: '1rem' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Descrizione</label>
                <textarea className="input-dark" rows={3} placeholder="Descrivi il tuo pubblico, il tuo stile..." value={description} onChange={e => setDescription(e.target.value)} style={{ paddingLeft: '1rem' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Area geografica</label>
                <input className="input-dark" placeholder="Es. Italia, Milano..." value={geo} onChange={e => setGeo(e.target.value)} style={{ paddingLeft: '1rem' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Durata campagna</label>
                <div className="flex gap-2">
                  {[{ w: 1, l: '1 settimana' }, { w: 2, l: '2 settimane' }, { w: 4, l: '1 mese' }].map(d => (
                    <button key={d.w} className={`preset-btn ${durationWeeks === d.w ? 'active' : ''}`} onClick={() => setDurationWeeks(d.w)}>
                      {d.l} <span className="text-xs opacity-60 ml-1">{d.w * 7} contenuti</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Formati contenuto</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'reel', label: 'Reel', emoji: '🎬' },
                    { id: 'carousel', label: 'Carousel', emoji: '🖼️' },
                    { id: 'post', label: 'Post', emoji: '📷' },
                    { id: 'prompted_reel', label: 'Prompted Reel', emoji: '🤖' },
                  ].map(f => (
                    <button key={f.id}
                      className={`preset-btn ${formats.includes(f.id) ? 'active' : ''}`}
                      onClick={() => setFormats(prev => prev.includes(f.id) ? prev.filter(x => x !== f.id) : [...prev, f.id])}>
                      {f.emoji} {f.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2">L'AI distribuirà gli hook tra i formati selezionati</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Note per l'AI</label>
                <textarea className="input-dark" rows={2} placeholder="Es. Tono leggermente pi&ugrave; urgente, uscita corso online..." value={briefNotes} onChange={e => setBriefNotes(e.target.value)} style={{ paddingLeft: '1rem' }} />
              </div>
            </div>
            <button data-testid="wizard-next-btn" className="btn-gradient" onClick={createProject} disabled={loading}>
              {loading ? 'Creazione...' : 'Crea e Continua'} <ArrowRight weight="bold" size={18} />
            </button>
          </motion.div>
        )}

        {/* STEP 1: Personas */}
        {step === 1 && (
          <motion.div key="personas" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold mb-2">Buyer Personas</h2>
            <p className="text-[var(--text-secondary)] mb-6 text-sm">L'AI genera personas basate sul tuo settore.</p>
            {personas.length === 0 ? (
              <div className="text-center py-12">
                <button data-testid="generate-personas-btn" className="btn-gradient" onClick={generatePersonas} disabled={loading}>
                  {loading ? 'Generazione in corso...' : 'Genera Personas con AI'} <Sparkle weight="fill" size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="personas-grid mb-8">
                  {personas.map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card persona-card">
                      <h3 className="font-semibold text-lg mb-1">{p.role}{p.age ? `, ${p.age} anni` : ''}</h3>
                      {p.pain_points && (
                        <div className="p-3 rounded-lg text-sm mb-2" style={{ background: 'rgba(236,72,153,0.1)' }}>
                          <span className="text-[var(--text-muted)] text-xs font-semibold uppercase">Pain Points</span>
                          {(Array.isArray(p.pain_points) ? p.pain_points : [p.pain_points]).map((pp, j) => (
                            <p key={j} className="text-[var(--text-primary)] mt-1">- {pp}</p>
                          ))}
                        </div>
                      )}
                      {p.desires && (
                        <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(99,102,241,0.1)' }}>
                          <span className="text-[var(--text-muted)] text-xs font-semibold uppercase">Desideri</span>
                          {(Array.isArray(p.desires) ? p.desires : [p.desires]).map((d, j) => (
                            <p key={j} className="text-[var(--text-primary)] mt-1">- {d}</p>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button className="btn-ghost" onClick={generatePersonas} disabled={loading}>Rigenera</button>
                  <button data-testid="approve-personas-btn" className="btn-gradient" onClick={savePersonasAndContinue} disabled={loading}>
                    Approva e Continua <ArrowRight weight="bold" size={18} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* STEP 2: Tone of Voice */}
        {step === 2 && (
          <motion.div key="tone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold mb-2">Tono di Voce</h2>
            <p className="text-[var(--text-secondary)] mb-6 text-sm">Definisci come vuoi comunicare.</p>
            <div className="flex gap-2 mb-8 flex-wrap">
              {presets.map(p => (
                <button key={p.id} className={`preset-btn ${tovPreset === p.id ? 'active' : ''}`} onClick={() => applyPreset(p)}>{p.label}</button>
              ))}
            </div>
            <div className="card mb-6">
              {[
                { label: 'Formalit\u00e0', hint: 'Casual \u2194 Formale', val: formality, set: setFormality },
                { label: 'Energia', hint: 'Quieto \u2194 Energico', val: energy, set: setEnergy },
                { label: 'Empatia', hint: 'Neutro \u2194 Empatico', val: empathy, set: setEmpathy },
                { label: 'Umorismo', hint: 'Serio \u2194 Divertente', val: humor, set: setHumor },
                { label: 'Storytelling', hint: 'Diretto \u2194 Narrativo', val: storytelling, set: setStorytelling },
              ].map(s => (
                <div key={s.label} className="tone-slider-row">
                  <div className="tone-slider-label">
                    <span className="font-medium">{s.label}</span>
                    <span>{s.hint} <strong className="ml-2">{s.val}</strong></span>
                  </div>
                  <input type="range" min="1" max="10" value={s.val} onChange={e => s.set(Number(e.target.value))} className="slider-dark" />
                </div>
              ))}
            </div>
            <div className="card mb-6">
              <label className="block text-sm font-medium mb-2">Istruzioni tono</label>
              <textarea className="input-dark" rows={3} placeholder="Es. Chiaro, autorevole, umano, diretto..." value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} style={{ paddingLeft: '1rem' }} />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Lunghezza Caption</label>
              <div className="flex gap-2">
                {[{ id: 'short', l: 'Breve', d: 'max 60 parole' }, { id: 'medium', l: 'Media', d: '120-180 parole' }, { id: 'long', l: 'Lunga', d: '300-450 parole' }].map(c => (
                  <button key={c.id} className={`preset-btn ${captionLength === c.id ? 'active' : ''}`} onClick={() => setCaptionLength(c.id)}>
                    {c.l} <span className="text-xs opacity-60 block">{c.d}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-ghost" onClick={() => setStep(1)}><ArrowLeft size={16} /> Indietro</button>
              <button className="btn-gradient" onClick={saveTovAndContinue} disabled={loading}>
                {loading ? 'Salvataggio...' : 'Salva e Genera Hook'} <ArrowRight weight="bold" size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Hooks */}
        {step === 3 && (
          <motion.div key="hooks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="text-2xl font-bold mb-2">Hook Generati</h2>
            <p className="text-[var(--text-secondary)] mb-6 text-sm">Hook distribuiti sulla campagna.</p>
            {hooks.length === 0 ? (
              <div className="text-center py-12">
                <button data-testid="generate-hooks-btn" className="btn-gradient" onClick={generateHooks} disabled={loading}>
                  {loading ? 'Generazione in corso...' : 'Genera Hook con AI'} <Lightning weight="fill" size={18} />
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-8">
                  {hooks.map((h, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="hook-item">
                      <div className="w-14 text-center">
                        <span className="text-xs font-semibold text-[var(--text-muted)]">G{h.day_offset || i + 1}</span>
                      </div>
                      <div className="flex-1"><p className="text-sm">{h.hook_text}</p></div>
                      <span className={`badge ${h.format === 'reel' ? 'pink' : h.format === 'prompted_reel' ? 'purple' : 'blue'}`}>
                        {h.format === 'reel' ? <Video size={12} /> : h.format === 'prompted_reel' ? <span>🤖</span> : <Image size={12} />}
                        <span className="ml-1">{h.format}</span>
                      </span>
                      <span className={`badge ${h.pillar === 'awareness' ? 'blue' : h.pillar === 'education' ? 'green' : 'orange'}`}>
                        {h.pillar}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button className="btn-ghost" onClick={generateHooks} disabled={loading}>Rigenera</button>
                  <button data-testid="approve-hooks-btn" className="btn-gradient" onClick={saveHooksAndGenerate} disabled={loading}>
                    {loading ? 'Generazione contenuti...' : 'Approva e Genera Contenuti'} <ArrowRight weight="bold" size={18} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* STEP 4: Content Generation */}
        {step === 4 && (
          <motion.div key="content" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)] flex items-center justify-center">
              <Sparkle weight="fill" size={40} color="white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{loading ? 'Generazione in Corso...' : 'Progetto Completato!'}</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-sm">
              {loading ? 'L\'AI sta creando i contenuti.' : `${genProgress} contenuti generati con successo.`}
            </p>
            {loading && (
              <div className="max-w-md mx-auto mb-8">
                <div className="progress-bar">
                  <motion.div className="progress-fill" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 30, ease: 'linear' }} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
