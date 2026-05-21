import React from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  GripVertical,
  Scissors,
  Trash2
} from 'lucide-react';
import {
  getRecordingTag,
  getContentTypeTag,
  getContentTypeBadgeClass,
  getProfileTag,
  getProfileBadgeClass
} from '../lib/tags';
import { formatDateShort } from '../lib/dates';
import { stripHtml } from '../lib/planner';
import { radius, text } from '../lib/ui';

export const TaskCard = ({
  item,
  dayId,
  itemWeekKey,
  activeTab,
  captionCopiedId,
  firstCommentCopiedId,
  onDragStart,
  onToggleComplete,
  onClick,
  onSummaryClick,
  onCopyCaption,
  onCopyFirstComment,
  onRemove
}) => {
  const isGravarList = activeTab === 'gravar';
  const isEditarAoVivo =
    activeTab === 'editar' &&
    item.contentType === 'stories' &&
    (item.storyMode || 'aovivo') === 'aovivo';
  const draggable = activeTab !== 'editar' && !isGravarList;

  return (
    <motion.div
      layout
      key={item.id}
      draggable={draggable}
      onDragStart={() => onDragStart(dayId, item, itemWeekKey)}
      onClick={() => onClick(dayId, item, itemWeekKey)}
      className={`group/item relative flex items-start md:items-center justify-between p-4 md:p-5 ${radius.card} border-2 ${item.completed ? 'bg-slate-50/50 border-transparent opacity-50' : isEditarAoVivo ? 'bg-rose-50/40 border-rose-300 border-l-[6px] border-l-rose-500 shadow-sm' : 'bg-white border-slate-50 hover:border-blue-200 shadow-sm'} cursor-pointer`}
    >
      {isEditarAoVivo && (
        <div className={`absolute -top-2.5 left-6 inline-flex items-center gap-1.5 bg-rose-500 text-white px-3 py-0.5 rounded-full ${text.badge} shadow-md`}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Ao vivo — só baixar
        </div>
      )}
      <div className="flex items-start md:items-center space-x-3 md:space-x-4 flex-1 min-w-0">
        {draggable && (
          <div className="text-slate-300 cursor-grab active:cursor-grabbing mt-1 md:mt-0">
            <GripVertical className="w-5 h-5" />
          </div>
        )}
        <button
          onClick={(e) => onToggleComplete(e, dayId, item.id, itemWeekKey)}
          className={`flex-shrink-0 mt-0.5 md:mt-0 ${item.completed ? 'text-emerald-500' : 'text-slate-200 hover:text-blue-500'}`}
        >
          <CheckCircle2 className="w-7 h-7 md:w-10 md:h-10" strokeWidth={2.5} />
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm md:text-base leading-snug md:leading-normal font-bold text-slate-800 ${item.completed ? 'line-through text-slate-400 italic' : ''}`}>
            {item.objective}
          </p>
          {item.summary && (
            <div className="flex flex-col mt-2 md:mt-3 space-y-2 md:space-y-3">
              <p className={`text-[11px] md:text-xs font-medium line-clamp-2 ${item.completed ? 'text-slate-300' : 'text-slate-500'}`}>
                {stripHtml(item.summary)}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); onSummaryClick(item); }}
                className="w-full md:w-auto self-start text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 md:py-2 rounded-xl md:rounded-lg font-black uppercase transition-colors text-center"
              >
                Ler resumo completo
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {item.contentType && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded ${text.badge} ${getContentTypeBadgeClass(item.contentType, activeTab === 'gravar' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')}`}>
                {getContentTypeTag(item.contentType)}
              </span>
            )}
            {activeTab === 'gravar' && item.recordingType && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded ${text.badge} ${item.recordingType === 'sozinho' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                {getRecordingTag(item.recordingType)}
              </span>
            )}
            {item.profile && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded ${text.badge} ${getProfileBadgeClass(item.profile)}`}>
                {getProfileTag(item.profile)}
              </span>
            )}
            {activeTab === 'editar' && item.editor && (
              item.editor === 'torres' ? (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${text.badge} bg-violet-600 text-white shadow-sm ring-1 ring-violet-300`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Torres • Externo
                </span>
              ) : (
                <span className={`inline-flex items-center px-2 py-0.5 rounded ${text.badge} bg-amber-100 text-amber-700`}>
                  Editor: {item.editor}
                </span>
              )
            )}
            {activeTab === 'postar' && item.time && (
              <span className={`flex items-center ${text.label} ${item.completed ? 'text-slate-300' : 'text-slate-400'}`}>
                <Clock className="w-3 h-3 mr-1" />
                {item.time}
              </span>
            )}
            {(activeTab === 'editar' || activeTab === 'postar') && item.postDate && (
              <span className={`flex items-center ${text.label} ${item.completed ? 'text-slate-300' : 'text-slate-400'}`}>
                <Calendar className="w-3 h-3 mr-1" />
                Postar: {formatDateShort(item.postDate)}
              </span>
            )}
          </div>

          {activeTab === 'gravar' && item.primaryLink && (
            <a href={item.primaryLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center text-[10px] font-black mt-2 mr-3 uppercase underline decoration-2 underline-offset-4 text-blue-500 hover:text-blue-700">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Suba o vídeo aqui
            </a>
          )}
          {activeTab === 'editar' && item.primaryLink && (
            <a href={item.primaryLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center text-[10px] font-black mt-2 mr-3 uppercase underline decoration-2 underline-offset-4 text-blue-500 hover:text-blue-700">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Baixe o vídeo bruto aqui
            </a>
          )}
          {activeTab === 'editar' && item.editedVideoLink && (
            <a href={item.editedVideoLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center text-[10px] font-black mt-2 mr-3 uppercase underline decoration-2 underline-offset-4 text-emerald-500 hover:text-emerald-700">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Arquivo editado
            </a>
          )}
          {activeTab === 'postar' && item.editedVideoLink && (
            <a href={item.editedVideoLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center text-[10px] font-black mt-2 mr-3 uppercase underline decoration-2 underline-offset-4 text-emerald-500 hover:text-emerald-700">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Baixe o vídeo editado aqui
            </a>
          )}

          {activeTab === 'postar' && item.postCaption && (
            <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-slate-400 uppercase">Legenda do post</p>
                <button
                  onClick={(e) => onCopyCaption(e, item)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${text.badge} transition-all ${captionCopiedId === item.id ? 'bg-emerald-500 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                >
                  {captionCopiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{captionCopiedId === item.id ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{item.postCaption}</p>
            </div>
          )}
          {activeTab === 'postar' && item.firstComment && (
            <div className="mt-2 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-indigo-500 uppercase">Primeiro comentário</p>
                <button
                  onClick={(e) => onCopyFirstComment(e, item)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${text.badge} transition-all ${firstCommentCopiedId === item.id ? 'bg-emerald-500 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                >
                  {firstCommentCopiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{firstCommentCopiedId === item.id ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap">{item.firstComment}</p>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={(e) => onRemove(e, dayId, item.id, itemWeekKey)}
        className="p-2 md:p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl mt-0 md:mt-0"
      >
        <Trash2 className="w-5 h-5 md:w-6 h-6" />
      </button>
    </motion.div>
  );
};

export const PreviewCard = ({ item, sourceWeekKey, onClick }) => (
  <motion.div
    layout
    key={`preview-${sourceWeekKey}-${item.id}`}
    onClick={() => onClick(item, sourceWeekKey)}
    className={`relative flex items-start md:items-center justify-between p-3 md:p-4 ${radius.preview} border-2 border-dashed border-amber-300 bg-amber-50/30 hover:bg-amber-50/60 cursor-pointer opacity-90`}
    title="Ainda em edição — vai aparecer aqui quando for marcado como editado"
  >
    <div className={`absolute -top-2.5 left-5 inline-flex items-center gap-1.5 bg-amber-500 text-white px-2.5 py-0.5 rounded-full ${text.badge} shadow-sm`}>
      <Scissors className="w-2.5 h-2.5" />
      Ainda em edição
    </div>
    <div className="flex items-start md:items-center space-x-3 flex-1 min-w-0 mt-1">
      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-base leading-snug font-bold text-slate-600 italic">
          {item.objective}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1.5">
          {item.contentType && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded ${text.badge} ${getContentTypeBadgeClass(item.contentType, 'bg-amber-100 text-amber-700')}`}>
              {getContentTypeTag(item.contentType)}
            </span>
          )}
          {item.editor && (
            item.editor === 'torres' ? (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${text.badge} bg-violet-600 text-white`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Torres • Externo
              </span>
            ) : (
              <span className={`inline-flex items-center px-2 py-0.5 rounded ${text.badge} bg-slate-100 text-slate-500`}>
                Editor: {item.editor}
              </span>
            )
          )}
          {item.time && (
            <span className={`flex items-center ${text.label} text-slate-400`}>
              <Clock className="w-3 h-3 mr-1" />
              {item.time}
            </span>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

export const SlimCard = ({ item, livesDayId, livesWeekKey, stageLabel, onClick }) => (
  <motion.div
    layout
    key={`slim-${livesWeekKey}-${livesDayId}-${item.id}`}
    onClick={() => onClick(item, livesDayId, livesWeekKey)}
    className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50/60 hover:bg-slate-100 cursor-pointer border border-slate-100"
  >
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
      <span className="text-xs font-bold text-slate-400 line-through italic truncate">{item.objective}</span>
    </div>
    {stageLabel && (
      <span className={`${text.micro} text-slate-300 ml-2 flex-shrink-0`}>{stageLabel}</span>
    )}
  </motion.div>
);
