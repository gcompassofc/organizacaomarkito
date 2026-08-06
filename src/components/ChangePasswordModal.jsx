import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { GlassModal, useInputStyle, useModalButtons, labelSpan } from './ui/GlassModal';

// Troca de senha da conta logada. O Firebase exige a senha atual para
// reautenticar antes de trocar — quem faz isso é o onSubmit no App.
export const ChangePasswordModal = ({ open, email, onClose, onSubmit }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const inputStyle = useInputStyle();
  const btn = useModalButtons();
  const isMobile = btn.isMobile;

  React.useEffect(() => {
    if (open) { setCurrent(''); setNext(''); setConfirm(''); setError(null); setBusy(false); setDone(false); }
  }, [open]);

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
    <GlassModal open={open} onClose={onClose} maxWidth={420}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h3 style={{ fontSize: isMobile ? 18 : 17, fontWeight: 600, color: '#16202E' }}>Trocar senha</h3>
        <button onClick={onClose} title="Fechar" aria-label="Fechar" style={btn.close}><X size={20} /></button>
      </div>
      <p style={{ fontSize: isMobile ? 13.5 : 12.5, color: '#8A94A8', lineHeight: 1.5, marginBottom: 18, wordBreak: 'break-word' }}>{email}</p>

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

          <div style={btn.row}>
            <button onClick={onClose} style={btn.cancel}>Cancelar</button>
            <button onClick={submit} disabled={busy} style={{ ...btn.save, background: busy ? '#9CB8EE' : btn.save.background, cursor: busy ? 'default' : 'pointer' }}>{busy ? 'Salvando…' : 'Trocar senha'}</button>
          </div>
        </>
      )}
    </GlassModal>
  );
};

export default ChangePasswordModal;
