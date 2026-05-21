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

const AddItemModal = ({ isAdding, setIsAdding, newItem, setNewItem, addItem }) => {
  const update = (patch) => setNewItem({ ...newItem, ...patch });
  const changeProfile = (profile) => {
    const validIds = pilaresForProfile(profile).map(p => p.id);
    const pilar = validIds.includes(newItem.pilar) ? newItem.pilar : '';
    setNewItem({ ...newItem, profile, pilar });
  };
  const availablePilares = pilaresForProfile(newItem.profile);
  const showPostFields = newItem.initialStage === 'postar' || newItem.initialStage === 'editar';

  return (
    <AnimatePresence>
      {isAdding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsAdding(false)}
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
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Nova Tarefa</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5 tracking-wider">
                  Preencha só o que importa agora — você ajusta depois
                </p>
              </div>
              <button
                onClick={() => setIsAdding(false)}
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-full transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-8">
              <Section title="Identidade">
                <div>
                  <Label>Começar em qual etapa?</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {STAGES.map(s => {
                      const active = newItem.initialStage === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => update({ initialStage: s.id })}
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
                    placeholder="Ex: Vídeo sobre organização"
                    className={inputBase + ' text-base'}
                    value={newItem.objective}
                    onChange={(e) => update({ objective: e.target.value })}
                    autoFocus
                  />
                </div>

                <div>
                  <Label>Roteiro / Resumo</Label>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-400 transition-colors">
                    <ReactQuill
                      theme="snow"
                      value={newItem.summary}
                      onChange={(content) => update({ summary: content })}
                      placeholder="Gancho, promessa, tópicos e fechamento"
                    />
                  </div>
                </div>
              </Section>

              <Section title="Classificação">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <select className={inputBase + ' appearance-none'} value={newItem.contentType} onChange={(e) => update({ contentType: e.target.value })}>
                      <option value="video_curto">Vídeo curto</option>
                      <option value="youtube">YouTube</option>
                      <option value="stories">Stories</option>
                      <option value="estatico">Estático</option>
                      <option value="carrossel">Carrossel</option>
                    </select>
                  </div>
                  <div>
                    <Label>Perfil</Label>
                    <select className={inputBase + ' appearance-none'} value={newItem.profile} onChange={(e) => changeProfile(e.target.value)}>
                      <option value="opa">OPA</option>
                      <option value="marco">Marco</option>
                      <option value="collab">Collab (OPA + Marco)</option>
                    </select>
                  </div>
                  <div>
                    <Label>Participação</Label>
                    <select className={inputBase + ' appearance-none'} value={newItem.recordingType} onChange={(e) => update({ recordingType: e.target.value })}>
                      <option value="sozinho">Sozinho</option>
                      <option value="com_alguem">Dois</option>
                    </select>
                  </div>
                </div>

                {newItem.contentType === 'stories' && (
                  <div>
                    <Label>Modo do Story</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => update({ storyMode: 'aovivo' })}
                        className={`p-3.5 rounded-xl font-black uppercase text-sm border-2 transition-all ${newItem.storyMode === 'aovivo' ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-rose-300 hover:bg-white'}`}
                      >
                        Ao vivo
                        <br />
                        <span className="text-[9px] font-bold normal-case opacity-80">Gravar e postar agora</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => update({ storyMode: 'banco' })}
                        className={`p-3.5 rounded-xl font-black uppercase text-sm border-2 transition-all ${newItem.storyMode === 'banco' ? 'bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-violet-300 hover:bg-white'}`}
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
                    value={newItem.pilar || ''}
                    onChange={(e) => update({ pilar: e.target.value })}
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
                    checked={Boolean(newItem.banco)}
                    onChange={(e) => update({ banco: e.target.checked })}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase text-slate-700 tracking-wider">Salvar no banco</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Conteúdo pronto sem data definida — fica disponível pra encaixar depois</p>
                  </div>
                </label>

                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${newItem.banco ? 'opacity-50' : ''}`}>
                  <div>
                    <Label>Dia para gravar</Label>
                    <input
                      type="date"
                      className={inputBase}
                      value={newItem.recordingDate}
                      onChange={(e) => update({ recordingDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Dia para postar</Label>
                    <input
                      type="date"
                      className={inputBase}
                      value={newItem.postDate}
                      onChange={(e) => update({ postDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Responsável edição</Label>
                    <select
                      className={inputBase + ' appearance-none'}
                      value={newItem.editor}
                      onChange={(e) => update({ editor: e.target.value })}
                    >
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
                      value={newItem.time}
                      onChange={(e) => update({ time: e.target.value })}
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
                      value={newItem.primaryLink}
                      onChange={(e) => update({ primaryLink: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Link do arquivo editado</Label>
                    <input
                      type="text"
                      placeholder="Pasta completa"
                      className={inputBase}
                      value={newItem.editedVideoLink}
                      onChange={(e) => update({ editedVideoLink: e.target.value })}
                    />
                  </div>
                </div>
              </Section>

              {showPostFields && (
                <Section title="Publicação">
                  <div>
                    <Label>Legenda do post</Label>
                    <textarea
                      rows={3}
                      className={inputBase + ' resize-none'}
                      value={newItem.postCaption}
                      onChange={(e) => update({ postCaption: e.target.value })}
                      placeholder="Escreva a legenda aqui..."
                    />
                  </div>
                  <div>
                    <Label>Primeiro comentário</Label>
                    <textarea
                      rows={2}
                      className={inputBase + ' resize-none'}
                      value={newItem.firstComment}
                      onChange={(e) => update({ firstComment: e.target.value })}
                      placeholder="Comentário fixado / link / CTA..."
                    />
                  </div>
                </Section>
              )}
            </div>

            <footer className="flex items-center gap-3 px-7 py-4 border-t border-slate-100 bg-slate-50/40">
              <button
                onClick={() => setIsAdding(false)}
                className="px-6 bg-white border border-slate-200 text-slate-600 font-black py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-xs uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={addItem}
                className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 text-xs uppercase tracking-wider transition-colors shadow-lg shadow-blue-600/20"
              >
                Salvar tarefa
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddItemModal;
