import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  GripVertical,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Video,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

const firebaseConfig = {
  projectId: 'gen-lang-client-0601883980',
  appId: '1:946045213254:web:ea0dbdd8a0faa88bc88847',
  apiKey: 'AIzaSyBs63bKDn0Wz-aNftk7uBexbMiWmMIHmZc',
  authDomain: 'gen-lang-client-0601883980.firebaseapp.com',
  storageBucket: 'gen-lang-client-0601883980.firebasestorage.app',
  messagingSenderId: '946045213254'
};

const firestoreDatabaseId = 'ai-studio-568f74c2-f715-4e59-828f-2659132b6705';

const emptyTabData = () => ({ segunda: [], terca: [], quarta: [], quinta: [], sexta: [], sabado: [], domingo: [] });

const emptyWeekData = () => ({
  gravar: emptyTabData(),
  postar: emptyTabData()
});

const tabConfig = {
  gravar: {
    label: 'Gravar',
    accent: 'blue',
    titleLabel: 'Titulo',
    titlePlaceholder: 'QUAL CONTEUDO VAMOS GRAVAR?',
    summaryLabel: 'Roteiro',
    summaryPlaceholder: 'GANCHO, PROMESSA, TOPICOS E FECHAMENTO',
    primaryLinkLabel: 'Suba o video aqui',
    secondaryLinkLabel: 'Link do conteudo completo'
  },
  postar: {
    label: 'Postar',
    accent: 'emerald',
    titleLabel: 'Nome do post',
    titlePlaceholder: 'QUAL POST VAI AO AR?',
    primaryLinkLabel: 'Link da pasta completa',
    secondaryLinkLabel: 'Video editado'
  }
};

const defaultItem = () => ({
  objective: '',
  summary: '',
  primaryLink: '',
  secondaryLink: '',
  contentType: 'video_curto',
  recordingType: 'sozinho',
  profile: 'opa',
  time: ''
});

const daysOfWeek = [
  { id: 'segunda', label: 'Segunda-feira', color: 'bg-blue-500' },
  { id: 'terca', label: 'Terca-feira', color: 'bg-emerald-500' },
  { id: 'quarta', label: 'Quarta-feira', color: 'bg-amber-500' },
  { id: 'quinta', label: 'Quinta-feira', color: 'bg-purple-500' },
  { id: 'sexta', label: 'Sexta-feira', color: 'bg-rose-500' },
  { id: 'sabado', label: 'Sábado', color: 'bg-indigo-500' },
  { id: 'domingo', label: 'Domingo', color: 'bg-pink-500' }
];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getMonday = (date = new Date()) => {
  const base = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = base.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  base.setDate(base.getDate() + diff);
  return base;
};

const getWeekKey = (date = new Date()) => toDateKey(getMonday(date));

