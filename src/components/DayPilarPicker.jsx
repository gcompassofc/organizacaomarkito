import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Pencil, X } from 'lucide-react';
import {
  PILARES,
  getPilarLabel,
  getPilarBadgeClass,
  getProfileTag,
  getProfileBadgeClass,
  pilaresForProfile
} from '../lib/tags';

const PROFILES = ['marco', 'opa', 'collab'];

const ProfilePilarRow = ({ profile, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const options = pilaresForProfile(profile);

  return (
    <div ref={ref} className="relative inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase leading-none ${getProfileBadgeClass(profile)}`}>
        {getProfileTag(profile)}
      </span>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase leading-none transition-colors ${value ? getPilarBadgeClass(value) + ' hover:opacity-80' : 'bg-white text-slate-400 border border-dashed border-slate-300 hover:border-slate-400 hover:text-slate-500'}`}
        title={value ? `Pilar: ${getPilarLabel(value)} — clique para trocar` : 'Definir pilar deste dia'}
      >
        {value ? (
          <>
            <span>{getPilarLabel(value)}</span>
            <Pencil className="w-2.5 h-2.5 opacity-60" />
          </>
        ) : (
          <>
            <span>+ pilar</span>
            <ChevronDown className="w-2.5 h-2.5" />
          </>
        )}
      </button>

      {open && (
        <div
          className="absolute z-30 left-0 top-6 min-w-[210px] bg-white border border-slate-200 rounded-xl shadow-lg p-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider uppercase text-slate-400 hover:bg-slate-50"
          >
            <span className="inline-flex items-center gap-1.5"><X className="w-3 h-3" /> Sem pilar</span>
          </button>
          <div className="h-px bg-slate-100 my-1" />
          {options.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => { onChange(p.id); setOpen(false); }}
              className={`w-full text-left flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wider uppercase hover:bg-slate-50 ${value === p.id ? 'bg-slate-100' : ''}`}
            >
              <span>{p.label}</span>
              <span className={`px-1.5 py-0.5 rounded ${getPilarBadgeClass(p.id)}`}>&nbsp;</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const DayPilarPicker = ({ dayId, dayPilars, onChange, profileFilter = 'todos' }) => {
  const visibleProfiles = profileFilter === 'todos' ? PROFILES : PROFILES.filter(p => p === profileFilter);

  return (
    <div
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-400 mr-1">
        Pilar do dia
      </span>
      {visibleProfiles.map(profile => (
        <ProfilePilarRow
          key={profile}
          profile={profile}
          value={(dayPilars?.[profile]?.[dayId]) || ''}
          onChange={(pilarId) => onChange(profile, dayId, pilarId)}
        />
      ))}
    </div>
  );
};

export default DayPilarPicker;
