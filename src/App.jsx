import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CalendarDays,
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
  LayoutGrid,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Trash2,
  Video,
  X,
  Scissors
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
  editar: { geral: [] },
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
  editar: {
    label: 'Editar',
    accent: 'amber',
    titleLabel: 'Titulo',
    titlePlaceholder: 'QUAL CONTEUDO VAMOS EDITAR?',
    primaryLinkLabel: 'Suba o video aqui',
    secondaryLinkLabel: 'Arquivo editado'
  },
  postar: {
    label: 'Postar',
    accent: 'emerald',
    titleLabel: 'Nome do post',
    titlePlaceholder: 'QUAL POST VAI AO AR?',
    primaryLinkLabel: 'Arquivo editado',
    secondaryLinkLabel: 'Pasta completa'
  }
};

const getTodayDayId = () => {
  const jsDay = new Date().getDay();
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'][idx];
};

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

const defaultItem = () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return {
    objective: '',
    summary: '',
    primaryLink: '',
    secondaryLink: '',
    editedVideoLink: '',
    postCaption: '',
    contentType: 'video_curto',
    recordingType: 'sozinho',
    profile: 'opa',
    storyMode: 'aovivo',
    time: '',
    editor: 'allyson',
    recordingDate: toDateKey(today),
    postDate: toDateKey(tomorrow),
    status: 'gravar'
  };
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

const formatDateShort = (dateStringOrDate) => {
  const d = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate + 'T12:00:00') : dateStringOrDate;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatWeekRange = (weekKey) => {
  const start = parseWeekKey(weekKey);
  const end = addDays(start, 6);
  return `${formatDateShort(start)} ate ${formatDateShort(end)}`;
};

const createPlanner = (currentWeekKey = getWeekKey()) => ({
  version: 4,
  currentWeekKey,
  weeks: {
    [currentWeekKey]: emptyWeekData()
  }
});

const normalizeUrl = (value) => {
  if (!value || !value.trim()) return '';
  return value.startsWith('http') ? value : `https://${value}`;
};

const getWeekKeyAndDayId = (dateString) => {
  if (!dateString) return { weekKey: getWeekKey(), dayId: 'segunda' };
  const [year, month, day] = dateString.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  const base = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
  const dayOfWeek = base.getDay(); // 0 is Sunday
  
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(base);
  monday.setDate(monday.getDate() + diff);
  
  const weekKey = toDateKey(monday);
  const dayIds = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const dayId = dayIds[dayOfWeek];
  
  return { weekKey, dayId };
};

const getNextDayOfWeek = (weekKey, dayId) => {
   const [year, month, day] = weekKey.split('-').map(Number);
   const monday = new Date(year, month - 1, day);
   const dayMap = { 'segunda': 0, 'terca': 1, 'quarta': 2, 'quinta': 3, 'sexta': 4, 'sabado': 5, 'domingo': 6 };
   const diff = dayMap[dayId] || 0;
   monday.setDate(monday.getDate() + diff);
   return toDateKey(monday);
};

const normalizeItem = (item = {}, tabKey = 'gravar', forcedContentType, weekKeyStr, fallbackDayId) => {
  const norm = {
    id: item.id || Date.now(),
    objective: item.objective || '',
    summary: item.summary || '',
    primaryLink: item.primaryLink || item.uploadLink || item.folderLink || item.link || '',
    secondaryLink: item.secondaryLink || item.contentLink || item.editedVideoLink || '',
    editedVideoLink: item.editedVideoLink || '',
    postCaption: item.postCaption || '',
    editor: item.editor || 'allyson',
    contentType: forcedContentType || item.contentType || 'video_curto',
    recordingType: item.recordingType || 'sozinho',
    profile: item.profile || 'opa',
    storyMode: item.storyMode || 'aovivo',
    time: item.time || '',
    completed: Boolean(item.completed),
    tabKey,
    _gravarOrigin: item._gravarOrigin || null,
    _editarOrigin: item._editarOrigin || null
  };

  if (!item.recordingDate && weekKeyStr) {
     norm.recordingDate = getNextDayOfWeek(weekKeyStr, item.recordingDayId || fallbackDayId || 'segunda');
  } else {
     norm.recordingDate = item.recordingDate || toDateKey(new Date());
  }
  
  if (!item.postDate && weekKeyStr) {
     norm.postDate = getNextDayOfWeek(weekKeyStr, item.postDayId || fallbackDayId || 'segunda');
  } else {
     norm.postDate = item.postDate || toDateKey(new Date());
  }

  return norm;
};

const mergeLegacyStoriesIntoGravar = (weekData = {}, weekKeyStr) => {
  const base = emptyWeekData();
  const gravarSource = weekData.gravar || base.gravar;
  const postarSource = weekData.postar || base.postar;
  const storiesSource = weekData.stories || base.gravar;
  const editarSource = weekData.editar || base.editar;

  const gravar = {};
  const postar = {};
  const editar = { geral: (editarSource.geral || []).map((item) => normalizeItem(item, 'editar', undefined, weekKeyStr, 'segunda')) };

  daysOfWeek.forEach((day) => {
    gravar[day.id] = [
      ...(gravarSource[day.id] || []).map((item) => normalizeItem(item, 'gravar', item.contentType || 'video_curto', weekKeyStr, day.id)),
      ...(storiesSource[day.id] || []).map((item) => normalizeItem(item, 'gravar', 'stories', weekKeyStr, day.id))
    ];
    postar[day.id] = (postarSource[day.id] || []).map((item) => normalizeItem(item, 'postar', undefined, weekKeyStr, day.id));
  });

  return { gravar, editar, postar };
};

const normalizePlanner = (cloudData) => {
  const currentWeekKey = getWeekKey();

  if (!cloudData) return createPlanner(currentWeekKey);

  if (cloudData.weeks) {
    const weeks = Object.entries(cloudData.weeks).reduce((acc, [weekKey, weekData]) => {
      acc[weekKey] = mergeLegacyStoriesIntoGravar(weekData, weekKey);
      return acc;
    }, {});

    return {
      version: 4,
      currentWeekKey: cloudData.currentWeekKey || currentWeekKey,
      weeks: Object.keys(weeks).length ? weeks : { [currentWeekKey]: emptyWeekData() }
    };
  }

  if (cloudData.segunda && !cloudData.gravar) {
    return {
      version: 4,
      currentWeekKey,
      weeks: {
        [currentWeekKey]: mergeLegacyStoriesIntoGravar({
          gravar: cloudData,
          postar: emptyTabData()
        }, currentWeekKey)
      }
    };
  }

  return {
    version: 4,
    currentWeekKey,
    weeks: {
      [currentWeekKey]: mergeLegacyStoriesIntoGravar(cloudData, currentWeekKey)
    }
  };
};

