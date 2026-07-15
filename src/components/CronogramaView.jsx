import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ArrowUpRight, AlignLeft, Copy, Check, X } from 'lucide-react';
import { daysOfWeek, addDays, parseWeekKey, formatDateShort, getTodayDayId } from '../lib/dates';
import { getContentTypeTag, getProfileTag } from '../lib/tags';

// Mapeia o contentType/pilar do item para o estilo de badge do cronograma da OPA.
// Réplica das classes do HTML original: azul (padrão), roxo (motion), verde
// (estático) e laranja (lançamento).
const badgeStyle = (item) => {
  const ct = item.contentType;
  if (item.pilar === 'lancamentos') return { cls: 'bg-orange-100 text-orange-800', label: 'Lançamento' };
  if (ct === 'estatico') return { cls: 'bg-teal-50 text-teal-700', label: 'Estático' };
  if (ct === 'carrossel') return { cls: 'bg-blue-50 text-blue-700', label: 'Carrossel' };
  if (ct === 'stories' || ct === 'repost_stories') return { cls: 'bg-rose-50 text-rose-700', label: getContentTypeTag(ct) };
  if (ct === 'youtube' || ct === 'video_longo') return { cls: 'bg-red-50 text-red-700', label: 'YouTube' };
  // vídeo curto e demais → "Reels", o rótulo dominante no cronograma original
  return { cls: 'bg-blue-50 text-blue-700', label: 'Reels' };
};

const MaterialLink = ({ href, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800 w-fit mt-1.5 border-b border-transparent hover:border-blue-300 transition-colors"
  >
    <ArrowUpRight className="w-3 h-3 flex-shrink-0" strokeWidth={2.2} />
    {label}
  </a>
);

const PostCard = ({ item, onOpenCaption }) => {
  const badge = badgeStyle(item);
  const materialHref = item.primaryLink || item.secondaryLink || item.editedVideoLink;
  const isVideoLink = /drive\.google|youtu/.test(materialHref || '');
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3.5 py-3 flex flex-col gap-1 hover:border-blue-200 transition-colors">
      <span className={`inline-flex items-center gap-1 text-[9.5px] font-semibold tracking-wider uppercase rounded px-1.5 py-0.5 w-fit ${badge.cls}`}>
        {badge.label}
      </span>
      <p className="text-[13px] font-medium text-slate-900 leading-snug">{item.objective}</p>
      {item.time && (
        <p className="text-[11.5px] text-slate-400 italic leading-tight mt-0.5">{item.time}</p>
      )}
      {materialHref && (
        <MaterialLink href={materialHref} label={isVideoLink ? 'Ver vídeo' : 'Ver materiais'} />
      )}
      {item.postCaption && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onOpenCaption(item.postCaption); }}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-900 w-fit mt-1.5 border-b border-transparent hover:border-slate-300 transition-colors"
        >
          <AlignLeft className="w-3 h-3 flex-shrink-0" strokeWidth={2.2} />
          Legenda
        </button>
      )}
    </div>
  );
};

// Modal de legenda — réplica do modal do HTML (mostra o texto e copia).
const CaptionModal = ({ open, text, onClose }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl relative flex flex-col max-h-[85vh]"
          >
            <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Legenda do Post</h3>
              <button onClick={onClose} aria-label="Fechar" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </header>
            <div className="px-5 py-4 overflow-y-auto">
              <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap font-sans">{text}</pre>
            </div>
            <footer className="px-5 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={copy}
                className={`inline-flex items-center gap-2 text-[13px] font-medium text-white rounded-lg px-4 py-2 transition-colors ${copied ? 'bg-teal-600' : 'bg-blue-600 hover:bg-blue-800'}`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar Legenda'}
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Agrupa os itens de "postar" da semana atual por dia, respeitando a ordem
// dos dias e o filtro de perfil vindo do App.
export const CronogramaView = ({ weekData, weekKey, onAddAtDay, profileMatchesFilter, profileFilter }) => {
  const [caption, setCaption] = useState({ open: false, text: '' });
  const todayId = getTodayDayId();

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 items-start">
        {daysOfWeek.map((day, dayIndex) => {
          const items = (weekData?.postar?.[day.id] || [])
            .filter(item => !item.banco && profileMatchesFilter(item.profile, profileFilter));
          const dateLabel = formatDateShort(addDays(parseWeekKey(weekKey), dayIndex));
          const isToday = day.id === todayId;

          return (
            <div key={day.id} className="flex flex-col gap-2">
              {/* Cabeçalho do dia com o "+" */}
              <div className={`flex items-end justify-between pb-2 mb-1 border-b-2 ${isToday ? 'border-blue-600' : 'border-slate-200'}`}>
                <div>
                  <p className={`text-[11px] font-semibold tracking-wider uppercase ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                    {day.label.slice(0, 3)}
                  </p>
                  <p className={`text-xl font-light leading-none mt-1 ${isToday ? 'text-blue-300' : 'text-slate-300'}`}>
                    {dateLabel.split('/')[0]}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onAddAtDay(day.id)}
                  aria-label={`Adicionar postagem em ${day.label}`}
                  title={`Adicionar postagem em ${day.label}`}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.4} />
                </button>
              </div>

              {/* Cards do dia */}
              {items.map(item => (
                <PostCard key={item.id} item={item} onOpenCaption={(text) => setCaption({ open: true, text })} />
              ))}

              {items.length === 0 && (
                <button
                  type="button"
                  onClick={() => onAddAtDay(day.id)}
                  className="text-[11px] text-slate-300 hover:text-blue-500 py-2 text-left transition-colors"
                >
                  + adicionar
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Legenda dos tipos — réplica do footer do HTML */}
      <div className="flex flex-wrap items-center gap-5 mt-10 pt-6 border-t border-slate-200">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">Tipos</span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-blue-600" />Reels · Carrossel · Post</span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-teal-600" />Estático</span>
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" />Lançamento</span>
      </div>

      <CaptionModal open={caption.open} text={caption.text} onClose={() => setCaption({ open: false, text: '' })} />
    </div>
  );
};

export default CronogramaView;
