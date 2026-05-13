import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import ReactQuill from 'react-quill-new';

const STAGES = [
  { id: 'gravar', label: 'Gravar', hint: 'Ainda vai gravar', cls: 'bg-blue-500 border-blue-400 shadow-blue-500/30' },
  { id: 'editar', label: 'Editar', hint: 'Ja gravado', cls: 'bg-amber-500 border-amber-400 shadow-amber-500/30' },
  { id: 'postar', label: 'Postar', hint: 'Ja editado', cls: 'bg-emerald-500 border-emerald-400 shadow-emerald-500/30' }
];

const AddItemModal = ({ isAdding, setIsAdding, newItem, setNewItem, addItem }) => {
  const update = (patch) => setNewItem({ ...newItem, ...patch });

  return (
    <AnimatePresence>
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 rounded-[32px] p-6 md:p-8 max-w-2xl w-full shadow-2xl relative border border-slate-700 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full z-10">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-black text-white uppercase mb-6 pr-10">Nova Tarefa</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Começar em qual etapa?</label>
                <div className="grid grid-cols-3 gap-2">
                  {STAGES.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => update({ initialStage: s.id })}
                      className={`p-3 rounded-xl font-black uppercase text-xs border-2 transition-all ${newItem.initialStage === s.id ? `${s.cls} text-white shadow-lg` : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'}`}
                    >
                      {s.label}<br /><span className="text-[9px] font-bold normal-case opacity-90">{s.hint}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Título da Tarefa</label>
                <input
                  type="text"
                  placeholder="Ex: Video sobre organização"
                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-base placeholder:text-slate-600"
                  value={newItem.objective}
                  onChange={(e) => update({ objective: e.target.value })}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Roteiro / Resumo</label>
                <div className="bg-white text-slate-800 rounded-xl overflow-hidden mb-2">
                  <ReactQuill theme="snow" value={newItem.summary} onChange={(content) => update({ summary: content })} placeholder="GANCHO, PROMESSA, TOPICOS E FECHAMENTO" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Tipo</label>
                  <select className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none" value={newItem.contentType} onChange={(e) => update({ contentType: e.target.value })}>
                    <option value="video_curto">Video curto</option>
                    <option value="youtube">YouTube</option>
                    <option value="stories">Stories</option>
                    <option value="estatico">Estático</option>
                    <option value="carrossel">Carrossel</option>
                  </select>
                </div>
                {newItem.contentType === 'stories' && (
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Modo do Story</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => update({ storyMode: 'aovivo' })} className={`p-4 rounded-xl font-black uppercase text-sm border-2 transition-all ${newItem.storyMode === 'aovivo' ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-rose-500/50'}`}>
                        🔴 Ao vivo<br /><span className="text-[9px] font-bold normal-case opacity-90">Gravar e postar agora</span>
                      </button>
                      <button type="button" onClick={() => update({ storyMode: 'banco' })} className={`p-4 rounded-xl font-black uppercase text-sm border-2 transition-all ${newItem.storyMode === 'banco' ? 'bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-violet-500/50'}`}>
                        📦 Banco<br /><span className="text-[9px] font-bold normal-case opacity-90">Guardar para depois</span>
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Perfil</label>
                  <select className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none" value={newItem.profile} onChange={(e) => update({ profile: e.target.value })}>
                    <option value="opa">OPA</option>
                    <option value="marco">Marco</option>
                    <option value="collab">Collab (OPA + Marco)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Participacao</label>
                  <select className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none" value={newItem.recordingType} onChange={(e) => update({ recordingType: e.target.value })}>
                    <option value="sozinho">Sozinho</option>
                    <option value="com_alguem">Dois</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Dia para Gravar</label>
                  <input type="date" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" value={newItem.recordingDate} onChange={(e) => update({ recordingDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Dia para Postar</label>
                  <input type="date" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" value={newItem.postDate} onChange={(e) => update({ postDate: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Responsável Edição</label>
                  <select className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none" value={newItem.editor} onChange={(e) => update({ editor: e.target.value })}>
                    <option value="allyson">Allyson</option>
                    <option value="kallyl">Kallyl</option>
                    <option value="natalia">Natalia</option>
                    <option value="torres">★ Torres (Externo)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Horario da Postagem</label>
                  <input type="text" placeholder="Ex: 14:00" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600" value={newItem.time} onChange={(e) => update({ time: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Link do Vídeo Bruto</label>
                  <input type="text" placeholder="Link do drive" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600" value={newItem.primaryLink} onChange={(e) => update({ primaryLink: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Link do Arquivo Editado</label>
                  <input type="text" placeholder="Pasta completa (já deixarei preenchido)" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600" value={newItem.editedVideoLink} onChange={(e) => update({ editedVideoLink: e.target.value })} />
                </div>
              </div>

              {(newItem.initialStage === 'postar' || newItem.initialStage === 'editar') && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Legenda do post</label>
                    <textarea rows={3} className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm resize-none placeholder:text-slate-600" value={newItem.postCaption} onChange={(e) => update({ postCaption: e.target.value })} placeholder="Escreva a legenda aqui..." />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Primeiro comentário</label>
                    <textarea rows={2} className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm resize-none placeholder:text-slate-600" value={newItem.firstComment} onChange={(e) => update({ firstComment: e.target.value })} placeholder="Comentário fixado / link / CTA..." />
                  </div>
                </>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-slate-800">
                <button onClick={addItem} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 text-sm uppercase">
                  Salvar Tarefa
                </button>
                <button onClick={() => setIsAdding(false)} className="px-8 bg-slate-800 text-white font-black py-4 rounded-xl hover:bg-slate-700 text-sm uppercase">
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddItemModal;