const getRecordingTag = (value) => (value === 'com_alguem' ? 'Dois' : 'Sozinho');
const getContentTypeTag = (value) => {
  if (value === 'stories') return 'Stories';
  if (value === 'estatico') return 'Estático';
  if (value === 'carrossel') return 'Carrossel';
  if (value === 'video_longo') return 'Vídeo Longo';
  return 'Vídeo Curto';
};
const getProfileTag = (value) => (value === 'marco' ? 'Marco' : 'OPA');

const STATUS_META = {
  para_gravar:     { label: 'Para gravar',      dot: 'bg-blue-500',    chip: 'bg-blue-100 text-blue-700' },
  gravado:         { label: 'Gravado',          dot: 'bg-cyan-500',    chip: 'bg-cyan-100 text-cyan-700' },
  em_edicao:       { label: 'Em edição',        dot: 'bg-amber-500',   chip: 'bg-amber-100 text-amber-700' },
  pronto_postar:   { label: 'Pronto p/ postar', dot: 'bg-emerald-500', chip: 'bg-emerald-100 text-emerald-700' },
  postado:         { label: 'Postado',          dot: 'bg-green-700',   chip: 'bg-green-200 text-green-900' },
  atrasado_gravar: { label: 'Atrasado: gravar', dot: 'bg-rose-600',    chip: 'bg-rose-100 text-rose-700' },
  atrasado_editar: { label: 'Atrasado: editar', dot: 'bg-rose-600',    chip: 'bg-rose-100 text-rose-700' },
  atrasado_postar: { label: 'Atrasado: postar', dot: 'bg-rose-600',    chip: 'bg-rose-100 text-rose-700' }
};

const KANBAN_COLUMNS = [
  { id: 'atrasado',      label: 'Atrasados',        accent: 'border-rose-400 bg-rose-50/40' },
  { id: 'para_gravar',   label: 'Para gravar',      accent: 'border-blue-200 bg-blue-50/40' },
  { id: 'em_edicao',     label: 'Em edição',        accent: 'border-amber-200 bg-amber-50/40' },
  { id: 'pronto_postar', label: 'Pronto p/ postar', accent: 'border-emerald-200 bg-emerald-50/40' },
  { id: 'postado',       label: 'Postado',          accent: 'border-green-300 bg-green-50/40' }
];

const deriveStatus = (item, todayKey) => {
  const tab = item.tabKey || 'gravar';
  const completed = !!item.completed;
  if (tab === 'postar' && completed) return 'postado';
  if (tab === 'postar') return (item.postDate && item.postDate < todayKey) ? 'atrasado_postar' : 'pronto_postar';
  if (tab === 'editar') return (item.postDate && item.postDate < todayKey) ? 'atrasado_editar' : 'em_edicao';
  if (completed) return 'gravado';
  return (item.recordingDate && item.recordingDate < todayKey) ? 'atrasado_gravar' : 'para_gravar';
};

const statusToKanbanColumn = (status) => {
  if (status.startsWith('atrasado_')) return 'atrasado';
  if (status === 'gravado') return 'em_edicao';
  return status;
};

const getAllItemsFlat = (planner) => {
  const out = [];
  Object.entries(planner.weeks || {}).forEach(([weekKey, week]) => {
    daysOfWeek.forEach(d => {
      (week.gravar?.[d.id] || []).forEach(item => out.push({ item, weekKey, dayId: d.id, tab: 'gravar' }));
      (week.postar?.[d.id] || []).forEach(item => out.push({ item, weekKey, dayId: d.id, tab: 'postar' }));
    });
    (week.editar?.geral || []).forEach(item => out.push({ item, weekKey, dayId: 'geral', tab: 'editar' }));
  });
  return out;
};

