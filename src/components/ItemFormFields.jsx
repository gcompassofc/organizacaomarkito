import React, { useMemo, useState } from 'react';
import ReactQuill from 'react-quill-new';
import { pilaresForProfile, getProfileTag } from '../lib/tags';
import { Field, Input, Textarea, Select } from './ui/Input';
import { text } from '../lib/ui';

const STAGES = [
  { id: 'gravar', label: 'Gravar', hint: 'Ainda vai gravar', selected: 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20' },
  { id: 'editar', label: 'Editar', hint: 'Já gravado',        selected: 'bg-amber-500 border-amber-400 text-white shadow-md shadow-amber-500/20' },
  { id: 'postar', label: 'Postar', hint: 'Já editado',        selected: 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/20' }
];

const STORY_MODES = [
  { id: 'aovivo', label: 'Ao vivo', hint: 'Gravar e postar agora', selected: 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20' },
  { id: 'banco',  label: 'Banco',   hint: 'Guardar para depois',   selected: 'bg-violet-500 text-white border-violet-400 shadow-md shadow-violet-500/20' }
];

const Section = ({ title, children }) => (
  <section>
    <h4 className={`${text.microMeta} text-slate-400 mb-3 pb-2 border-b border-slate-100`}>
      {title}
    </h4>
    <div className="space-y-4">{children}</div>
  </section>
);

const OptionGrid = ({ options, value, onChange, columns = 3 }) => (
  <div className={`grid gap-3 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
    {options.map(opt => {
      const active = value === opt.id;
      return (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`p-3 rounded-xl text-sm font-semibold border-2 transition-all ${active ? opt.selected : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-white'}`}
        >
          <div>{opt.label}</div>
          <div className={`text-[10px] font-normal mt-1 ${active ? 'opacity-90' : 'text-slate-400'}`}>
            {opt.hint}
          </div>
        </button>
      );
    })}
  </div>
);

export const ItemFormFields = ({
  item,
  onPatch,
  mode = 'create',
  stageValue,
  onStageChange,
  showPostFields,
  repostablePosts = []
}) => {
  const changeProfile = (profile) => {
    const validIds = pilaresForProfile(profile).map(p => p.id);
    const pilar = validIds.includes(item.pilar) ? item.pilar : '';
    onPatch({ profile, pilar });
  };
  const availablePilares = pilaresForProfile(item.profile);
  const stageLabel = mode === 'create' ? 'Começar em qual etapa?' : 'Etapa atual';
  const storyMode = item.storyMode || 'aovivo';
  const isRepost = item.contentType === 'repost_stories';

  const changeContentType = (value) => {
    const patch = { contentType: value };
    if (value === 'repost_stories') {
      if (mode === 'create') patch.initialStage = 'postar';
      else patch.tabKey = 'postar';
    } else if (item.contentType === 'repost_stories') {
      patch.repostOfId = '';
      patch.repostOfCode = '';
      patch.repostOfObjective = '';
    }
    onPatch(patch);
  };

  return (
    <div className="space-y-6">
      <Section title="Identidade">
        <Field label={stageLabel}>
          <OptionGrid options={STAGES} value={stageValue} onChange={onStageChange} />
        </Field>

        <Field label="Título da tarefa">
          <Input
            type="text"
            placeholder="Ex: Vídeo sobre organização"
            value={item.objective || ''}
            onChange={(e) => onPatch({ objective: e.target.value })}
            autoFocus={mode === 'create'}
            size="lg"
          />
        </Field>

        <Field label="Roteiro / Resumo">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-blue-400 transition-colors">
            <ReactQuill
              theme="snow"
              value={item.summary || ''}
              onChange={(content) => onPatch({ summary: content })}
              placeholder="Gancho, promessa, tópicos e fechamento"
            />
          </div>
        </Field>
      </Section>

      <Section title="Classificação">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Tipo">
            <Select
              value={item.contentType || 'video_curto'}
              onChange={(e) => changeContentType(e.target.value)}
            >
              <option value="video_curto">Vídeo curto</option>
              <option value="youtube">YouTube</option>
              <option value="stories">Stories</option>
              <option value="repost_stories">Repost no Stories</option>
              <option value="estatico">Estático</option>
              <option value="carrossel">Carrossel</option>
            </Select>
          </Field>
          <Field label="Perfil">
            <Select
              value={item.profile || 'opa'}
              onChange={(e) => changeProfile(e.target.value)}
            >
              <option value="opa">OPA</option>
              <option value="marco">Marco</option>
              <option value="collab">Collab (OPA + Marco)</option>
            </Select>
          </Field>
          <Field label="Participação">
            <Select
              value={item.recordingType || 'sozinho'}
              onChange={(e) => onPatch({ recordingType: e.target.value })}
            >
              <option value="sozinho">Sozinho</option>
              <option value="com_alguem">Dois</option>
            </Select>
          </Field>
        </div>

        {item.contentType === 'stories' && (
          <Field label="Modo do story">
            <OptionGrid options={STORY_MODES} value={storyMode} onChange={(v) => onPatch({ storyMode: v })} columns={2} />
          </Field>
        )}

        <Field label="Pilar de conteúdo">
          <Select
            value={item.pilar || ''}
            onChange={(e) => onPatch({ pilar: e.target.value })}
          >
            <option value="">— Sem pilar definido —</option>
            {availablePilares.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </Select>
        </Field>
      </Section>

      {isRepost && (
        <Section title="Qual post repostar?">
          <RepostPicker
            value={item.repostOfId || ''}
            onChange={(post) => onPatch({
              repostOfId: post?.id || '',
              repostOfCode: post?.code || '',
              repostOfObjective: post?.objective || ''
            })}
            posts={repostablePosts}
            currentLabel={item.repostOfCode || item.repostOfObjective}
          />
          {(item.repostOfId || item.repostOfCode) && (
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3 flex items-start gap-3">
              <span className="text-rose-500 mt-0.5">↻</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold tracking-wider uppercase text-rose-500/80">Repostando</p>
                <p className="text-sm font-medium text-slate-800 truncate">
                  {item.repostOfCode && <span className="font-mono text-xs text-slate-500 mr-1">{item.repostOfCode}</span>}
                  {item.repostOfObjective || <span className="italic text-slate-400">post sem título</span>}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onPatch({ repostOfId: '', repostOfCode: '', repostOfObjective: '' })}
                className="text-[10px] font-semibold tracking-wider uppercase text-rose-600 hover:text-rose-700"
              >
                Trocar
              </button>
            </div>
          )}
          <Field label="Instrução pra equipe (opcional)">
            <Textarea
              rows={2}
              value={item.postCaption || ''}
              onChange={(e) => onPatch({ postCaption: e.target.value })}
              placeholder="Ex: Repostar com sticker de localização, marcar @fulano..."
            />
          </Field>
        </Section>
      )}

      <Section title="Agenda & Equipe">
        <label className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={Boolean(item.banco)}
            onChange={(e) => {
              const banco = e.target.checked;
              onPatch(banco ? { banco, recordingDate: '', postDate: '' } : { banco });
            }}
            className="w-4 h-4 accent-blue-600"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Salvar no banco</p>
            <p className="text-xs text-slate-500 mt-0.5">Conteúdo pronto sem data definida — fica disponível pra encaixar depois</p>
          </div>
        </label>

        <div className={`grid grid-cols-1 ${isRepost ? '' : 'md:grid-cols-2'} gap-4 ${item.banco ? 'opacity-50' : ''}`}>
          {!isRepost && (
            <Field label="Dia para gravar">
              <Input
                type="date"
                value={item.recordingDate || ''}
                onChange={(e) => onPatch({ recordingDate: e.target.value })}
              />
            </Field>
          )}
          <Field label="Dia para postar">
            <Input
              type="date"
              value={item.postDate || ''}
              onChange={(e) => onPatch({ postDate: e.target.value })}
            />
          </Field>
        </div>

        <div className={`grid grid-cols-1 ${isRepost ? '' : 'md:grid-cols-2'} gap-4`}>
          {!isRepost && (
            <Field label="Responsável edição">
              <Select
                value={item.editor || 'indefinido'}
                onChange={(e) => onPatch({ editor: e.target.value })}
              >
                <option value="indefinido">— Indefinido —</option>
                <option value="allyson">Allyson</option>
                <option value="kallyl">Kallyl</option>
                <option value="natalia">Natalia</option>
                <option value="torres">★ Torres (Externo)</option>
              </Select>
            </Field>
          )}
          <Field label="Horário da postagem">
            <Input
              type="text"
              placeholder="Ex: 14:00"
              value={item.time || ''}
              onChange={(e) => onPatch({ time: e.target.value })}
            />
          </Field>
        </div>
      </Section>

      {!isRepost && (
        <Section title="Links">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Link do vídeo bruto">
              <Input
                type="text"
                placeholder="Link do Drive"
                value={item.primaryLink || ''}
                onChange={(e) => onPatch({ primaryLink: e.target.value })}
              />
            </Field>
            <Field label="Link do arquivo editado">
              <Input
                type="text"
                placeholder="Pasta completa"
                value={item.editedVideoLink || ''}
                onChange={(e) => onPatch({ editedVideoLink: e.target.value })}
              />
            </Field>
          </div>
        </Section>
      )}

      {showPostFields && !isRepost && (
        <Section title="Publicação">
          <Field label="Legenda do post">
            <Textarea
              rows={4}
              value={item.postCaption || ''}
              onChange={(e) => onPatch({ postCaption: e.target.value })}
              placeholder="Escreva a legenda aqui..."
            />
          </Field>
          <Field label="Primeiro comentário">
            <Textarea
              rows={3}
              value={item.firstComment || ''}
              onChange={(e) => onPatch({ firstComment: e.target.value })}
              placeholder="Comentário fixado / link / CTA..."
            />
          </Field>
        </Section>
      )}
    </div>
  );
};

const RepostPicker = ({ value, onChange, posts, currentLabel }) => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = posts || [];
    if (!q) return list.slice(0, 15);
    return list.filter(p =>
      (p.objective || '').toLowerCase().includes(q) ||
      (p.code || '').toLowerCase().includes(q)
    ).slice(0, 15);
  }, [posts, query]);

  return (
    <div className="space-y-3">
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por título ou código..."
      />
      <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 italic text-center py-6">
            Nenhum post encontrado
          </p>
        ) : (
          filtered.map(post => {
            const selected = value === post.id;
            return (
              <button
                key={`${post._sourceWeekKey}-${post._sourceDayId}-${post.id}`}
                type="button"
                onClick={() => onChange(post)}
                className={`w-full text-left p-3 flex items-start gap-3 hover:bg-rose-50/40 transition-colors ${selected ? 'bg-rose-50' : 'bg-white'}`}
              >
                <span className="font-mono text-[10px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md tracking-wider flex-shrink-0 mt-0.5">
                  {post.code || '—'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {post.objective || <span className="italic text-slate-400">Sem título</span>}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
                      {getProfileTag(post.profile)}
                    </span>
                    {post.postDate && (
                      <span className="text-[10px] text-slate-400">
                        · postar {post.postDate}
                      </span>
                    )}
                  </div>
                </div>
                {selected && (
                  <span className="text-rose-600 text-xs font-semibold">✓</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
