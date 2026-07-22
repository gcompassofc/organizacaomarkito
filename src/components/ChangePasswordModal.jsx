import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';

const ACCENT = '#2E6DE0';
const inputStyle = { width: '100%', padding: '9px 11px', border: '1px solid #E6EDF6', borderRadius: 10, background: '#F7FAFE', fontSize: 13, color: '#16202E' };
const labelSpan = { fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8A94A8' };

// Troca de senha da conta logada. O Firebase exige a senha atual para
// reautenticar antes de trocar — quem faz isso é o onSubmit no App.
export const ChangePasswordModal = ({ open, email, onClose, onSubmit }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  React.useEffect(() => {
    if (open) { setCurrent(''); setNext(''); setConfirm(''); setError(null); setBusy(false); setDone(false); }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const submit = async () => {
    setError(null);
    if (!current) return setError('Digite a senha atual.');
    if (next.length < 6) return setError('A nova senha precisa ter pelo menos 6 caracteres.');
    if (next !== confirm) return setError('A confirmação não bate com a nova senha.');
    if (next === current) return setError('A nova senha é igual à atual.');

    setBusy(true);
    const result = await onSubmit(current, next);
    setBusy(false);
    if (result?.ok) {
      setDone(true);
      setTimeout(onClose, 1600);
    } else {
      setError(result?.message || 'Não foi possível trocar a senha.');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(12,22,45,0.30)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 420, borderRadius: 26, padding: 24, boxShadow: '0 30px 70px rgba(16,32,56,0.28)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, color: '#16202E' }}>Trocar senha</h3>
              <button onClick={onClose} title="Fechar" style={{ background: 'none', border: 'none', color: '#8A94A8', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 12.5, color: '#8A94A8', lineHeight: 1.5, marginBottom: 18 }}>{email}</p>

            {done ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#E7F5EC', border: '1px solid #BFE3CD', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#177245', fontWeight: 500 }}>
                <Check size={16} />Senha alterada com sucesso.
              </div>
            ) : (
              <>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  <span style={labelSpan}>Senha atual</span>
                  <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" style={inputStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                  <span style={labelSpan}>Nova senha</span>
                  <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" style={inputStyle} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
                  <span style={labelSpan}>Confirmar nova senha</span>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} autoComplete="new-password" style={inputStyle} />
                </label>

                {error && (
                  <div style={{ background: '#FDEAEE', border: '1px solid #F7C3CE', borderRadius: 12, padding: '10px 12px', fontSize: 12.5, color: '#B4213C', lineHeight: 1.5, marginBottom: 16 }}>{error}</div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={onClose} style={{ padding: '9px 16px', border: '1px solid #E6EDF6', background: '#fff', borderRadius: 10, color: '#55627A', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={submit} disabled={busy} style={{ padding: '10px 22px', border: 'none', background: busy ? '#9CB8EE' : ACCENT, color: '#fff', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: busy ? 'default' : 'pointer', boxShadow: '0 6px 16px rgba(46,109,224,0.28)' }}>{busy ? 'Salvando…' : 'Trocar senha'}</button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChangePasswordModal;
