import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
import { IconButton } from './ui/IconButton';

// Estilos compartilhados de badge — não usa Badge component direto pra preservar
// os mapeamentos coloridos por tipo/perfil que vêm de lib/tags.
const badgeBase = 'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase leading-none gap-1.5';
const metaText = 'inline-flex items-center text-[10px] font-semibold tracking-wider uppercase';

export const TaskCard = ({
  item,
  dayId,
  itemWeekKey,
  activeTab,
  captionCopiedId,
  firstCommentCopiedId,
  reorderable = false,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onToggleComplete,
  onClick,
  onSummaryClick,
  onCopyCaption,
  onCopyFirstComment,
  onRemove
}) => {
  const [expandedMobile, setExpandedMobile] = useState(false);
  const isGravarList = activeTab === 'gravar';
  const isEditarAoVivo =
    activeTab === 'editar' &&
    item.contentType === 'stories' &&
    (item.storyMode || 'aovivo') === 'aovivo';
  const draggable = activeTab !== 'editar' && !isGravarList;
  // Conteúdo "extra" só aparece no mobile quando expandido; no desktop sempre visível
  const extraVisible = expandedMobile ? '' : 'hidden md:block';
  // Links de ação (subir/baixar vídeo) ficam SEMPRE visíveis fora do "Mais detalhes" —
  // são a ação principal de cada etapa, não detalhe escondido.
  const hasExtras =
    Boolean(item.summary) ||
    (activeTab === 'postar' && (item.postCaption || item.firstComment));

  return (
    <motion.div
      layout
      key={item.id}
      draggable={draggable}
      onDragStart={() => onDragStart(dayId, item, itemWeekKey)}
      onClick={() => onClick(dayId, item, itemWeekKey)}
      className={`group/item relative flex items-start md:items-center justify-between p-4 md:p-5 ${radius.card} border ${item.completed ? 'bg-slate-50/50 border-transparent opacity-60' : isEditarAoVivo ? 'bg-rose-50/40 border-rose-300 border-l-4 border-l-rose-500 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-200 shadow-sm'} cursor-pointer transition-colors`}
    >
      {isEditarAoVivo && (
        <div className={`absolute -top-2.5 left-6 inline-flex items-center gap-1.5 bg-rose-500 text-white px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase leading-none shadow-md`}>
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Ao vivo — só baixar
        </div>
      )}
      <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1 min-w-0">
        {reorderable ? (
          <div className="flex flex-col gap-0.5 mt-0.5 md:mt-0 flex-shrink-0">
            <IconButton
              icon={ChevronUp}
              label="Mover para cima"
              size="sm"
              tone="neutral"
              onClick={(e) => { e.stopPropagation(); if (canMoveUp) onMoveUp(); }}
              disabled={!canMoveUp}
              className={!canMoveUp ? 'opacity-30 cursor-not-allowed' : ''}
            />
            <IconButton
              icon={ChevronDown}
              label="Mover para baixo"
              size="sm"
              tone="neutral"
              onClick={(e) => { e.stopPropagation(); if (canMoveDown) onMoveDown(); }}
              disabled={!canMoveDown}
              className={!canMoveDown ? 'opacity-30 cursor-not-allowed' : ''}
            />
          </div>
        ) : draggable ? (
          <div className="text-slate-300 cursor-grab active:cursor-grabbing mt-0.5 md:mt-0 hidden md:block">
            <GripVertical className="w-4 h-4" />
          </div>
        ) : null}
        <button
          onClick={(e) => onToggleComplete(e, dayId, item.id, itemWeekKey)}
          className={`flex-shrink-0 mt-0.5 md:mt-0 ${item.completed ? 'text-emerald-500' : 'text-slate-200 hover:text-blue-500'} transition-colors`}
          aria-label={item.completed ? 'Desmarcar' : 'Marcar como concluído'}
        >
          <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="flex-1 min-w-0">
          <p className={`${text.h3} text-slate-900 ${item.completed ? 'line-through text-slate-400 italic' : ''}`}>
            {item.objective}
          </p>
          {item.summary && (
            <div className={`${extraVisible} flex flex-col mt-3 gap-3`}>
              <p className={`text-xs leading-relaxed line-clamp-2 ${item.completed ? 'text-slate-300' : 'text-slate-500'}`}>
                {stripHtml(item.summary)}
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); onSummaryClick(item); }}
                className="w-full md:w-auto self-start text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold tracking-wider uppercase transition-colors"
              >
                Ler resumo completo
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {item.contentType && (
              <span className={`${badgeBase} ${getContentTypeBadgeClass(item.contentType, activeTab === 'gravar' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700')}`}>
                {getContentTypeTag(item.contentType)}
              </span>
            )}
            {activeTab === 'gravar' && item.recordingType && (
              <span className={`${badgeBase} ${item.recordingType === 'sozinho' ? 'bg-slate-100 text-slate-600' : 'bg-blue-50 text-blue-700'}`}>
                {getRecordingTag(item.recordingType)}
              </span>
            )}
            {item.profile && (
              <span className={`${badgeBase} ${getProfileBadgeClass(item.profile)}`}>
                {getProfileTag(item.profile)}
              </span>
            )}
            {activeTab === 'editar' && item.editor && (
              item.editor === 'torres' ? (
                <span className={`${badgeBase} bg-violet-600 text-white`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Torres • Externo
                </span>
              ) : item.editor === 'indefinido' ? (
                <span className={`${badgeBase} bg-slate-100 text-slate-500 italic`}>
                  Editor indefinido
                </span>
              ) : (
                <span className={`${badgeBase} bg-amber-50 text-amber-700`}>
                  Editor: {item.editor}
                </span>
              )
            )}
            {activeTab === 'postar' && item.time && (
              <span className={`${metaText} ${item.completed ? 'text-slate-300' : 'text-slate-500'}`}>
                <Clock className="w-3 h-3 mr-1" />
                {item.time}
              </span>
            )}
            {(activeTab === 'editar' || activeTab === 'postar') && item.postDate && (
              <span className={`${metaText} ${item.completed ? 'text-slate-300' : 'text-slate-500'}`}>
                <Calendar className="w-3 h-3 mr-1" />
                Postar: {formatDateShort(item.postDate)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {activeTab === 'gravar' && (
              item.primaryLink ? (
                <a
                  href={item.primaryLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Suba o vídeo aqui
                </a>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onClick(dayId, item, itemWeekKey); }}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-dashed border-slate-300 hover:border-blue-300 text-slate-500 text-xs font-semibold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                  + Link pra subir o vídeo
                </button>
              )
            )}
            {activeTab === 'editar' && item.primaryLink && (
              <a
                href={item.primaryLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                Baixe o vídeo bruto
              </a>
            )}
            {activeTab === 'editar' && item.editedVideoLink && (
              <a
                href={item.editedVideoLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                Arquivo editado
              </a>
            )}
            {activeTab === 'postar' && item.editedVideoLink && (
              <a
                href={item.editedVideoLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" strokeWidth={2.5} />
                Baixe o vídeo editado
              </a>
            )}
          </div>

          <div className={extraVisible}>
            {activeTab === 'postar' && item.postCaption && (
              <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Legenda do post</p>
                  <button
                    onClick={(e) => onCopyCaption(e, item)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wider uppercase transition-all ${captionCopiedId === item.id ? 'bg-emerald-500 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                  >
                    {captionCopiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{captionCopiedId === item.id ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{item.postCaption}</p>
              </div>
            )}
            {activeTab === 'postar' && item.firstComment && (
              <div className="mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">Primeiro comentário</p>
                  <button
                    onClick={(e) => onCopyFirstComment(e, item)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wider uppercase transition-all ${firstCommentCopiedId === item.id ? 'bg-emerald-500 text-white' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}
                  >
                    {firstCommentCopiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{firstCommentCopiedId === item.id ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{item.firstComment}</p>
              </div>
            )}
          </div>

          {hasExtras && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpandedMobile(v => !v); }}
              className="md:hidden mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-blue-600 uppercase"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMobile ? 'rotate-180' : ''}`} strokeWidth={3} />
              {expandedMobile ? 'Menos' : 'Mais detalhes'}
            </button>
          )}
        </div>
      </div>
      <IconButton
        icon={Trash2}
        label="Excluir"
        tone="danger"
        size="md"
        onClick={(e) => onRemove(e, dayId, item.id, itemWeekKey)}
        className="md:opacity-0 md:group-hover/item:opacity-100 transition-opacity"
        strokeWidth={2}
      />
    </motion.div>
  );
};

export const PreviewCard = ({ item, sourceWeekKey, onClick }) => (
  <motion.div
    layout
    key={`preview-${sourceWeekKey}-${item.id}`}
    onClick={() => onClick(item, sourceWeekKey)}
    className={`relative flex items-start md:items-center justify-between p-3 md:p-4 ${radius.preview} border-2 border-dashed border-amber-300 bg-amber-50/30 hover:bg-amber-50/60 cursor-pointer opacity-90 transition-colors`}
    title="Ainda em edição — vai aparecer aqui quando for marcado como editado"
  >
    <div className={`absolute -top-2.5 left-5 inline-flex items-center gap-1.5 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase leading-none shadow-sm`}>
      <Scissors className="w-2.5 h-2.5" />
      Ainda em edição
    </div>
    <div className="flex items-start md:items-center gap-3 flex-1 min-w-0 mt-1">
      <div className="flex-1 min-w-0">
        <p className={`${text.h3} text-slate-700 italic`}>
          {item.objective}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {item.contentType && (
            <span className={`${badgeBase} ${getContentTypeBadgeClass(item.contentType, 'bg-amber-50 text-amber-700')}`}>
              {getContentTypeTag(item.contentType)}
            </span>
          )}
          {item.editor && (
            item.editor === 'torres' ? (
              <span className={`${badgeBase} bg-violet-600 text-white`}>
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                Torres • Externo
              </span>
            ) : (
              <span className={`${badgeBase} bg-slate-100 text-slate-500`}>
                Editor: {item.editor}
              </span>
            )
          )}
          {item.time && (
            <span className={`${metaText} text-slate-500`}>
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
    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/60 hover:bg-slate-100 cursor-pointer border border-slate-100 transition-colors"
  >
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
      <span className="text-xs font-medium text-slate-400 line-through italic truncate">{item.objective}</span>
    </div>
    {stageLabel && (
      <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-300 ml-2 flex-shrink-0">{stageLabel}</span>
    )}
  </motion.div>
);
