import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword
} from 'firebase/auth';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import { firebaseConfig, firestoreDatabaseId } from './lib/firebase';
import LoginScreen from './components/LoginScreen';
import ChangePasswordModal from './components/ChangePasswordModal';
import { MarcoView } from './components/MarcoView';
import { HeaderBar, MobileBottomNav, FloatingDesktopNav } from './components/layout';
import {
  newId,
  createPlanner,
  normalizeUrl,
  normalizePlanner
} from './lib/planner';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState(null);
  const [planner, setPlanner] = useState(() => createPlanner());
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    let unsubscribeAuth;
    let unsubscribeSnapshot;

    const init = async () => {
      try {
        const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        const db = getFirestore(app, firestoreDatabaseId);

        setFirebaseReady(true);

        unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setAuthChecking(false);

          if (currentUser) {
            const docRef = doc(db, 'artifacts', 'organizador-semanal', 'users', currentUser.uid, 'weeklyData', 'current');
            unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
              // Toda escrita nossa volta na hora como eco local antes de ir
              // pro servidor. O estado da tela já reflete ela, e reprocessar
              // o documento inteiro (normalizePlanner varre todas as semanas
              // do histórico) a cada save trava a interface à toa.
              if (docSnap.metadata.hasPendingWrites) {
                setLoading(false);
                return;
              }
              setPlanner(normalizePlanner(docSnap.exists() ? docSnap.data().content : null));
              setLoading(false);
            }, () => {
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Firebase init failed:', err);
        setAuthChecking(false);
        setLoading(false);
        setError('Erro ao inicializar Firebase.');
      }
    };

    init();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const saveTimerRef = useRef(null);
  const pendingPlannerRef = useRef(null);

  const flushSave = async () => {
    const nextPlanner = pendingPlannerRef.current;
    if (!nextPlanner) return;
    pendingPlannerRef.current = null;

    if (!user || !firebaseReady) {
      try { localStorage.setItem('local_weekly_data', JSON.stringify(nextPlanner)); } catch {}
      setSaving(false);
      return;
    }

    try {
      const db = getFirestore(getApp(), firestoreDatabaseId);
      const docRef = doc(db, 'artifacts', 'organizador-semanal', 'users', user.uid, 'weeklyData', 'current');
      await setDoc(docRef, { content: nextPlanner, lastUpdated: new Date().toISOString() });
      setSaveError(false);
    } catch (err) {
      console.error('Save error:', err);
      setSaveError(true);
    } finally {
      setTimeout(() => setSaving(false), 400);
    }
  };

  const saveToCloud = (nextPlanner) => {
    pendingPlannerRef.current = nextPlanner;
    setSaving(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => flushRef.current(), 600);
  };

  // Refs com o valor mais recente de cada coisa que muda a cada render.
  // Servem pra `updatePlanner` e o listener de saída não precisarem ser
  // recriados: quem os recebe (os cards memoizados) então não re-renderiza
  // só porque o indicador de "salvando" piscou.
  const flushRef = useRef(flushSave);
  flushRef.current = flushSave;
  const plannerRef = useRef(planner);
  plannerRef.current = planner;
  const saveRef = useRef(saveToCloud);
  saveRef.current = saveToCloud;

  useEffect(() => {
    const onUnload = () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        flushRef.current();
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  const updatePlanner = useCallback((updater) => {
    const nextPlanner = updater(plannerRef.current);
    setPlanner(nextPlanner);
    saveRef.current(nextPlanner);
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      const auth = getAuth(getApp());
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Firebase Auth Error:', err.code, err.message);
      let friendlyMessage = 'Erro ao entrar com Google. Tente novamente.';
      if (err.code === 'auth/unauthorized-domain') friendlyMessage = 'Este dominio nao esta autorizado no Firebase.';
      if (err.code === 'auth/operation-not-allowed') friendlyMessage = 'O login com Google nao esta ativado no Firebase.';
      if (err.code === 'auth/popup-closed-by-user') friendlyMessage = 'O login foi cancelado.';
      setError(friendlyMessage);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    if (!email || !password) {
      setAuthError('Preencha todos os campos.');
      setLoading(false);
      return;
    }

    try {
      const auth = getAuth(getApp());
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error('Email Auth Error:', err.code, err.message);
      setAuthError('Ocorreu um erro. Tente novamente.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth(getApp());
      await signOut(auth);
      setPlanner(createPlanner());
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Troca a senha da conta logada. O Firebase exige reautenticar com a senha
  // atual antes de aceitar a nova (sessão antiga = credencial "velha demais").
  const handleChangePassword = async (currentPassword, newPassword) => {
    try {
      const auth = getAuth(getApp());
      const current = auth.currentUser;
      if (!current?.email) return { ok: false, message: 'Nenhuma conta de e-mail logada.' };

      const credential = EmailAuthProvider.credential(current.email, currentPassword);
      await reauthenticateWithCredential(current, credential);
      await updatePassword(current, newPassword);
      return { ok: true };
    } catch (err) {
      console.error('Change password error:', err.code, err.message);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') return { ok: false, message: 'Senha atual incorreta.' };
      if (err.code === 'auth/weak-password') return { ok: false, message: 'A nova senha é fraca demais. Use pelo menos 6 caracteres.' };
      if (err.code === 'auth/too-many-requests') return { ok: false, message: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' };
      if (err.code === 'auth/requires-recent-login') return { ok: false, message: 'Sessão antiga. Saia, entre de novo e tente outra vez.' };
      return { ok: false, message: 'Não foi possível trocar a senha. Tente novamente.' };
    }
  };

  // ── Gravações do Marco (aba "Marco") ──
  // Lista independente: título, texto do vídeo, link de upload e o check de
  // gravado. editing: gravação existente | null (nova).
  const gravacaoSave = useCallback((editing, draft) => updatePlanner((prev) => {
    const clean = { title: (draft.title || '').trim(), script: draft.script || '', uploadLink: normalizeUrl(draft.uploadLink || '') };
    if (editing) return { ...prev, gravacoes: (prev.gravacoes || []).map(g => g.id === editing.id ? { ...g, ...clean } : g) };
    return { ...prev, gravacoes: [...(prev.gravacoes || []), { id: newId(), ...clean, done: false, doneAt: '', precisaRefazer: false, notaRefazer: '' }] };
  }), [updatePlanner]);
  const gravacaoDelete = useCallback((gravacao) => updatePlanner((prev) => ({ ...prev, gravacoes: (prev.gravacoes || []).filter(g => g.id !== gravacao.id) })), [updatePlanner]);
  const gravacaoToggleDone = useCallback((gravacao) => updatePlanner((prev) => ({
    ...prev,
    gravacoes: (prev.gravacoes || []).map(g => g.id === gravacao.id
      ? { ...g, done: !g.done, doneAt: g.done ? '' : new Date().toISOString() }
      : g)
  })), [updatePlanner]);

  // Card arrastado para a DIREITA no modo cartão: Marco decidiu gravar aquele
  // conteúdo. O modal de aceite deixa ele ler o texto e abrir a pasta de
  // upload; ao confirmar, o item sai da pilha e vai pra "Gravados".
  // O uploadLink é cadastrado pela equipe e não se mexe aqui.
  const gravacaoComplete = useCallback((gravacao) => updatePlanner((prev) => ({
    ...prev,
    gravacoes: (prev.gravacoes || []).map(g => g.id === gravacao.id
      ? { ...g, done: true, doneAt: new Date().toISOString(), precisaRefazer: false, notaRefazer: '' }
      : g)
  })), [updatePlanner]);

  // Card arrastado para a ESQUERDA: precisa refazer algo. A observação do
  // Marco vai junto — o item sai da pilha e cai na fila de Refação, pra
  // equipe ler o recado e ajustar.
  const gravacaoSendRefazer = useCallback((gravacao, nota) => updatePlanner((prev) => ({
    ...prev,
    gravacoes: (prev.gravacoes || []).map(g => g.id === gravacao.id
      ? { ...g, done: false, doneAt: '', precisaRefazer: true, notaRefazer: (nota || '').trim() }
      : g)
  })), [updatePlanner]);

  // Depois de ajustado pela equipe, volta pra pilha do Marco revisar de novo.
  const gravacaoResolveRefazer = useCallback((gravacao) => updatePlanner((prev) => ({
    ...prev,
    gravacoes: (prev.gravacoes || []).map(g => g.id === gravacao.id
      ? { ...g, precisaRefazer: false, notaRefazer: '' }
      : g)
  })), [updatePlanner]);

  if (authChecking || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium text-lg">Sincronizando seus planos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        email={email} setEmail={setEmail}
        password={password} setPassword={setPassword}
        isRegistering={isRegistering} setIsRegistering={setIsRegistering}
        authError={authError} setAuthError={setAuthError}
        handleEmailAuth={handleEmailAuth} handleLogin={handleLogin}
        error={error}
      />
    );
  }

  return (
    /* px-4 no mobile: p-6 comia 48px da largura útil de um celular de 390px.
       O padding inferior reserva espaço para a nav flutuante + safe area.
       overflowX clip: o card da pilha do Marco voa pra fora da tela ao ser
       arrastado e, sem isso, vira rolagem horizontal. `clip` (e não `hidden`)
       porque não transforma o eixo vertical num scroller aninhado; modais e
       nav são `fixed`, então não são recortados. */
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 px-4 py-5 md:p-10 selection:bg-blue-100" style={{ overflowX: 'clip' }}>
      <div className="max-w-7xl mx-auto pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-32">
        <HeaderBar
          firebaseReady={firebaseReady}
          saving={saving}
          saveError={saveError}
          onLogout={handleLogout}
          canChangePassword={Boolean(user?.email && user.providerData?.some(p => p.providerId === 'password'))}
          onChangePassword={() => setChangePasswordOpen(true)}
        />

        <MarcoView
          gravacoes={planner.gravacoes || []}
          onSave={gravacaoSave}
          onDelete={gravacaoDelete}
          onToggleDone={gravacaoToggleDone}
          onComplete={gravacaoComplete}
          onSendRefazer={gravacaoSendRefazer}
          onResolveRefazer={gravacaoResolveRefazer}
        />
      </div>

      <MobileBottomNav activeView="marco" onChangeView={() => {}} />
      <FloatingDesktopNav activeView="marco" onChangeView={() => {}} />

      <ChangePasswordModal
        open={changePasswordOpen}
        email={user?.email || ''}
        onClose={() => setChangePasswordOpen(false)}
        onSubmit={handleChangePassword}
      />
    </div>
  );
};

export default App;