const parseWeekKey = (weekKey) => {
  const [year, month, day] = weekKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const formatDateShort = (date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const formatWeekRange = (weekKey) => {
  const start = parseWeekKey(weekKey);
  const end = addDays(start, 6);
  return `${formatDateShort(start)} ate ${formatDateShort(end)}`;
};

const createPlanner = (currentWeekKey = getWeekKey()) => ({
  version: 3,
  currentWeekKey,
  weeks: {
    [currentWeekKey]: emptyWeekData()
  }
});

const normalizeUrl = (value) => {
  if (!value || !value.trim()) return '';
  return value.startsWith('http') ? value : `https://${value}`;
};

const normalizeItem = (item = {}, tabKey = 'gravar', forcedContentType) => ({
  id: item.id || Date.now(),
  objective: item.objective || '',
  summary: item.summary || '',
  primaryLink: item.primaryLink || item.uploadLink || item.folderLink || item.link || '',
  secondaryLink: item.secondaryLink || item.contentLink || item.editedVideoLink || '',
  contentType: forcedContentType || item.contentType || 'video_curto',
  recordingType: item.recordingType || 'sozinho',
  profile: item.profile || 'opa',
  time: item.time || '',
  completed: Boolean(item.completed),
  tabKey
});

const mergeLegacyStoriesIntoGravar = (weekData = {}) => {
  const base = emptyWeekData();
  const gravarSource = weekData.gravar || base.gravar;
  const postarSource = weekData.postar || base.postar;
  const storiesSource = weekData.stories || base.gravar;

  const gravar = {};
  const postar = {};

  daysOfWeek.forEach((day) => {
    gravar[day.id] = [
      ...(gravarSource[day.id] || []).map((item) => normalizeItem(item, 'gravar', item.contentType || 'video_curto')),
      ...(storiesSource[day.id] || []).map((item) => normalizeItem(item, 'gravar', 'stories'))
    ];
    postar[day.id] = (postarSource[day.id] || []).map((item) => normalizeItem(item, 'postar'));
  });

  return { gravar, postar };
};

const normalizePlanner = (cloudData) => {
  const currentWeekKey = getWeekKey();

  if (!cloudData) return createPlanner(currentWeekKey);

  if (cloudData.weeks) {
    const weeks = Object.entries(cloudData.weeks).reduce((acc, [weekKey, weekData]) => {
      acc[weekKey] = mergeLegacyStoriesIntoGravar(weekData);
      return acc;
    }, {});

    return {
      version: 3,
      currentWeekKey: cloudData.currentWeekKey || currentWeekKey,
      weeks: Object.keys(weeks).length ? weeks : { [currentWeekKey]: emptyWeekData() }
    };
  }

  if (cloudData.segunda && !cloudData.gravar) {
    return {
      version: 3,
      currentWeekKey,
      weeks: {
        [currentWeekKey]: mergeLegacyStoriesIntoGravar({
          gravar: cloudData,
          postar: emptyTabData()
        })
      }
    };
  }

  return {
    version: 3,
    currentWeekKey,
    weeks: {
      [currentWeekKey]: mergeLegacyStoriesIntoGravar(cloudData)
    }
  };
};

const getRecordingTag = (value) => (value === 'com_alguem' ? 'Dois' : 'Sozinho');
const getContentTypeTag = (value) => (value === 'stories' ? 'Stories' : 'Video curto');
const getProfileTag = (value) => (value === 'marco' ? 'Marco' : 'OPA');

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('gravar');
  const [planner, setPlanner] = useState(() => createPlanner());
  const [expandedDay, setExpandedDay] = useState('segunda');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState(() => defaultItem());
  const [draggedItem, setDraggedItem] = useState(null);
  const [summaryModal, setSummaryModal] = useState({ isOpen: false, item: null });
  const [editModal, setEditModal] = useState({ isOpen: false, dayId: null, item: null });
  const [copiedState, setCopiedState] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [profileFilter, setProfileFilter] = useState('todos');

  const currentWeekKey = planner.currentWeekKey;
  const data = planner.weeks[currentWeekKey] || emptyWeekData();
  const allFilteredItems = Object.values(data[activeTab]).flat().filter(item => profileFilter === 'todos' || (item.profile || 'opa') === profileFilter);

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

  const saveToCloud = async (nextPlanner) => {
    if (!user || !firebaseReady) {
      localStorage.setItem('local_weekly_data', JSON.stringify(nextPlanner));
      return;
    }

    setSaving(true);
    try {
      const db = getFirestore(getApp(), firestoreDatabaseId);
      const docRef = doc(db, 'artifacts', 'organizador-semanal', 'users', user.uid, 'weeklyData', 'current');
      await setDoc(docRef, { content: nextPlanner, lastUpdated: new Date().toISOString() });
    } catch (saveError) {
      console.error('Save error:', saveError);
    } finally {
      setTimeout(() => setSaving(false), 600);
    }
  };

  const updatePlanner = (updater) => {
    const nextPlanner = updater(planner);
    setPlanner(nextPlanner);
    saveToCloud(nextPlanner);
  };

  const updateCurrentWeek = (updater) => {
    updatePlanner((prevPlanner) => ({
      ...prevPlanner,
      weeks: {
        ...prevPlanner.weeks,
        [prevPlanner.currentWeekKey]: updater(prevPlanner.weeks[prevPlanner.currentWeekKey] || emptyWeekData())
      }
    }));
  };

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

  const handleDragStart = (dayId, item) => setDraggedItem({ dayId, item });
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, targetDayId) => {
    e.preventDefault();
    if (!draggedItem) return;
    const { dayId: sourceDayId, item } = draggedItem;
    if (sourceDayId === targetDayId) return;

    updateCurrentWeek((currentWeek) => ({
      ...currentWeek,
      [activeTab]: {
        ...currentWeek[activeTab],
        [sourceDayId]: currentWeek[activeTab][sourceDayId].filter((entry) => entry.id !== item.id),
        [targetDayId]: [...currentWeek[activeTab][targetDayId], item]
      }
    }));

    setDraggedItem(null);
  };

  const handleCopy = async () => {
    if (summaryModal.item?.summary) {
      try {
        const plainText = stripHtml(summaryModal.item.summary);
        const htmlText = summaryModal.item.summary;
        const clipboardItem = new ClipboardItem({
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
          'text/html': new Blob([htmlText], { type: 'text/html' })
        });
        await navigator.clipboard.write([clipboardItem]);
      } catch (err) {
        navigator.clipboard.writeText(stripHtml(summaryModal.item.summary));
      }
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    }
  };

  const handleSaveEdit = () => {
    if (!editModal.item?.objective?.trim()) return;

    updateCurrentWeek((currentWeek) => ({
      ...currentWeek,
      [activeTab]: {
        ...currentWeek[activeTab],
        [editModal.dayId]: currentWeek[activeTab][editModal.dayId].map((item) => (
          item.id === editModal.item.id
            ? {
                ...editModal.item,
                primaryLink: normalizeUrl(editModal.item.primaryLink),
                secondaryLink: normalizeUrl(editModal.item.secondaryLink)
              }
            : item
        ))
      }
    }));

    setEditModal({ isOpen: false, dayId: null, item: null });
  };

  const toggleDay = (dayId) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
    setIsAdding(false);
  };

  const addItem = (dayId) => {
    if (!newItem.objective.trim()) return;

    const item = {
      id: Date.now(),
      objective: newItem.objective,
      summary: newItem.summary,
      primaryLink: normalizeUrl(newItem.primaryLink),
      secondaryLink: normalizeUrl(newItem.secondaryLink),
      contentType: newItem.contentType,
      recordingType: newItem.recordingType,
      profile: newItem.profile,
      time: newItem.time,
      completed: false
    };

    updateCurrentWeek((currentWeek) => ({
      ...currentWeek,
      [activeTab]: {
        ...currentWeek[activeTab],
        [dayId]: [...currentWeek[activeTab][dayId], item]
      }
    }));

    setNewItem(defaultItem());
    setIsAdding(false);
  };

  const removeItem = (e, dayId, itemId) => {
    e.stopPropagation();
    updateCurrentWeek((currentWeek) => ({
      ...currentWeek,
      [activeTab]: {
        ...currentWeek[activeTab],
        [dayId]: currentWeek[activeTab][dayId].filter((item) => item.id !== itemId)
      }
    }));
  };

  const toggleComplete = (e, dayId, itemId) => {
    e.stopPropagation();
    updateCurrentWeek((currentWeek) => ({
      ...currentWeek,
      [activeTab]: {
        ...currentWeek[activeTab],
        [dayId]: currentWeek[activeTab][dayId].map((item) => (
          item.id === itemId ? { ...item, completed: !item.completed } : item
        ))
      }
    }));
  };

  const changeWeek = (direction) => {
    const nextWeekKey = getWeekKey(addDays(parseWeekKey(currentWeekKey), direction * 7));
    updatePlanner((prevPlanner) => ({
      ...prevPlanner,
      currentWeekKey: nextWeekKey,
      weeks: {
        ...prevPlanner.weeks,
        [nextWeekKey]: prevPlanner.weeks[nextWeekKey] || emptyWeekData()
      }
    }));
    setExpandedDay('segunda');
    setIsAdding(false);
  };

  const goToCurrentWeek = () => {
    const thisWeekKey = getWeekKey();
    updatePlanner((prevPlanner) => ({
      ...prevPlanner,
      currentWeekKey: thisWeekKey,
      weeks: {
        ...prevPlanner.weeks,
        [thisWeekKey]: prevPlanner.weeks[thisWeekKey] || emptyWeekData()
      }
    }));
    setExpandedDay('segunda');
    setIsAdding(false);
  };

  const exportMonthlyCsv = () => {
    const activeMonth = parseWeekKey(currentWeekKey).getMonth();
    const activeYear = parseWeekKey(currentWeekKey).getFullYear();
    const rows = [[
      'Semana', 'Dia', 'Etapa', 'Titulo', 'Roteiro', 'Tipo', 'Participacao', 'Perfil', 'Horario', 'Link principal', 'Link secundario', 'Concluido'
    ]];

    Object.entries(planner.weeks)
      .filter(([weekKey]) => {
        const weekStart = parseWeekKey(weekKey);
        return weekStart.getMonth() === activeMonth && weekStart.getFullYear() === activeYear;
      })
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([weekKey, weekData]) => {
        Object.entries(weekData).forEach(([tabKey, days]) => {
          daysOfWeek.forEach((day) => {
            (days[day.id] || []).forEach((item) => {
              rows.push([
                formatWeekRange(weekKey),
                day.label,
                tabConfig[tabKey].label,
                item.objective || '',
                item.summary || '',
                getContentTypeTag(item.contentType),
                tabKey === 'gravar' ? getRecordingTag(item.recordingType) : '',
                getProfileTag(item.profile),
                item.time || '',
                item.primaryLink || '',
                item.secondaryLink || '',
                item.completed ? 'Sim' : 'Nao'
              ]);
            });
          });
        });
      });

    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `organizacao-markito-${activeYear}-${String(activeMonth + 1).padStart(2, '0')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 text-center">
          <div className="inline-flex items-center justify-center p-5 bg-blue-50 rounded-3xl mb-8">
            <Calendar className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 uppercase leading-none">
            Meu <span className="text-blue-600">Plano</span><br />Semanal
          </h1>
          <p className="text-slate-500 font-medium mb-8 text-sm">
            {isRegistering ? 'Crie sua conta para comecar a organizar seus conteudos.' : 'Entre para comecar a organizar seus conteudos com seguranca.'}
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6 text-left">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 ml-1">Senha</label>
              <input
                type="password"
                placeholder="********"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {authError && (
              <div className="flex items-center space-x-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                <AlertCircle className="w-4 h-4" />
                <p className="text-xs font-bold uppercase">{authError}</p>
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 text-lg">
              {isRegistering ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-slate-100 text-slate-900 font-black py-4 rounded-2xl hover:bg-slate-50 text-lg"
          >
            <LogIn className="w-5 h-5 text-blue-600" />
            <span>Entrar com Google</span>
          </button>

          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setAuthError(null);
            }}
            className="mt-6 text-[10px] text-blue-600 font-black uppercase hover:underline"
          >
            {isRegistering ? 'Ja tem uma conta? Entrar' : 'Nao tem conta? Criar conta'}
          </button>
          {error && <p className="mt-4 text-xs text-rose-500 font-bold uppercase">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 p-6 md:p-12 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto pb-24 md:pb-0">
        <header className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
          <div className="flex-1">
            <h1 className="text-5xl md:text-7xl leading-[0.85] font-black uppercase">
              Meu <span className="text-blue-600">Plano</span><br />Semanal
            </h1>
            <p className="mt-4 text-slate-400 font-bold uppercase text-xs flex items-center">
              <span className="w-8 h-[2px] bg-blue-600 mr-3" />
              Bem vindo, {user.displayName ? user.displayName.split(' ')[0] : user.email.split('@')[0]}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 self-end md:self-start">
            <div className="flex items-center space-x-3">
              {firebaseReady && (
                <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-700 uppercase">{saving ? 'Salvando' : 'Sincronizado'}</span>
                </div>
              )}
              <button onClick={handleLogout} className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all" title="Sair">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-300 font-mono font-bold uppercase">
              ID: {user.uid.substring(0, 8)}
            </p>
          </div>
        </header>

        <section className="mb-8 bg-white border border-slate-100 rounded-[28px] p-4 md:p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Calendario semanal</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase">
                Semana {formatWeekRange(currentWeekKey)}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => changeWeek(-1)} className="w-11 h-11 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={goToCurrentWeek} className="px-4 h-11 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl font-black text-[10px] uppercase">
                Semana atual
              </button>
              <button onClick={() => changeWeek(1)} className="w-11 h-11 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={exportMonthlyCsv} className="h-11 px-4 flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase">
                <Download className="w-4 h-4" />
                Exportar mes
              </button>
            </div>
          </div>
        </section>

        <div className="mb-12 hidden md:flex justify-center">
          <div className="bg-slate-100 p-1.5 rounded-[24px] flex items-center relative w-full max-w-md">
            <motion.div
              className="absolute top-1.5 bottom-1.5 rounded-[20px] shadow-sm"
              initial={false}
              animate={{
                left: activeTab === 'gravar' ? '6px' : 'calc(50% + 1px)',
                width: 'calc(50% - 7px)',
                backgroundColor: activeTab === 'gravar' ? '#2563eb' : '#059669'
              }}
            />
            <button onClick={() => setActiveTab('gravar')} className="relative flex-1 py-4 text-xs font-black uppercase">
              <motion.span animate={{ color: activeTab === 'gravar' ? '#ffffff' : '#94a3b8' }}>Gravar</motion.span>
            </button>
            <button onClick={() => setActiveTab('postar')} className="relative flex-1 py-4 text-xs font-black uppercase">
              <motion.span animate={{ color: activeTab === 'postar' ? '#ffffff' : '#94a3b8' }}>Postar</motion.span>
            </button>
          </div>
        </div>

        <div className="mb-10 flex justify-center">
          <div className="bg-white border-2 border-slate-100 p-1.5 rounded-[20px] flex items-center space-x-1 shadow-sm w-full max-w-md md:max-w-[320px]">
            <button 
              onClick={() => setProfileFilter('todos')} 
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${profileFilter === 'todos' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setProfileFilter('marco')} 
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${profileFilter === 'marco' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              Marco
            </button>
            <button 
              onClick={() => setProfileFilter('opa')} 
              className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${profileFilter === 'opa' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              OPA
            </button>
          </div>
        </div>

        <motion.div className="space-y-8">
          {daysOfWeek.map((day, dayIndex) => {
            const filteredDayItems = (data[activeTab][day.id] || []).filter(item => profileFilter === 'todos' || (item.profile || 'opa') === profileFilter);
            return (
            <div
              key={day.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.id)}
              className={`group relative bg-white border border-slate-100 rounded-[32px] transition-shadow duration-500 ${expandedDay === day.id ? 'shadow-2xl ring-4 ring-blue-50' : 'shadow-sm hover:shadow-xl hover:border-slate-200'} ${draggedItem && draggedItem.dayId !== day.id ? 'border-dashed border-2 border-blue-300' : ''}`}
            >
              <div className="absolute -top-3 left-8 z-10">
                <span className={`${day.color} text-white text-[11px] font-black px-5 py-1.5 rounded-full uppercase shadow-lg`}>
                  {day.id.substring(0, 3)}
                </span>
              </div>

              <button onClick={() => toggleDay(day.id)} className="w-full flex items-center justify-between p-5 md:p-6 text-left outline-none">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-slate-800 uppercase">{day.label}</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase mt-1">
                    {formatDateShort(addDays(parseWeekKey(currentWeekKey), dayIndex))} - {filteredDayItems.length} {filteredDayItems.length === 1 ? 'Conteudo' : 'Conteudos'}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedDay === day.id ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-50 text-slate-300'}`}>
                  <ChevronDown className="w-5 h-5" strokeWidth={3} />
                </div>
              </button>

              <AnimatePresence>
                {expandedDay === day.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-5 md:px-6 pb-6 border-t border-slate-50">
                      <div className="space-y-3 mt-5">
                        {filteredDayItems.length === 0 && !isAdding && (
                          <div className="text-center py-8 text-slate-300 font-black uppercase bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 text-sm">
                            Sem planos para hoje
                          </div>
                        )}

                        {[
                          { title: 'Vídeos', items: filteredDayItems.filter(item => item.contentType !== 'stories') },
                          { title: 'Stories', items: filteredDayItems.filter(item => item.contentType === 'stories') }
                        ].map((group) => group.items.length > 0 && (
                          <div key={group.title} className="mb-6 last:mb-0">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 ml-2">{group.title}</h4>
                            <div className="space-y-3">
                              {group.items.map((item) => (
                                <motion.div
                            layout
                            key={item.id}
                            draggable
                            onDragStart={() => handleDragStart(day.id, item)}
                            onClick={() => setEditModal({ isOpen: true, dayId: day.id, item: { ...item } })}
                            className={`group/item flex items-start md:items-center justify-between p-4 md:p-5 rounded-[20px] border-2 ${item.completed ? 'bg-slate-50/50 border-transparent opacity-50' : 'bg-white border-slate-50 hover:border-blue-200 shadow-sm'} cursor-pointer`}
                          >
                            <div className="flex items-start md:items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                              <div className="text-slate-300 cursor-grab active:cursor-grabbing mt-1 md:mt-0">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <button onClick={(e) => toggleComplete(e, day.id, item.id)} className={`flex-shrink-0 mt-0.5 md:mt-0 ${item.completed ? 'text-emerald-500' : 'text-slate-200 hover:text-blue-500'}`}>
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
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSummaryModal({ isOpen: true, item });
                                      }}
                                      className="w-full md:w-auto self-start text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 md:py-2 rounded-xl md:rounded-lg font-black uppercase transition-colors text-center"
                                    >
                                      Ler resumo completo
                                    </button>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {item.contentType && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase ${activeTab === 'gravar' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                      {getContentTypeTag(item.contentType)}
                                    </span>
                                  )}
                                  {activeTab === 'gravar' && item.recordingType && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.recordingType === 'sozinho' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                      {getRecordingTag(item.recordingType)}
                                    </span>
                                  )}
                                  {item.profile && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.profile === 'marco' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {getProfileTag(item.profile)}
                                    </span>
                                  )}
                                  {item.time && (
                                    <span className={`flex items-center text-[10px] font-black uppercase ${item.completed ? 'text-slate-300' : 'text-slate-400'}`}>
                                      <Clock className="w-3 h-3 mr-1" />
                                      {item.time}
                                    </span>
                                  )}
                                </div>
                                {item.primaryLink && (
                                  <a
                                    href={item.primaryLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`inline-flex items-center text-[10px] font-black mt-2 mr-3 uppercase underline decoration-2 underline-offset-4 ${activeTab === 'gravar' ? 'text-blue-500 hover:text-blue-700' : 'text-emerald-500 hover:text-emerald-700'}`}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    {activeTab === 'gravar' ? 'Suba o video aqui' : 'Pasta completa'}
                                  </a>
                                )}
                                {item.secondaryLink && (
                                  <a
                                    href={item.secondaryLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className={`inline-flex items-center text-[10px] font-black mt-2 uppercase underline decoration-2 underline-offset-4 ${activeTab === 'gravar' ? 'text-blue-500 hover:text-blue-700' : 'text-emerald-500 hover:text-emerald-700'}`}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    {activeTab === 'gravar' ? 'Link conteudo completo' : 'Video editado'}
                                  </a>
                                )}
                              </div>
                            </div>
                            <button onClick={(e) => removeItem(e, day.id, item.id)} className="p-2 md:p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl mt-0 md:mt-0">
                              <Trash2 className="w-5 h-5 md:w-6 h-6" />
                            </button>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <AnimatePresence>
                        {isAdding ? (
                          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-5 md:p-6 bg-slate-900 rounded-[24px] shadow-2xl space-y-4">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">{tabConfig[activeTab].titleLabel}</label>
                              <input
                                type="text"
                                placeholder={tabConfig[activeTab].titlePlaceholder}
                                className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-base placeholder:text-slate-600"
                                value={newItem.objective}
                                onChange={(e) => setNewItem({ ...newItem, objective: e.target.value })}
                                autoFocus
                              />
                            </div>

                            {activeTab === 'gravar' && (
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">{tabConfig.gravar.summaryLabel}</label>
                                <div className="bg-white text-slate-800 rounded-xl overflow-hidden mb-2">
                                  <ReactQuill 
                                    theme="snow"
                                    value={newItem.summary} 
                                    onChange={(content) => setNewItem({ ...newItem, summary: content })} 
                                    placeholder={tabConfig.gravar.summaryPlaceholder}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Tipo</label>
                                <select
                                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                                  value={newItem.contentType}
                                  onChange={(e) => setNewItem({ ...newItem, contentType: e.target.value })}
                                >
                                  <option value="video_curto">Video curto</option>
                                  <option value="stories">Stories</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Perfil</label>
                                <select
                                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                                  value={newItem.profile}
                                  onChange={(e) => setNewItem({ ...newItem, profile: e.target.value })}
                                >
                                  <option value="opa">OPA</option>
                                  <option value="marco">Marco</option>
                                </select>
                              </div>
                            </div>
                            
                            {activeTab === 'gravar' && (
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Participacao</label>
                                <select
                                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                                  value={newItem.recordingType}
                                  onChange={(e) => setNewItem({ ...newItem, recordingType: e.target.value })}
                                >
                                  <option value="sozinho">Sozinho</option>
                                  <option value="com_alguem">Dois</option>
                                </select>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">{tabConfig[activeTab].primaryLinkLabel}</label>
                                <input
                                  type="text"
                                  placeholder="WWW.EXEMPLO.COM"
                                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600"
                                  value={newItem.primaryLink}
                                  onChange={(e) => setNewItem({ ...newItem, primaryLink: e.target.value })}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">{tabConfig[activeTab].secondaryLinkLabel}</label>
                                <input
                                  type="text"
                                  placeholder="WWW.EXEMPLO.COM"
                                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600"
                                  value={newItem.secondaryLink}
                                  onChange={(e) => setNewItem({ ...newItem, secondaryLink: e.target.value })}
                                />
                              </div>
                            </div>

                            {activeTab === 'postar' && (
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Horario</label>
                                <input
                                  type="text"
                                  placeholder="14:00"
                                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600"
                                  value={newItem.time}
                                  onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                                />
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <button onClick={() => addItem(day.id)} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 text-sm uppercase">
                                Adicionar plano
                              </button>
                              <button onClick={() => setIsAdding(false)} className="px-8 bg-slate-800 text-white font-black py-4 rounded-xl hover:bg-slate-700 text-sm uppercase">
                                Voltar
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <button onClick={() => setIsAdding(true)} className="mt-4 w-full flex items-center justify-center p-6 border-4 border-slate-50 rounded-2xl text-slate-300 font-black text-base uppercase hover:text-blue-600 hover:border-blue-50 hover:bg-blue-50/20">
                            <Plus className="w-6 h-6 mr-3" strokeWidth={3} />
                            Novo item
                          </button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            );
          })}
        </motion.div>

        <footer className="mt-20 mb-16 flex flex-col md:flex-row items-center justify-between border-t border-slate-100 pt-10 gap-6">
          <div className="flex items-center space-x-8 text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-200" />
              <span className="text-[11px] font-black uppercase">Total: {allFilteredItems.length} itens</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-black uppercase">{allFilteredItems.filter((item) => item.completed).length} concluidos</span>
            </div>
          </div>
        </footer>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40">
        <div className="flex items-center justify-around h-16">
          <button onClick={() => setActiveTab('gravar')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'gravar' ? 'text-blue-600' : 'text-slate-400'}`}>
            <Video className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Gravar</span>
          </button>
          <button onClick={() => setActiveTab('postar')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'postar' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Postar</span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {summaryModal.isOpen && summaryModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSummaryModal({ isOpen: false, item: null })}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative">
              <button onClick={() => setSummaryModal({ isOpen: false, item: null })} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-black text-slate-800 uppercase mb-4 pr-10">{summaryModal.item.objective}</h3>
              <div className="bg-slate-50 p-5 rounded-2xl mb-6 max-h-[50vh] overflow-y-auto">
                <div className="ql-snow">
                  <div 
                    className="ql-editor text-slate-700 text-base leading-relaxed break-normal" 
                    dangerouslySetInnerHTML={{ __html: summaryModal.item.summary.replace(/&nbsp;/g, ' ') }} 
                  />
                </div>
              </div>
              <button onClick={handleCopy} className={`w-full font-black py-4 rounded-xl text-sm uppercase flex items-center justify-center space-x-2 ${copiedState ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                {copiedState ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                <span>{copiedState ? 'Copiado!' : 'Copiar roteiro'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editModal.isOpen && editModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditModal({ isOpen: false, dayId: null, item: null })}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-slate-700">
              <button onClick={() => setEditModal({ isOpen: false, dayId: null, item: null })} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black text-white uppercase mb-6 pr-10">Editar plano</h3>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">{tabConfig[activeTab].titleLabel}</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-base"
                    value={editModal.item.objective}
                    onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, objective: e.target.value } })}
                  />
                </div>

                {activeTab === 'gravar' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Roteiro</label>
                    <div className="bg-white text-slate-800 rounded-xl overflow-hidden mb-2">
                      <ReactQuill 
                        theme="snow"
                        value={editModal.item.summary || ''} 
                        onChange={(content) => setEditModal({ ...editModal, item: { ...editModal.item, summary: content } })} 
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Tipo</label>
                    <select
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                      value={editModal.item.contentType || 'video_curto'}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, contentType: e.target.value } })}
                    >
                      <option value="video_curto">Video curto</option>
                      <option value="stories">Stories</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Perfil</label>
                    <select
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                      value={editModal.item.profile || 'opa'}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, profile: e.target.value } })}
                    >
                      <option value="opa">OPA</option>
                      <option value="marco">Marco</option>
                    </select>
                  </div>
                </div>

                {activeTab === 'gravar' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Participacao</label>
                    <select
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                      value={editModal.item.recordingType || 'sozinho'}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, recordingType: e.target.value } })}
                    >
                      <option value="sozinho">Sozinho</option>
                      <option value="com_alguem">Dois</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">{tabConfig[activeTab].primaryLinkLabel}</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      value={editModal.item.primaryLink || ''}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, primaryLink: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">{tabConfig[activeTab].secondaryLinkLabel}</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      value={editModal.item.secondaryLink || ''}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, secondaryLink: e.target.value } })}
                    />
                  </div>
                </div>

                {activeTab === 'postar' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Horario</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      value={editModal.item.time || ''}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, time: e.target.value } })}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 text-sm uppercase">
                  Salvar alteracoes
                </button>
                <button onClick={() => setEditModal({ isOpen: false, dayId: null, item: null })} className="px-8 bg-slate-800 text-white font-black py-4 rounded-xl hover:bg-slate-700 text-sm uppercase">
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
