import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import ReactQuill from 'react-quill-new';

const EditItemModal = ({ editModal, setEditModal, activeTab, handleSaveEdit }) => {
  if (!editModal.isOpen || !editModal.item) return null;

  const item = editModal.item;
  const close = () => setEditModal({ isOpen: false, dayId: null, item: null, itemWeekKey: null });
  const patch = (p) => setEditModal({ ...editModal, item: { ...item, ...p } });
  const showPostFields = activeTab === 'postar' || activeTab === 'editar';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={close}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 rounded-[32px] p-6 md:p-8 max-w-xl w-full shadow-2xl relative border border-slate-700">
          <button onClick={close} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-black text-white uppercase mb-6 pr-10">Editar tarefa</h3>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Título da Tarefa</label>
                <input type="text" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-base" value={item.objective || ''} onChange={(e) => patch({ objective: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Etapa Atual</label>
                <select className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none" value={item.tabKey || 'gravar'} onChange={(e) => patch({ tabKey: e.target.value })}>
                  <option value="gravar">Gravar</option>
                  <option value="editar">Editar</option>
                  <option value="postar">Postar</option>
                </select>
              </div>
            </div>

            {item.contentType === 'stories' && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Modo do Story</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => patch({ storyMode: 'aovivo' })} className={`p-4 rounded-xl font-black uppercase text-sm border-2 transition-all ${(item.storyMode || 'aovivo') === 'aovivo' ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-rose-500/50'}`}>
                    🔴 Ao vivo<br /><span className="text-[9px] font-bold normal-case opacity-90">Gravar e postar agora</span>
                  </button>
                  <button type="button" onClick={() => patch({ storyMode: 'banco' })} className={`p-4 rounded-xl font-black uppercase text-sm border-2 transition-all ${item.storyMode === 'banco' ? 'bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-violet-500/50'}`}>
                    📦 Banco<br /><span className="text-[9px] font-bold normal-case opacity-90">Guardar para depois</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Roteiro / Resumo</label>
              <div className="bg-white text-slate-800 rounded-xl overflow-hidden mb-2">
                <ReactQuill theme="snow" value={item.summary || ''} onChange={(content) => patch({ summary: content })} />
              </div>
            </div>

            {showPostFields && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Legenda do post</label>
                <textarea rows={4} className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm resize-none" value={item.postCaption || ''} onChange={(e) => patch({ postCaption: e.target.value })} placeholder="Escreva a legenda aqui..." />
              </div>
            )}

            {showPostFields && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Primeiro comentário</label>
                <textarea rows={3} className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm resize-none" value={item.firstComment || ''} onChange={(e) => patch({ firstComment: e.target.value })} placeholder="Comentário fixado / link / CTA..." />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Dia para Gravar</label>
                <input type="date" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" value={item.recordingDate || ''} onChange={(e) => patch({ recordingDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Dia para Postar</label>
                <input type="date" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" value={item.postDate || ''} onChange={(e) => patch({ postDate: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Perfil</label>
                <select className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none" value={item.profile || 'opa'} onChange={(e) => patch({ profile: e.target.value })}>
                  <option value="opa">OPA</option>
                  <option value="marco">Marco</option>
                  <option value="collab">Collab (OPA + Marco)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Responsável Edição</label>
                <select className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none" value={item.editor || 'allyson'} onChange={(e) => patch({ editor: e.target.value })}>
                  <option value="allyson">Allyson</option>
                  <option value="kallyl">Kallyl</option>
                  <option value="natalia">Natalia</option>
                  <option value="torres">★ Torres (Externo)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Horario da postagem</label>
                <input type="text" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" value={item.time || ''} onChange={(e) => patch({ time: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Link do Vídeo Bruto</label>
                <input type="text" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" value={item.primaryLink || ''} onChange={(e) => patch({ primaryLink: e.target.value })} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Link do Arquivo Editado</label>
                <input type="text" className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" value={item.editedVideoLink || ''} onChange={(e) => patch({ editedVideoLink: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 text-sm uppercase">
              Salvar alteracoes
            </button>
            <button onClick={close} className="px-8 bg-slate-800 text-white font-black py-4 rounded-xl hover:bg-slate-700 text-sm uppercase">
              Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditItemModal;