const buildMonthGrid = (anchorDate) => {
  const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const startWeekday = first.getDay();
  const startOffset = startWeekday === 0 ? -6 : 1 - startWeekday;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() + startOffset);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }
  return cells;
};

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('gravar');
  const [planner, setPlanner] = useState(() => createPlanner());
  const [expandedDay, setExpandedDay] = useState(() => getTodayDayId());
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState(() => defaultItem());
  const [draggedItem, setDraggedItem] = useState(null);
  const [summaryModal, setSummaryModal] = useState({ isOpen: false, item: null });
  const [editModal, setEditModal] = useState({ isOpen: false, dayId: null, item: null, itemWeekKey: null });
  const [copiedState, setCopiedState] = useState(false);
  const [captionCopiedId, setCaptionCopiedId] = useState(null);

  const handleCopyCaption = (e, item) => {
    e.stopPropagation();
    if (!item.postCaption) return;
    navigator.clipboard.writeText(item.postCaption).then(() => {
      setCaptionCopiedId(item.id);
      setTimeout(() => setCaptionCopiedId(null), 1800);
    });
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [profileFilter, setProfileFilter] = useState('todos');
  const [editorFilter, setEditorFilter] = useState('todos');
  const [panoramaMode, setPanoramaMode] = useState(() => {
    try { return localStorage.getItem('panoramaMode') === 'true'; } catch { return false; }
  });
  const [viewMode, setViewMode] = useState('semanal');
  const [panoramaMonth, setPanoramaMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [calendarDateField, setCalendarDateField] = useState('postDate');
  const titleClicksRef = useRef({ count: 0, lastTime: 0 });

  const handleTitleClick = () => {
    const now = Date.now();
    const ref = titleClicksRef.current;
    if (now - ref.lastTime > 1500) ref.count = 0;
    ref.count += 1;
    ref.lastTime = now;
    if (ref.count >= 5) {
      const next = !panoramaMode;
      setPanoramaMode(next);
      try { localStorage.setItem('panoramaMode', String(next)); } catch {}
      ref.count = 0;
      if (!next) setViewMode('semanal');
    }
  };

  const openItemFromPanorama = (item, dayId, weekKey) => {
    setActiveTab(item.tabKey || 'gravar');
    setEditModal({ isOpen: true, dayId: dayId || 'geral', item: { ...item }, itemWeekKey: weekKey });
  };

  const currentWeekKey = planner.currentWeekKey;
  const currentWeekData = planner.weeks[currentWeekKey] || emptyWeekData();
  
  // Lista global de edição
  const allEditarItemsGlobal = Object.entries(planner.weeks).flatMap(([weekKey, weekData]) => {
     return weekData.editar.geral.map(item => ({ ...item, _sourceWeekKey: weekKey }));
  });
  
  allEditarItemsGlobal.sort((a, b) => {
     const dateA = a.postDate ? new Date(a.postDate + 'T12:00:00') : new Date(a._sourceWeekKey + 'T12:00:00');
     const dateB = b.postDate ? new Date(b.postDate + 'T12:00:00') : new Date(b._sourceWeekKey + 'T12:00:00');
     return dateA - dateB;
  });

  const getFilteredGravarPostar = (tabData) => {
    return Object.values(tabData).flat().filter(item => profileFilter === 'todos' || (item.profile || 'opa') === profileFilter);
  };

  const gravarSlimEchoes = {};
  daysOfWeek.forEach(day => { gravarSlimEchoes[day.id] = []; });
  Object.entries(planner.weeks).forEach(([weekKey, weekData]) => {
    (weekData.editar?.geral || []).forEach(item => {
      const origin = item._gravarOrigin;
      if (origin && origin.weekKey === currentWeekKey && gravarSlimEchoes[origin.dayId]) {
        gravarSlimEchoes[origin.dayId].push({ item, livesIn: { weekKey, dayId: 'geral' }, stageLabel: 'Em edição' });
      }
    });
    Object.entries(weekData.postar || {}).forEach(([livesDayId, items]) => {
      (items || []).forEach(item => {
        const origin = item._gravarOrigin;
        if (origin && origin.weekKey === currentWeekKey && gravarSlimEchoes[origin.dayId]) {
          gravarSlimEchoes[origin.dayId].push({ item, livesIn: { weekKey, dayId: livesDayId }, stageLabel: item.completed ? 'Postado' : 'Para postar' });
        }
      });
    });
  });

  const editarSlimEchoes = [];
  Object.entries(planner.weeks).forEach(([weekKey, weekData]) => {
    Object.entries(weekData.postar || {}).forEach(([livesDayId, items]) => {
      (items || []).forEach(item => {
        if (item._editarOrigin) {
          editarSlimEchoes.push({ item, livesIn: { weekKey, dayId: livesDayId }, stageLabel: item.completed ? 'Postado' : 'Para postar' });
        }
      });
    });
  });
  
  const allFilteredItems = activeTab === 'editar' 
      ? allEditarItemsGlobal.filter(item => 
          (profileFilter === 'todos' || (item.profile || 'opa') === profileFilter) &&
          (editorFilter === 'todos' || (item.editor || 'allyson') === editorFilter)
        )
      : getFilteredGravarPostar(currentWeekData[activeTab]);

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

  const handleDragStart = (dayId, item, itemWeekKey) => {
      if (activeTab === 'editar') return;
      setDraggedItem({ dayId, item, itemWeekKey });
  }
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e, targetDayId) => {
    e.preventDefault();
    if (!draggedItem || activeTab === 'editar') return;
    const { dayId: sourceDayId, item, itemWeekKey } = draggedItem;
    if (sourceDayId === targetDayId && itemWeekKey === currentWeekKey) return;

    const targetDateStr = getNextDayOfWeek(currentWeekKey, targetDayId);

    updatePlanner((prev) => {
      const next = { ...prev };
      
      next.weeks[itemWeekKey][activeTab][sourceDayId] = next.weeks[itemWeekKey][activeTab][sourceDayId].filter((entry) => entry.id !== item.id);
      
      const updatedItem = { ...item };
      if (activeTab === 'gravar') {
         updatedItem.recordingDate = targetDateStr;
      } else if (activeTab === 'postar') {
         updatedItem.postDate = targetDateStr;
      }
      
      if (!next.weeks[currentWeekKey]) next.weeks[currentWeekKey] = emptyWeekData();
      next.weeks[currentWeekKey][activeTab][targetDayId] = [...(next.weeks[currentWeekKey][activeTab][targetDayId] || []), updatedItem];
      
      return next;
    });

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

    updatePlanner((prev) => {
      const next = { ...prev };
      const { dayId: oldDayId, itemWeekKey: oldWeekKey, item: newProps } = editModal;
      
      if (activeTab === 'editar') {
         next.weeks[oldWeekKey].editar.geral = next.weeks[oldWeekKey].editar.geral.filter(i => i.id !== newProps.id);
      } else {
         next.weeks[oldWeekKey][activeTab][oldDayId] = next.weeks[oldWeekKey][activeTab][oldDayId].filter(i => i.id !== newProps.id);
      }
      
      const item = {
         ...newProps,
         primaryLink: normalizeUrl(newProps.primaryLink),
         secondaryLink: normalizeUrl(newProps.secondaryLink),
         editedVideoLink: normalizeUrl(newProps.editedVideoLink)
      };
      
      const targetTab = item.tabKey || activeTab;
      
      if (targetTab === 'editar') {
         const targetWeekKey = getWeekKeyAndDayId(item.postDate).weekKey;
         if (!next.weeks[targetWeekKey]) next.weeks[targetWeekKey] = emptyWeekData();
         next.weeks[targetWeekKey].editar.geral.push(item);
      } else if (targetTab === 'gravar') {
         const { weekKey, dayId } = getWeekKeyAndDayId(item.recordingDate);
         if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
         next.weeks[weekKey].gravar[dayId].push(item);
      } else if (targetTab === 'postar') {
         const { weekKey, dayId } = getWeekKeyAndDayId(item.postDate);
         if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
         next.weeks[weekKey].postar[dayId].push(item);
      }

      return next;
    });

    setEditModal({ isOpen: false, dayId: null, item: null, itemWeekKey: null });
  };

  const toggleDay = (dayId) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  const addItem = () => {
    if (!newItem.objective.trim()) return;

    const isEstatico = newItem.contentType === 'estatico' || newItem.contentType === 'carrossel';

    const item = {
      id: Date.now(),
      objective: newItem.objective,
      summary: newItem.summary,
      primaryLink: normalizeUrl(newItem.primaryLink),
      secondaryLink: normalizeUrl(newItem.secondaryLink),
      editedVideoLink: normalizeUrl(newItem.editedVideoLink),
      postCaption: newItem.postCaption,
      editor: newItem.editor,
      recordingDate: newItem.recordingDate,
      postDate: newItem.postDate,
      contentType: newItem.contentType,
      recordingType: newItem.recordingType,
      profile: newItem.profile,
      storyMode: newItem.storyMode || 'aovivo',
      time: newItem.time,
      completed: false,
      tabKey: isEstatico ? 'editar' : 'gravar'
    };

    updatePlanner((prev) => {
      const next = { ...prev };
      
      if (isEstatico) {
         const { weekKey } = getWeekKeyAndDayId(item.postDate);
         if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
         next.weeks[weekKey].editar.geral.push(item);
      } else {
         const { weekKey, dayId } = getWeekKeyAndDayId(item.recordingDate);
         if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
         next.weeks[weekKey].gravar[dayId].push(item);
      }
      return next;
    });

    setNewItem(defaultItem());
    setIsAdding(false);
  };

  const removeItem = (e, dayId, itemId, itemWeekKey) => {
    e.stopPropagation();
    updatePlanner((prev) => {
        const next = { ...prev };
        if (activeTab === 'editar') {
            next.weeks[itemWeekKey].editar.geral = next.weeks[itemWeekKey].editar.geral.filter((item) => item.id !== itemId);
        } else {
            next.weeks[itemWeekKey][activeTab][dayId] = next.weeks[itemWeekKey][activeTab][dayId].filter((item) => item.id !== itemId);
        }
        return next;
    });
  };

  const toggleComplete = (e, dayId, itemId, itemWeekKey) => {
    e.stopPropagation();
    updatePlanner((prev) => {
      const next = { ...prev };

      if (activeTab === 'gravar') {
        const items = next.weeks[itemWeekKey].gravar[dayId];
        const itemIndex = items.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
          const item = {
            ...items[itemIndex],
            completed: false,
            tabKey: 'editar',
            _gravarOrigin: items[itemIndex]._gravarOrigin || { weekKey: itemWeekKey, dayId }
          };
          items.splice(itemIndex, 1);

          const postWeekKey = item.postDate ? getWeekKeyAndDayId(item.postDate).weekKey : itemWeekKey;
          if (!next.weeks[postWeekKey]) next.weeks[postWeekKey] = emptyWeekData();
          next.weeks[postWeekKey].editar.geral.push(item);
        }
      } else if (activeTab === 'editar') {
        const items = next.weeks[itemWeekKey].editar.geral;
        const itemIndex = items.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
          const item = {
            ...items[itemIndex],
            completed: false,
            tabKey: 'postar',
            _editarOrigin: items[itemIndex]._editarOrigin || { weekKey: itemWeekKey }
          };
          items.splice(itemIndex, 1);

          const postWeekKey = item.postDate ? getWeekKeyAndDayId(item.postDate).weekKey : itemWeekKey;
          const postDayId = item.postDate ? getWeekKeyAndDayId(item.postDate).dayId : 'segunda';

          if (!next.weeks[postWeekKey]) next.weeks[postWeekKey] = emptyWeekData();
          next.weeks[postWeekKey].postar[postDayId] = [...(next.weeks[postWeekKey].postar[postDayId] || []), item];
        }
      } else if (activeTab === 'postar') {
        const items = next.weeks[itemWeekKey].postar[dayId];
        const itemIndex = items.findIndex(i => i.id === itemId);
        if (itemIndex > -1) {
          items[itemIndex].completed = !items[itemIndex].completed;
        }
      }
      return next;
    });
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
    setExpandedDay(nextWeekKey === getWeekKey() ? getTodayDayId() : 'segunda');
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
    setExpandedDay(getTodayDayId());
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
        Object.entries(weekData).forEach(([tabKey, content]) => {
            if (tabKey === 'editar') {
                content.geral.forEach(item => {
                  rows.push([
                    formatWeekRange(weekKey),
                    'Geral',
                    tabConfig[tabKey].label,
                    item.objective || '',
                    item.summary || '',
                    getContentTypeTag(item.contentType),
                    '',
                    getProfileTag(item.profile),
                    item.time || '',
                    item.primaryLink || '',
                    item.editedVideoLink || '',
                    item.completed ? 'Sim' : 'Nao'
                  ]);
                });
            } else {
              daysOfWeek.forEach((day) => {
                (content[day.id] || []).forEach((item) => {
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
            }
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

  const renderCard = (item, dayId, itemWeekKey) => {
    const isEditarAoVivo = activeTab === 'editar' && item.contentType === 'stories' && (item.storyMode || 'aovivo') === 'aovivo';
    return (
    <motion.div
        layout
        key={item.id}
        draggable={activeTab !== 'editar'}
        onDragStart={() => handleDragStart(dayId, item, itemWeekKey)}
        onClick={() => setEditModal({ isOpen: true, dayId, item: { ...item }, itemWeekKey })}
        className={`group/item relative flex items-start md:items-center justify-between p-4 md:p-5 rounded-[20px] border-2 ${item.completed ? 'bg-slate-50/50 border-transparent opacity-50' : isEditarAoVivo ? 'bg-rose-50/40 border-rose-300 border-l-[6px] border-l-rose-500 shadow-sm' : 'bg-white border-slate-50 hover:border-blue-200 shadow-sm'} cursor-pointer`}
    >
        {isEditarAoVivo && (
          <div className="absolute -top-2.5 left-6 inline-flex items-center gap-1.5 bg-rose-500 text-white px-3 py-0.5 rounded-full text-[9px] font-black uppercase shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Ao vivo — só baixar
          </div>
        )}
        <div className="flex items-start md:items-center space-x-3 md:space-x-4 flex-1 min-w-0">
        {activeTab !== 'editar' && (
            <div className="text-slate-300 cursor-grab active:cursor-grabbing mt-1 md:mt-0">
                <GripVertical className="w-5 h-5" />
            </div>
        )}
        <button onClick={(e) => toggleComplete(e, dayId, item.id, itemWeekKey)} className={`flex-shrink-0 mt-0.5 md:mt-0 ${item.completed ? 'text-emerald-500' : 'text-slate-200 hover:text-blue-500'}`}>
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
            {activeTab === 'editar' && item.editor && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-700`}>
                Editor: {item.editor}
                </span>
            )}
            {activeTab === 'postar' && item.time && (
                <span className={`flex items-center text-[10px] font-black uppercase ${item.completed ? 'text-slate-300' : 'text-slate-400'}`}>
                <Clock className="w-3 h-3 mr-1" />
                {item.time}
                </span>
            )}
            {(activeTab === 'editar' || activeTab === 'postar') && item.postDate && (
                <span className={`flex items-center text-[10px] font-black uppercase ${item.completed ? 'text-slate-300' : 'text-slate-400'}`}>
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
                        onClick={(e) => handleCopyCaption(e, item)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${captionCopiedId === item.id ? 'bg-emerald-500 text-white' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                    >
                        {captionCopiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{captionCopiedId === item.id ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{item.postCaption}</p>
            </div>
            )}
        </div>
        </div>
        <button onClick={(e) => removeItem(e, dayId, item.id, itemWeekKey)} className="p-2 md:p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl mt-0 md:mt-0">
        <Trash2 className="w-5 h-5 md:w-6 h-6" />
        </button>
    </motion.div>
    );
  };

  const todayKey = toDateKey(new Date());

  const matchesPanoramaFilters = (item) => {
    if (profileFilter !== 'todos' && (item.profile || 'opa') !== profileFilter) return false;
    if (editorFilter !== 'todos' && (item.editor || 'allyson') !== editorFilter) return false;
    return true;
  };

  const renderMonthView = () => {
    const cells = buildMonthGrid(panoramaMonth);
    const monthIdx = panoramaMonth.getMonth();
    const yearLabel = panoramaMonth.getFullYear();

    const itemsByDate = {};
    getAllItemsFlat(planner).forEach(({ item, weekKey, dayId }) => {
      if (!matchesPanoramaFilters(item)) return;
      const dateKey = calendarDateField === 'recordingDate'
        ? (item.recordingDate || null)
        : (item.postDate || item.recordingDate || null);
      if (!dateKey) return;
      if (!itemsByDate[dateKey]) itemsByDate[dateKey] = [];
      itemsByDate[dateKey].push({ item, weekKey, dayId });
    });

    const goPrev = () => setPanoramaMonth(new Date(yearLabel, monthIdx - 1, 1));
    const goNext = () => setPanoramaMonth(new Date(yearLabel, monthIdx + 1, 1));
    const goToday = () => { const d = new Date(); setPanoramaMonth(new Date(d.getFullYear(), d.getMonth(), 1)); };

    const weekdayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    return (
      <div className="bg-white border border-slate-100 rounded-[32px] p-4 md:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Visão mensal</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase">{MONTH_NAMES[monthIdx]} {yearLabel}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-50 p-1 rounded-xl flex items-center">
              <button onClick={() => setCalendarDateField('postDate')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${calendarDateField === 'postDate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Por postagem</button>
              <button onClick={() => setCalendarDateField('recordingDate')} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition ${calendarDateField === 'recordingDate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Por gravação</button>
            </div>
            <button onClick={goPrev} className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={goToday} className="px-3 h-9 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-black text-[10px] uppercase">Hoje</button>
            <button onClick={goNext} className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdayLabels.map(d => (
            <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase py-2">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((cellDate, idx) => {
            const cellKey = toDateKey(cellDate);
            const inMonth = cellDate.getMonth() === monthIdx;
            const isToday = cellKey === todayKey;
            const dayItems = itemsByDate[cellKey] || [];
            const hasOverdue = dayItems.some(({ item }) => deriveStatus(item, todayKey).startsWith('atrasado_'));
            return (
              <div
                key={idx}
                className={`min-h-[88px] md:min-h-[110px] p-1.5 rounded-xl border ${inMonth ? 'bg-white' : 'bg-slate-50/40'} ${isToday ? 'border-blue-500 ring-2 ring-blue-200' : hasOverdue ? 'border-rose-300' : 'border-slate-100'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[11px] font-black ${inMonth ? (isToday ? 'text-blue-600' : 'text-slate-700') : 'text-slate-300'}`}>{cellDate.getDate()}</span>
                  {dayItems.length > 0 && (
                    <span className="text-[8px] font-black text-slate-400">{dayItems.length}</span>
                  )}
                </div>
                <div className="space-y-1">
                  {dayItems.slice(0, 3).map(({ item, weekKey, dayId }) => {
                    const status = deriveStatus(item, todayKey);
                    const meta = STATUS_META[status];
                    const overdue = status.startsWith('atrasado_');
                    return (
                      <div
                        key={`${weekKey}-${dayId}-${item.id}`}
                        onClick={() => openItemFromPanorama(item, dayId, weekKey)}
                        className={`text-[9px] font-black uppercase truncate px-1.5 py-1 rounded cursor-pointer ${meta.chip} ${overdue ? 'ring-1 ring-rose-400 animate-pulse' : ''} ${item.completed ? 'line-through opacity-60' : ''}`}
                        title={`${item.objective} — ${meta.label}`}
                      >
                        {item.objective}
                      </div>
                    );
                  })}
                  {dayItems.length > 3 && (
                    <div className="text-[8px] font-black text-slate-400 px-1">+{dayItems.length - 3} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
          {Object.entries(STATUS_META).map(([k, m]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${m.dot}`} />
              <span className="text-[10px] font-black text-slate-500 uppercase">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderKanbanView = () => {
    const weekStart = parseWeekKey(currentWeekKey);
    const weekEnd = addDays(weekStart, 6);
    const weekStartKey = toDateKey(weekStart);
    const weekEndKey = toDateKey(weekEnd);

    const grouped = { atrasado: [], para_gravar: [], em_edicao: [], pronto_postar: [], postado: [] };

    getAllItemsFlat(planner).forEach(({ item, weekKey, dayId }) => {
      if (!matchesPanoramaFilters(item)) return;
      const status = deriveStatus(item, todayKey);
      const col = statusToKanbanColumn(status);
      const refDate = item.postDate || item.recordingDate;
      const inWeek = refDate && refDate >= weekStartKey && refDate <= weekEndKey;
      if (col === 'atrasado') {
        grouped.atrasado.push({ item, weekKey, dayId, status });
      } else if (col === 'postado') {
        if (inWeek) grouped.postado.push({ item, weekKey, dayId, status });
      } else if (inWeek) {
        grouped[col].push({ item, weekKey, dayId, status });
      }
    });

    Object.keys(grouped).forEach(k => {
      grouped[k].sort((a, b) => {
        const da = a.item.postDate || a.item.recordingDate || '';
        const db = b.item.postDate || b.item.recordingDate || '';
        return da.localeCompare(db);
      });
    });

    return (
      <div className="bg-white border border-slate-100 rounded-[32px] p-4 md:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Kanban — {formatWeekRange(currentWeekKey)}</p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase">Panorama da semana</h2>
            <p className="text-[10px] font-black text-slate-400 mt-1">Atrasados aparecem aqui mesmo se forem de outras semanas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {KANBAN_COLUMNS.map(col => {
            const items = grouped[col.id];
            return (
              <div key={col.id} className={`rounded-2xl border-2 ${col.accent} p-3 min-h-[200px]`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-black text-slate-700 uppercase">{col.label}</h3>
                  <span className="text-[10px] font-black text-slate-500 bg-white/70 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 && (
                    <p className="text-[10px] font-black text-slate-300 uppercase text-center py-6">Vazio</p>
                  )}
                  {items.map(({ item, weekKey, dayId, status }) => {
                    const meta = STATUS_META[status];
                    const overdue = status.startsWith('atrasado_');
                    return (
                      <div
                        key={`${weekKey}-${dayId}-${item.id}`}
                        onClick={() => openItemFromPanorama(item, dayId, weekKey)}
                        className={`bg-white p-2.5 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition ${overdue ? 'border-rose-300' : 'border-slate-100'}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${meta.dot} ${overdue ? 'animate-pulse' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-black text-slate-800 line-clamp-2 ${item.completed ? 'line-through opacity-60' : ''}`}>{item.objective}</p>
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              {item.profile && (
                                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.profile === 'marco' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{getProfileTag(item.profile)}</span>
                              )}
                              {item.postDate && (
                                <span className="text-[8px] font-black uppercase text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {formatDateShort(item.postDate)}
                                </span>
                              )}
                              {overdue && (
                                <span className="text-[8px] font-black uppercase text-rose-600 flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {meta.label.replace('Atrasado: ', '')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSlimCard = (item, livesDayId, livesWeekKey, stageLabel) => (
    <motion.div
      layout
      key={`slim-${livesWeekKey}-${livesDayId}-${item.id}`}
      onClick={() => setEditModal({ isOpen: true, dayId: livesDayId, item: { ...item }, itemWeekKey: livesWeekKey })}
      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50/60 hover:bg-slate-100 cursor-pointer border border-slate-100"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
        <span className="text-xs font-bold text-slate-400 line-through italic truncate">{item.objective}</span>
      </div>
      {stageLabel && (
        <span className="text-[8px] font-black uppercase text-slate-300 ml-2 flex-shrink-0">{stageLabel}</span>
      )}
    </motion.div>
  );

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
            <h1
              onClick={handleTitleClick}
              className="text-5xl md:text-7xl leading-[0.85] font-black uppercase cursor-pointer select-none"
              title={panoramaMode ? 'Modo panorama ativo' : ''}
            >
              Meu <span className="text-blue-600">Plano</span><br />Semanal
              {panoramaMode && <span className="ml-3 inline-block w-2 h-2 rounded-full bg-rose-500 align-top mt-2" />}
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
              <button onClick={() => setIsAdding(true)} className="h-11 px-5 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase shadow-md transition-transform hover:scale-105">
                <Plus className="w-4 h-4" />
                Nova Tarefa
              </button>
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
          {panoramaMode && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase mr-1">Modo Panorama:</span>
              <button onClick={() => setViewMode('semanal')} className={`h-9 px-4 flex items-center gap-1.5 rounded-xl font-black text-[10px] uppercase transition-all ${viewMode === 'semanal' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                <Calendar className="w-3.5 h-3.5" /> Semanal
              </button>
              <button onClick={() => setViewMode('mes')} className={`h-9 px-4 flex items-center gap-1.5 rounded-xl font-black text-[10px] uppercase transition-all ${viewMode === 'mes' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                <CalendarDays className="w-3.5 h-3.5" /> Mês
              </button>
              <button onClick={() => setViewMode('kanban')} className={`h-9 px-4 flex items-center gap-1.5 rounded-xl font-black text-[10px] uppercase transition-all ${viewMode === 'kanban' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                <LayoutGrid className="w-3.5 h-3.5" /> Kanban
              </button>
            </div>
          )}
        </section>

        {(!panoramaMode || viewMode === 'semanal') && (
        <div className="mb-12 hidden md:flex justify-center">
          <div className="bg-slate-100 p-1.5 rounded-[24px] flex items-center relative w-full max-w-lg">
            <motion.div
              className="absolute top-1.5 bottom-1.5 rounded-[20px] shadow-sm"
              initial={false}
              animate={{
                left: activeTab === 'gravar' ? '6px' : activeTab === 'editar' ? 'calc(33.33% + 2px)' : 'calc(66.66% - 2px)',
                width: 'calc(33.33% - 4px)',
                backgroundColor: activeTab === 'gravar' ? '#2563eb' : activeTab === 'editar' ? '#f59e0b' : '#059669'
              }}
            />
            <button onClick={() => setActiveTab('gravar')} className="relative flex-1 py-4 text-xs font-black uppercase">
              <motion.span animate={{ color: activeTab === 'gravar' ? '#ffffff' : '#94a3b8' }}>Gravar</motion.span>
            </button>
            <button onClick={() => setActiveTab('editar')} className="relative flex-1 py-4 text-xs font-black uppercase">
              <motion.span animate={{ color: activeTab === 'editar' ? '#ffffff' : '#94a3b8' }}>Editar</motion.span>
            </button>
            <button onClick={() => setActiveTab('postar')} className="relative flex-1 py-4 text-xs font-black uppercase">
              <motion.span animate={{ color: activeTab === 'postar' ? '#ffffff' : '#94a3b8' }}>Postar</motion.span>
            </button>
          </div>
        </div>
        )}

        <div className="mb-8 flex flex-col items-center justify-center space-y-4">
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
          
          {activeTab === 'editar' && (
            <div className="bg-white border-2 border-slate-100 p-1.5 rounded-[20px] flex items-center space-x-1 shadow-sm w-full max-w-md md:max-w-[400px]">
              {['todos', 'allyson', 'kallyl', 'natalia'].map(ed => (
                <button 
                  key={ed}
                  onClick={() => setEditorFilter(ed)} 
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${editorFilter === ed ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                >
                  {ed === 'todos' ? 'Todos Editores' : ed}
                </button>
              ))}
            </div>
          )}
        </div>

        {panoramaMode && viewMode === 'mes' && renderMonthView()}
        {panoramaMode && viewMode === 'kanban' && renderKanbanView()}

        {(!panoramaMode || viewMode === 'semanal') && (
        <motion.div className="space-y-8">
          {activeTab === 'editar' ? (
              <div className="bg-white border border-slate-100 rounded-[32px] p-5 md:p-8 shadow-sm">
                  <h2 className="text-2xl font-black text-slate-800 uppercase mb-6 text-center">Fila Global de Edição</h2>
                  {allFilteredItems.length === 0 && editarSlimEchoes.length === 0 ? (
                      <div className="text-center py-12 text-slate-300 font-black uppercase bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 text-sm">
                          Nenhum conteúdo para editar no momento
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {allFilteredItems.map(item => renderCard(item, 'geral', item._sourceWeekKey))}
                          {editarSlimEchoes.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-slate-100 space-y-1.5">
                              <p className="text-[9px] font-black text-slate-300 uppercase mb-2">Concluídos</p>
                              {editarSlimEchoes
                                .filter(e => (profileFilter === 'todos' || (e.item.profile || 'opa') === profileFilter) && (editorFilter === 'todos' || (e.item.editor || 'allyson') === editorFilter))
                                .map(e => renderSlimCard(e.item, e.livesIn.dayId, e.livesIn.weekKey, e.stageLabel))}
                            </div>
                          )}
                      </div>
                  )}
              </div>
          ) : (
            daysOfWeek.map((day, dayIndex) => {
              const allDayItems = (currentWeekData[activeTab][day.id] || []).filter(item => profileFilter === 'todos' || (item.profile || 'opa') === profileFilter);
              const filteredDayItems = activeTab === 'postar' ? allDayItems.filter(item => !item.completed) : allDayItems;
              const completedPostarItems = activeTab === 'postar' ? allDayItems.filter(item => item.completed) : [];
              const dayEchoes = activeTab === 'gravar' ? (gravarSlimEchoes[day.id] || []).filter(e => profileFilter === 'todos' || (e.item.profile || 'opa') === profileFilter) : [];
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
                          {filteredDayItems.length === 0 && completedPostarItems.length === 0 && dayEchoes.length === 0 && (
                            <div className="text-center py-8 text-slate-300 font-black uppercase bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 text-sm">
                              Sem planos para hoje
                            </div>
                          )}

                          {(() => {
                            const videos = filteredDayItems.filter(item => item.contentType !== 'stories');
                            const storiesAoVivo = filteredDayItems.filter(item => item.contentType === 'stories' && (item.storyMode || 'aovivo') === 'aovivo');
                            const storiesBanco = filteredDayItems.filter(item => item.contentType === 'stories' && item.storyMode === 'banco');
                            return (
                              <>
                                {videos.length > 0 && (
                                  <div className="mb-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 ml-2">Vídeos</h4>
                                    <div className="space-y-3">
                                      {videos.map((item) => renderCard(item, day.id, currentWeekKey))}
                                    </div>
                                  </div>
                                )}
                                {storiesAoVivo.length > 0 && activeTab === 'gravar' && (
                                  <div className="mb-6 -mx-2 px-3 py-3 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/50 border-2 border-rose-200">
                                    <div className="flex items-center gap-2 mb-3 ml-1">
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500 text-white text-[11px] animate-pulse">●</span>
                                      <h4 className="text-xs font-black text-rose-700 uppercase tracking-wide">Stories — Ao vivo</h4>
                                      <span className="text-[9px] font-bold text-rose-500 uppercase">Postar agora</span>
                                    </div>
                                    <div className="space-y-3">
                                      {storiesAoVivo.map((item) => renderCard(item, day.id, currentWeekKey))}
                                    </div>
                                  </div>
                                )}
                                {storiesBanco.length > 0 && activeTab === 'gravar' && (
                                  <div className="mb-6 -mx-2 px-3 py-3 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100/40 border-2 border-violet-200">
                                    <div className="flex items-center gap-2 mb-3 ml-1">
                                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-500 text-white text-[12px]">📦</span>
                                      <h4 className="text-xs font-black text-violet-700 uppercase tracking-wide">Stories — Banco</h4>
                                      <span className="text-[9px] font-bold text-violet-500 uppercase">Guardar para depois</span>
                                    </div>
                                    <div className="space-y-3">
                                      {storiesBanco.map((item) => renderCard(item, day.id, currentWeekKey))}
                                    </div>
                                  </div>
                                )}
                                {(storiesAoVivo.length > 0 || storiesBanco.length > 0) && activeTab !== 'gravar' && (
                                  <div className="mb-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 ml-2">Stories</h4>
                                    <div className="space-y-3">
                                      {[...storiesAoVivo, ...storiesBanco].map((item) => renderCard(item, day.id, currentWeekKey))}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}

                          {(dayEchoes.length > 0 || completedPostarItems.length > 0) && (
                            <div className="pt-3 mt-3 border-t border-slate-100 space-y-1.5">
                              <h4 className="text-[9px] font-black text-slate-300 uppercase mb-2 ml-1">Concluídos</h4>
                              {dayEchoes.map(e => renderSlimCard(e.item, e.livesIn.dayId, e.livesIn.weekKey, e.stageLabel))}
                              {completedPostarItems.map(item => renderSlimCard(item, day.id, currentWeekKey, 'Postado'))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              );
            })
          )}
        </motion.div>
        )}

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
          <button onClick={() => setActiveTab('editar')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'editar' ? 'text-amber-600' : 'text-slate-400'}`}>
            <Scissors className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Editar</span>
          </button>
          <button onClick={() => setActiveTab('postar')} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'postar' ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Postar</span>
          </button>
        </div>
      </nav>

      {/* MODAL ADICIONAR TAREFA GLOBAL */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsAdding(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 rounded-[32px] p-6 md:p-8 max-w-2xl w-full shadow-2xl relative border border-slate-700 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full z-10">
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-black text-white uppercase mb-6 pr-10">Nova Tarefa</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Título da Tarefa</label>
                  <input
                    type="text"
                    placeholder="Ex: Video sobre organização"
                    className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-base placeholder:text-slate-600"
                    value={newItem.objective}
                    onChange={(e) => setNewItem({ ...newItem, objective: e.target.value })}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Roteiro / Resumo</label>
                  <div className="bg-white text-slate-800 rounded-xl overflow-hidden mb-2">
                    <ReactQuill 
                      theme="snow"
                      value={newItem.summary} 
                      onChange={(content) => setNewItem({ ...newItem, summary: content })} 
                      placeholder="GANCHO, PROMESSA, TOPICOS E FECHAMENTO"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Tipo</label>
                    <select
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                      value={newItem.contentType}
                      onChange={(e) => setNewItem({ ...newItem, contentType: e.target.value })}
                    >
                      <option value="video_curto">Video curto</option>
                      <option value="video_longo">Vídeo Longo</option>
                      <option value="stories">Stories</option>
                      <option value="estatico">Estático</option>
                      <option value="carrossel">Carrossel</option>
                    </select>
                  </div>
                  {newItem.contentType === 'stories' && (
                    <div className="md:col-span-3">
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Modo do Story</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, storyMode: 'aovivo' })}
                          className={`p-4 rounded-xl font-black uppercase text-sm border-2 transition-all ${newItem.storyMode === 'aovivo' ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-rose-500/50'}`}
                        >
                          🔴 Ao vivo<br /><span className="text-[9px] font-bold normal-case opacity-90">Gravar e postar agora</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewItem({ ...newItem, storyMode: 'banco' })}
                          className={`p-4 rounded-xl font-black uppercase text-sm border-2 transition-all ${newItem.storyMode === 'banco' ? 'bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-violet-500/50'}`}
                        >
                          📦 Banco<br /><span className="text-[9px] font-bold normal-case opacity-90">Guardar para depois</span>
                        </button>
                      </div>
                    </div>
                  )}
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Dia para Gravar</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      value={newItem.recordingDate}
                      onChange={(e) => setNewItem({ ...newItem, recordingDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Dia para Postar</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      value={newItem.postDate}
                      onChange={(e) => setNewItem({ ...newItem, postDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Responsável Edição</label>
                    <select
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                      value={newItem.editor}
                      onChange={(e) => setNewItem({ ...newItem, editor: e.target.value })}
                    >
                      <option value="allyson">Allyson</option>
                      <option value="kallyl">Kallyl</option>
                      <option value="natalia">Natalia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Horario da Postagem</label>
                    <input
                      type="text"
                      placeholder="Ex: 14:00"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600"
                      value={newItem.time}
                      onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Link do Vídeo Bruto</label>
                    <input
                      type="text"
                      placeholder="Link do drive"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600"
                      value={newItem.primaryLink}
                      onChange={(e) => setNewItem({ ...newItem, primaryLink: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Link do Arquivo Editado</label>
                    <input
                      type="text"
                      placeholder="Pasta completa (já deixarei preenchido)"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600"
                      value={newItem.editedVideoLink}
                      onChange={(e) => setNewItem({ ...newItem, editedVideoLink: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-slate-800">
                  <button onClick={addItem} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 text-sm uppercase">
                    Salvar Tarefa
                  </button>
                  <button onClick={() => setIsAdding(false)} className="px-8 bg-slate-800 text-white font-black py-4 rounded-xl hover:bg-slate-700 text-sm uppercase">
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUMMARY MODAL */}
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

      {/* EDIT MODAL */}
      <AnimatePresence>
        {editModal.isOpen && editModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditModal({ isOpen: false, dayId: null, item: null, itemWeekKey: null })}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={(e) => e.stopPropagation()} className="bg-slate-900 rounded-[32px] p-6 md:p-8 max-w-xl w-full shadow-2xl relative border border-slate-700">
              <button onClick={() => setEditModal({ isOpen: false, dayId: null, item: null, itemWeekKey: null })} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-black text-white uppercase mb-6 pr-10">Editar tarefa</h3>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Título da Tarefa</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-base"
                      value={editModal.item.objective || ''}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, objective: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Etapa Atual</label>
                    <select
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                      value={editModal.item.tabKey || 'gravar'}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, tabKey: e.target.value } })}
                    >
                      <option value="gravar">Gravar</option>
                      <option value="editar">Editar</option>
                      <option value="postar">Postar</option>
                    </select>
                  </div>
                </div>

                {editModal.item.contentType === 'stories' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Modo do Story</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setEditModal({ ...editModal, item: { ...editModal.item, storyMode: 'aovivo' } })}
                        className={`p-4 rounded-xl font-black uppercase text-sm border-2 transition-all ${(editModal.item.storyMode || 'aovivo') === 'aovivo' ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-rose-500/50'}`}
                      >
                        🔴 Ao vivo<br /><span className="text-[9px] font-bold normal-case opacity-90">Gravar e postar agora</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditModal({ ...editModal, item: { ...editModal.item, storyMode: 'banco' } })}
                        className={`p-4 rounded-xl font-black uppercase text-sm border-2 transition-all ${editModal.item.storyMode === 'banco' ? 'bg-violet-500 text-white border-violet-400 shadow-lg shadow-violet-500/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-violet-500/50'}`}
                      >
                        📦 Banco<br /><span className="text-[9px] font-bold normal-case opacity-90">Guardar para depois</span>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Roteiro / Resumo</label>
                    <div className="bg-white text-slate-800 rounded-xl overflow-hidden mb-2">
                      <ReactQuill 
                        theme="snow"
                        value={editModal.item.summary || ''} 
                        onChange={(content) => setEditModal({ ...editModal, item: { ...editModal.item, summary: content } })} 
                      />
                    </div>
                </div>
                
                {(activeTab === 'postar' || activeTab === 'editar') && (
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Legenda do post</label>
                        <textarea
                            rows={4}
                            className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm resize-none"
                            value={editModal.item.postCaption || ''}
                            onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, postCaption: e.target.value } })}
                            placeholder="Escreva a legenda aqui..."
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Dia para Gravar</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      value={editModal.item.recordingDate || ''}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, recordingDate: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Dia para Postar</label>
                    <input
                      type="date"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      value={editModal.item.postDate || ''}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, postDate: e.target.value } })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Responsável Edição</label>
                        <select
                        className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                        value={editModal.item.editor || 'allyson'}
                        onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, editor: e.target.value } })}
                        >
                        <option value="allyson">Allyson</option>
                        <option value="kallyl">Kallyl</option>
                        <option value="natalia">Natalia</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Horario da postagem</label>
                        <input
                        type="text"
                        className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                        value={editModal.item.time || ''}
                        onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, time: e.target.value } })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Link do Vídeo Bruto</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      value={editModal.item.primaryLink || ''}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, primaryLink: e.target.value } })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-2">Link do Arquivo Editado</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm"
                      value={editModal.item.editedVideoLink || ''}
                      onChange={(e) => setEditModal({ ...editModal, item: { ...editModal.item, editedVideoLink: e.target.value } })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button onClick={handleSaveEdit} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 text-sm uppercase">
                  Salvar alteracoes
                </button>
                <button onClick={() => setEditModal({ isOpen: false, dayId: null, item: null, itemWeekKey: null })} className="px-8 bg-slate-800 text-white font-black py-4 rounded-xl hover:bg-slate-700 text-sm uppercase">
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
