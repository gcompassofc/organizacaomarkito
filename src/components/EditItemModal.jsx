import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import { pilaresForProfile } from '../lib/tags';

const STAGES = [
  { id: 'gravar', label: 'Gravar', hint: 'Ainda vai gravar', selected: 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20' },
  { id: 'editar', label: 'Editar', hint: 'Já gravado', selected: 'bg-amber-500 border-amber-400 text-white shadow-lg shadow-amber-500/20' },
  { id: 'postar', label: 'Postar', hint: 'Já editado', selected: 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' }
];

const inputBase =
  'w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors';

const Label = ({ children }) => (
  <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-wider">{children}</label>
);

const Section = ({ title, children }) => (
  <section>
    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 pb-2 border-b border-slate-100">
      {title}
    </h4>
    <div className="space-y-4">{children}</div>
  </section>
);

const EditItemModal = ({ editModal, setEditModal, activeTab, handleSaveEdit }) => {
  if (!editModal.isOpen || !editModal.item) return null;

  const item = editModal.item;
  const close = () => setEditModal({ isOpen: false, dayId: null, item: null, itemWeekKey: null, sourceStage: null });
  const patch = (p) => setEditModal({ ...editModal, item: { ...item, ...p } });
  const currentStage = item.tabKey || activeTab || 'gravar';
  const showPostFields = currentStage === 'postar' || currentStage === 'editar';
  const changeProfile = (profile) => {
    const validIds = pilaresForProfile(profile).map(p => p.id);
    const pilar = validIds.includes(item.pilar) ? item.pilar : '';
    patch({ profile, pilar });
  };
  const availablePilares = pilaresForProfile(item.profile);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={close}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-[28px] max-w-2xl w-full shadow-2xl shadow-slate-900/30 relative max-h-[90vh] flex flex-col"
        >
          <header className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Editar tarefa</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                Qualquer campo pode ser alterado a qualquer momento
              </p>
            </div>
            <button
              onClick={close}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-7 py-6 space-y-8">
            <Section title="Identidade">
              <div>
                <Label>Etapa atual</Label>
                <div className="grid grid-cols-3 gap-3">
                  {STAGES.map(s => {
                    const active = currentStage === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => patch({ tabKey: s.id })}
                        className={`p-3.5 rounded-xl font-black uppercase text-xs border-2 transition-all ${active ? s.selected : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-white'}`}
                      >
                        {s.label}
                        <br />
                        <span className={`text-[9px] font-bold normal-case ${active ? 'opacity-90' : 'opacity-70'}`}>
                          {s.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Título da Tarefa</Label>
                <input
                  type="text"
                  className={inputBase + ' text-base'}
                  value={item.objective || ''}
                  onChange={(e) => patch({ objective: e.target.value })}
                />
              </div>

              <div>
                <Label>Roteiro / Resumo</Label>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-400 transition-colors">
                  <ReactQuill
                    theme="snow"
                    value={item.summary || ''}
                    onChange={(content) => patch({ summary: content })}
                    placeholder="Gancho, promessa, tópicos e fechamento"
                  />
                </div>
              </div>
            </Section>

            <Section title="Classificação">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <select className={inputBase + ' appearance-none'} value={item.contentType || 'video_curto'} onChange={(e) => patch({ contentType: e.target.value })}>
                    <option value="video_curto">Vídeo curto</option>
                    <option value="youtube">YouTube</option>
                    <option value="stories">Stories</option>
                    <option value="estatico">Estático</option>
                    <option value="carrossel">Carrossel</option>
                  </select>
                </div>
                <div>
                  <Label>Perfil</Label>
                  <select className={inputBase + ' appearance-none'} value={item.profile || 'opa'} onChange={(e) => changeProfile(e.target.value)}>
                    <option value="opa">OPA</option>
                    <option value="marco">Marco</option>
                    <option value="collab">Collab (OPA + Marco)</option>
                  </select>
                </div>
                <div>
                  <Label>Participação</Label>
                  <select className={inputBase + ' appearance-none'} value={item.recordingType || 'sozinho'} onChange={(e) => patch({ recordingType: e.target.value })}>
                    <option value="sozinho">Sozinho</option>
                    <option value="com_alguem">Dois</option>
                  </select>
                </div>
              </div>

              {item.contentType === 'stories' && (
                <div>
                  <Label>Modo do Story</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => patch({ storyMode: 'aovivo' })}
                      className={`p-3.5 rounded-xl font-black uppercase text-sm border-2 transition-all ${(item.storyMode || 'aovivo') === 'aovivo' ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-rose-300 hover:bg-white'}`}
                    >
                      Ao vivo
                      <br />
                      <span className="text-[9px] font-bold normal-case opacity-80">Gravar e postar agora</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => patch({ storyMode: 'banco' })}
                      className={`p-3.5 rounded-xl font-black uppercase text-sm border-2 transition-all ${item.storyMode === 'banco' ? 'bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-violet-300 hover:bg-white'}`}
                    >
                      Banco
                      <br />
                      <span className="text-[9px] font-bold normal-case opacity-80">Guardar para depois</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <Label>Pilar de conteúdo</Label>
                <select
                  className={inputBase + ' appearance-none'}
                  value={item.pilar || ''}
                  onChange={(e) => patch({ pilar: e.target.value })}
                >
                  <option value="">— Sem pilar definido —</option>
                  {availablePilares.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>
            </Section>

            <Section title="Agenda & Equipe">
              <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={Boolean(item.banco)}
                  onChange={(e) => patch({ banco: e.target.checked })}
                  className="w-4 h-4 accent-blue-600"
                />
                <div className="flex-1">
                  <p className="text-xs font-black uppercase text-slate-700 tracking-wider">Salvar no banco</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Conteúdo pronto sem data definida — fica disponível pra encaixar depois</p>
                </div>
              </label>

              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${item.banco ? 'opacity-50' : ''}`}>
                <div>
                  <Label>Dia para gravar</Label>
                  <input
                    type="date"
                    className={inputBase}
                    value={item.recordingDate || ''}
                    onChange={(e) => patch({ recordingDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Dia para postar</Label>
                  <input
                    type="date"
                    className={inputBase}
                    value={item.postDate || ''}
                    onChange={(e) => patch({ postDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Responsável edição</Label>
                  <select
                    className={inputBase + ' appearance-none'}
                    value={item.editor || 'indefinido'}
                    onChange={(e) => patch({ editor: e.target.value })}
                  >
                    <option value="indefinido">— Indefinido —</option>
                    <option value="allyson">Allyson</option>
                    <option value="kallyl">Kallyl</option>
                    <option value="natalia">Natalia</option>
                    <option value="torres">★ Torres (Externo)</option>
                  </select>
                </div>
                <div>
                  <Label>Horário da postagem</Label>
                  <input
                    type="text"
                    placeholder="Ex: 14:00"
                    className={inputBase}
                    value={item.time || ''}
                    onChange={(e) => patch({ time: e.target.value })}
                  />
                </div>
              </div>
            </Section>

            <Section title="Links">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Link do vídeo bruto</Label>
                  <input
                    type="text"
                    placeholder="Link do Drive"
                    className={inputBase}
                    value={item.primaryLink || ''}
                    onChange={(e) => patch({ primaryLink: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Link do arquivo editado</Label>
                  <input
                    type="text"
                    placeholder="Pasta completa"
                    className={inputBase}
                    value={item.editedVideoLink || ''}
                    onChange={(e) => patch({ editedVideoLink: e.target.value })}
                  />
                </div>
              </div>
            </Section>

            {showPostFields && (
              <Section title="Publicação">
                <div>
                  <Label>Legenda do post</Label>
                  <textarea
                    rows={4}
                    className={inputBase + ' resize-none'}
                    value={item.postCaption || ''}
                    onChange={(e) => patch({ postCaption: e.target.value })}
                    placeholder="Escreva a legenda aqui..."
                  />
                </div>
                <div>
                  <Label>Primeiro comentário</Label>
                  <textarea
                    rows={3}
                    className={inputBase + ' resize-none'}
                    value={item.firstComment || ''}
                    onChange={(e) => patch({ firstComment: e.target.value })}
                    placeholder="Comentário fixado / link / CTA..."
                  />
                </div>
              </Section>
            )}
          </div>

          <footer className="flex items-center gap-3 px-7 py-4 border-t border-slate-100 bg-slate-50/40">
            <button
              onClick={close}
              className="px-6 bg-white border border-slate-200 text-slate-600 font-black py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-xs uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-600/20"
            >
              Salvar alterações
            </button>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditItemModal;
