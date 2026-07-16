import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Loader2,
  Plus,
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
import 'react-quill-new/dist/quill.snow.css';
import { firebaseConfig, firestoreDatabaseId } from './lib/firebase';
import {
  daysOfWeek,
  toDateKey,
  addDays,
  getWeekKey,
  parseWeekKey,
  formatDateShort,
  formatWeekRange,
  getTodayDayId,
  getWeekKeyAndDayId,
  getNextDayOfWeek
} from './lib/dates';
import {
  tabConfig,
  getRecordingTag,
  getContentTypeTag,
  getProfileTag,
  getPilarLabel,
  getPilarBadgeClass,
  profileMatchesFilter
} from './lib/tags';
import LoginScreen from './components/LoginScreen';
import SummaryModal from './components/SummaryModal';
import AddItemModal from './components/AddItemModal';
import EditItemModal from './components/EditItemModal';
import BulkImportModal from './components/BulkImportModal';
import { TaskCard, PreviewCard, SlimCard } from './components/TaskCard';
import { CronogramaView } from './components/CronogramaView';
import { GavetasView } from './components/GavetasView';
import { Planilha } from './components/Planilha';
import { DayPilarPicker } from './components/DayPilarPicker';
import {
  HeaderBar,
  SectionBar,
  MobileBottomNav,
  FloatingDesktopNav,
  PageFooter,
  StageQueue,
  QueueEmpty,
  QueueTabs
} from './components/layout';
import { radius, text, emptyState } from './lib/ui';
import {
  emptyWeekData,
  emptyDayPilars,
  newId,
  defaultItem,
  createPlanner,
  normalizeUrl,
  normalizePlanner,
  stripHtml,
  formatCode
} from './lib/planner';
import {
  getEditarQueue,
  groupEditarByWeek,
  getGravarQueue,
  getGravarConcluidos,
  getGravarSlimEchoes,
  getEditarSlimEchoes,
  getEditarPreviewsByDay,
  getAllItems,
  getRepostablePosts
} from './lib/selectors';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('cronograma');
  const [planner, setPlanner] = useState(() => createPlanner());
  const [expandedDay, setExpandedDay] = useState(() => getTodayDayId());
  const [isAdding, setIsAdding] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [newItem, setNewItem] = useState(() => defaultItem());
  const [draggedItem, setDraggedItem] = useState(null);
  const [summaryModal, setSummaryModal] = useState({ isOpen: false, item: null });
  const [editModal, setEditModal] = useState({ isOpen: false, dayId: null, item: null, itemWeekKey: null, sourceStage: null });
  const [copiedState, setCopiedState] = useState(false);
  const [captionCopiedId, setCaptionCopiedId] = useState(null);
  const [firstCommentCopiedId, setFirstCommentCopiedId] = useState(null);
  const [brokersCopiedId, setBrokersCopiedId] = useState(null);
  const [gravarListFilter, setGravarListFilter] = useState('pendentes');
  const [showPlanilha, setShowPlanilha] = useState(false);
  const [planilhaSearch, setPlanilhaSearch] = useState('');

  const handleCopyCaption = (e, item) => {
    e.stopPropagation();
    if (!item.postCaption) return;
    navigator.clipboard.writeText(item.postCaption).then(() => {
      setCaptionCopiedId(item.id);
      setTimeout(() => setCaptionCopiedId(null), 1800);
    });
  };

  const handleCopyFirstComment = (e, item) => {
    e.stopPropagation();
    if (!item.firstComment) return;
    navigator.clipboard.writeText(item.firstComment).then(() => {
      setFirstCommentCopiedId(item.id);
      setTimeout(() => setFirstCommentCopiedId(null), 1800);
    });
  };

  const handleCopyBrokers = (e, item) => {
    e.stopPropagation();
    const parts = [];
    if (item.objective) parts.push(`📌 ${item.objective}`);
    if (item.brokersNote) parts.push(item.brokersNote);
    if (item.brokersPostLink) parts.push(item.brokersPostLink);
    const text = parts.join('\n').trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setBrokersCopiedId(item.id);
      setTimeout(() => setBrokersCopiedId(null), 1800);
    });
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [profileFilter, setProfileFilter] = useState(() => {
    try { return localStorage.getItem('profileFilter') || 'todos'; } catch { return 'todos'; }
  });
  const [editorFilter, setEditorFilter] = useState(() => {
    try { return localStorage.getItem('editorFilter') || 'todos'; } catch { return 'todos'; }
  });
  useEffect(() => { try { localStorage.setItem('profileFilter', profileFilter); } catch {} }, [profileFilter]);
  // Gravar é sempre só do Marco — o filtro é ignorado nessa aba (mas vale na planilha).
  const effectiveProfileFilter = (activeTab === 'gravar' && !showPlanilha) ? 'todos' : profileFilter;
  useEffect(() => { try { localStorage.setItem('editorFilter', editorFilter); } catch {} }, [editorFilter]);
  const currentWeekKey = planner.currentWeekKey;
  const currentWeekData = planner.weeks[currentWeekKey] || emptyWeekData();

  const allEditarItemsGlobal = getEditarQueue(planner, effectiveProfileFilter, editorFilter);
  const allGravarGlobal = getGravarQueue(planner, effectiveProfileFilter);
  const allGravarConcluidosGlobal = getGravarConcluidos(planner, effectiveProfileFilter);
  const gravarSlimEchoes = getGravarSlimEchoes(planner, currentWeekKey);
  const editarSlimEchoes = getEditarSlimEchoes(planner);
  const editarPreviewsByDay = getEditarPreviewsByDay(planner, currentWeekKey);

  const isGravarList = activeTab === 'gravar';

  const getFilteredGravarPostar = (tabData) =>
    Object.values(tabData).flat().filter(item => !item.banco && profileMatchesFilter(item.profile, effectiveProfileFilter));

  const allFilteredItems = activeTab === 'editar'
    ? allEditarItemsGlobal
    : isGravarList
      ? allGravarGlobal
      : (activeTab === 'cronograma' || activeTab === 'gavetas')
        ? getFilteredGravarPostar(currentWeekData.postar)
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
    saveTimerRef.current = setTimeout(flushSave, 600);
  };

  useEffect(() => {
    const onUnload = () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        flushSave();
      }
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  });

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
      const next = { ...prev, weeks: { ...prev.weeks } };
      const { item: newProps } = editModal;
      const id = newProps.id;

      // Remove a tarefa de QUALQUER lugar onde ela esteja — independente de
      // onde o modal foi aberto (gravar, editar, postar, concluídos, calendário
      // ou tabela). Antes a remoção dependia das coordenadas de origem; quando
      // elas não batiam com o local real, o filter quebrava e o save abortava.
      Object.keys(next.weeks).forEach((wk) => {
         const week = next.weeks[wk];
         const rebuilt = {
            gravar: {},
            editar: { geral: (week.editar?.geral || []).filter(i => i.id !== id) },
            postar: {}
         };
         daysOfWeek.forEach((d) => {
            rebuilt.gravar[d.id] = (week.gravar?.[d.id] || []).filter(i => i.id !== id);
            rebuilt.postar[d.id] = (week.postar?.[d.id] || []).filter(i => i.id !== id);
         });
         next.weeks[wk] = rebuilt;
      });

      const item = {
         ...newProps,
         primaryLink: normalizeUrl(newProps.primaryLink),
         secondaryLink: normalizeUrl(newProps.secondaryLink),
         editedVideoLink: normalizeUrl(newProps.editedVideoLink)
      };
      
      // 'cronograma' não é uma etapa de dados — é só uma visão. Se o alvo cair
      // nela (ex: item sem tabKey editado pelo cronograma), grava em 'postar',
      // que é a etapa que o cronograma representa.
      const rawTarget = item.tabKey || editModal.sourceStage || activeTab;
      const targetTab = ['gravar', 'editar', 'postar'].includes(rawTarget) ? rawTarget : 'postar';

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

    setEditModal({ isOpen: false, dayId: null, item: null, itemWeekKey: null, sourceStage: null });
  };

  const toggleDay = (dayId) => {
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  const setDayPilar = (profile, dayId, pilarId) => {
    updatePlanner((prev) => {
      const next = { ...prev };
      const base = prev.dayPilars || emptyDayPilars();
      next.dayPilars = {
        ...base,
        [profile]: { ...(base[profile] || {}), [dayId]: pilarId || '' }
      };
      return next;
    });
  };

  const addItem = () => {
    if (!newItem.objective.trim()) return;

    const isEstatico = newItem.contentType === 'estatico' || newItem.contentType === 'carrossel';
    const isRepost = newItem.contentType === 'repost_stories';
    const stage = isRepost ? 'postar' : (newItem.initialStage || (isEstatico ? 'editar' : 'gravar'));

    const banco = Boolean(newItem.banco);
    const item = {
      id: newId(),
      objective: newItem.objective,
      summary: newItem.summary,
      primaryLink: normalizeUrl(newItem.primaryLink),
      secondaryLink: normalizeUrl(newItem.secondaryLink),
      editedVideoLink: normalizeUrl(newItem.editedVideoLink),
      postCaption: newItem.postCaption,
      firstComment: newItem.firstComment,
      editor: newItem.editor,
      recordingDate: banco ? '' : newItem.recordingDate,
      postDate: banco ? '' : newItem.postDate,
      contentType: newItem.contentType,
      recordingType: newItem.recordingType,
      profile: newItem.profile,
      pilar: newItem.pilar || '',
      banco,
      storyMode: newItem.storyMode || 'aovivo',
      time: newItem.time,
      repostOfId: newItem.repostOfId || '',
      repostOfCode: newItem.repostOfCode || '',
      repostOfObjective: newItem.repostOfObjective || '',
      forAllBrokers: Boolean(newItem.forAllBrokers),
      brokersPostLink: newItem.brokersPostLink || '',
      brokersNote: newItem.brokersNote || '',
      completed: false,
      tabKey: stage
    };

    updatePlanner((prev) => {
      const next = { ...prev };
      const counters = { marco: 0, opa: 0, collab: 0, ...(prev.counters || {}) };
      counters[item.profile] = (counters[item.profile] || 0) + 1;
      next.counters = counters;
      item.code = formatCode(item.profile, counters[item.profile]);

      if (stage === 'editar') {
         const { weekKey } = getWeekKeyAndDayId(item.postDate);
         if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
         next.weeks[weekKey].editar.geral.push(item);
      } else if (stage === 'postar') {
         const { weekKey, dayId } = getWeekKeyAndDayId(item.postDate);
         if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
         next.weeks[weekKey].postar[dayId].push(item);
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

  // Importação em massa: recebe itens já validados (com a forma de defaultItem)
  // vindos do parser e os insere todos numa única atualização do planner.
  const importItems = (parsedItems) => {
    if (!parsedItems || parsedItems.length === 0) return;

    updatePlanner((prev) => {
      const next = { ...prev };
      const counters = { marco: 0, opa: 0, collab: 0, ...(prev.counters || {}) };

      parsedItems.forEach((src) => {
        const isEstatico = src.contentType === 'estatico' || src.contentType === 'carrossel';
        const isRepost = src.contentType === 'repost_stories';
        const stage = isRepost ? 'postar' : (isEstatico ? 'editar' : 'gravar');
        const banco = Boolean(src.banco);
        const profile = src.profile || 'opa';

        counters[profile] = (counters[profile] || 0) + 1;

        const item = {
          ...src,
          id: newId(),
          primaryLink: normalizeUrl(src.primaryLink),
          secondaryLink: normalizeUrl(src.secondaryLink),
          editedVideoLink: normalizeUrl(src.editedVideoLink),
          brokersPostLink: normalizeUrl(src.brokersPostLink),
          recordingDate: banco ? '' : src.recordingDate,
          postDate: banco ? '' : src.postDate,
          completed: false,
          tabKey: stage,
          code: formatCode(profile, counters[profile])
        };

        if (stage === 'editar') {
          const { weekKey } = getWeekKeyAndDayId(item.postDate);
          if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
          next.weeks[weekKey].editar.geral.push(item);
        } else if (stage === 'postar') {
          const { weekKey, dayId } = getWeekKeyAndDayId(item.postDate);
          if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
          next.weeks[weekKey].postar[dayId].push(item);
        } else {
          const { weekKey, dayId } = getWeekKeyAndDayId(item.recordingDate);
          if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
          next.weeks[weekKey].gravar[dayId].push(item);
        }
      });

      next.counters = counters;
      return next;
    });

    setIsBulkImporting(false);
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

  const exportCsv = ({ from, to } = {}) => {
    const inRange = (item) => {
      if (!from && !to) return true;
      const anchor = item.postDate || item.recordingDate;
      if (!anchor) return false;
      if (from && anchor < from) return false;
      if (to && anchor > to) return false;
      return true;
    };

    const rows = [[
      'Semana', 'Dia', 'Etapa', 'Titulo', 'Roteiro', 'Tipo', 'Participacao',
      'Perfil', 'Pilar', 'Horario', 'Data gravar', 'Data postar',
      'Link principal', 'Link secundario', 'Concluido'
    ]];

    Object.entries(planner.weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([weekKey, weekData]) => {
        Object.entries(weekData).forEach(([tabKey, content]) => {
          if (tabKey === 'editar') {
            (content.geral || []).filter(inRange).forEach(item => {
              rows.push([
                formatWeekRange(weekKey),
                'Geral',
                tabConfig[tabKey].label,
                item.objective || '',
                item.summary || '',
                getContentTypeTag(item.contentType),
                '',
                getProfileTag(item.profile),
                getPilarLabel(item.pilar),
                item.time || '',
                item.recordingDate || '',
                item.postDate || '',
                item.primaryLink || '',
                item.editedVideoLink || '',
                item.completed ? 'Sim' : 'Nao'
              ]);
            });
          } else {
            daysOfWeek.forEach((day) => {
              (content[day.id] || []).filter(inRange).forEach((item) => {
                rows.push([
                  formatWeekRange(weekKey),
                  day.label,
                  tabConfig[tabKey].label,
                  item.objective || '',
                  item.summary || '',
                  getContentTypeTag(item.contentType),
                  tabKey === 'gravar' ? getRecordingTag(item.recordingType) : '',
                  getProfileTag(item.profile),
                  getPilarLabel(item.pilar),
                  item.time || '',
                  item.recordingDate || '',
                  item.postDate || '',
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
    const stamp = toDateKey(new Date());
    const suffix = !from && !to ? 'tudo' : `${from || 'inicio'}_ate_${to || 'fim'}`;
    link.download = `organizacao-markito-${stamp}-${suffix}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const wipeAllContent = () => {
    updatePlanner(() => createPlanner());
    setPlanilhaSearch('');
  };

  const deletePlanilhaItem = (item) => {
    const stage = item._stage;
    const wk = item._sourceWeekKey;
    const did = item._sourceDayId;
    if (!stage || !wk) return;
    updatePlanner(prev => {
      const next = { ...prev };
      if (!next.weeks[wk]) return prev;
      if (stage === 'editar') {
        next.weeks[wk].editar.geral = (next.weeks[wk].editar.geral || []).filter(i => i.id !== item.id);
      } else if (next.weeks[wk][stage] && next.weeks[wk][stage][did]) {
        next.weeks[wk][stage][did] = next.weeks[wk][stage][did].filter(i => i.id !== item.id);
      }
      return next;
    });
  };

  const moveItem = (weekKey, dayId, itemId, direction, peerIds) => {
    if (activeTab !== 'postar') return;
    updatePlanner(prev => {
      const next = { ...prev };
      const list = next.weeks[weekKey]?.postar?.[dayId];
      if (!list) return prev;
      const peerIdx = peerIds.indexOf(itemId);
      const targetPeerIdx = peerIdx + (direction === 'up' ? -1 : 1);
      if (peerIdx < 0 || targetPeerIdx < 0 || targetPeerIdx >= peerIds.length) return prev;
      const targetPeerId = peerIds[targetPeerIdx];
      const a = list.findIndex(i => i.id === itemId);
      const b = list.findIndex(i => i.id === targetPeerId);
      if (a < 0 || b < 0) return prev;
      [list[a], list[b]] = [list[b], list[a]];
      return next;
    });
  };

  const openEdit = (dayId, item, itemWeekKey, sourceStage = null) =>
    setEditModal({ isOpen: true, dayId, item: { ...item }, itemWeekKey, sourceStage });

  // A interface tem três visões: Cronograma, Gavetas e Planilha. As etapas
  // gravar/editar/postar continuam existindo por baixo (o item flui entre elas),
  // mas não são mais navegáveis diretamente.
  const selectView = (view) => {
    if (view === 'planilha') {
      setShowPlanilha(true);
    } else {
      setShowPlanilha(false);
      setActiveTab(view); // 'cronograma' | 'gavetas'
    }
    setIsAdding(false);
  };

  // Converte o rótulo de tipo do editor glass (ex: "Lançamento") de volta para
  // os campos reais do item (contentType + pilar).
  const typeLabelToFields = (label) => {
    const l = (label || '').toLowerCase();
    if (l.includes('lanç') || l.includes('lanc')) return { contentType: 'video_curto', pilar: 'lancamentos' };
    if (l.includes('carrossel')) return { contentType: 'carrossel', pilar: '' };
    if (l.includes('estát') || l.includes('estat') || l === 'post') return { contentType: 'estatico', pilar: '' };
    if (l.includes('stories')) return { contentType: 'stories', pilar: '' };
    return { contentType: 'video_curto', pilar: '' };
  };

  // ── Handlers do Cronograma (posts reais, etapa "postar") ──
  // editing pode ser { dateKey } (novo) ou { card, weekKey, dayId } (edição).
  const cronoSavePost = (editing, draft) => {
    const { contentType, pilar } = typeLabelToFields(draft.type);
    updatePlanner((prev) => {
      const next = { ...prev, weeks: { ...prev.weeks } };
      if (editing?.card) {
        // Edição: atualiza o item onde ele vive.
        const wk = editing.weekKey, did = editing.dayId;
        const list = next.weeks[wk]?.postar?.[did];
        if (list) {
          const idx = list.findIndex(i => i.id === editing.card.id);
          if (idx > -1) list[idx] = { ...list[idx], objective: draft.title, time: draft.note, primaryLink: normalizeUrl(draft.link), postCaption: draft.legenda, observacao: draft.observacao || '', responsavel: draft.responsavel, contentType, pilar };
        }
      } else {
        // Novo post naquele dia.
        const dateKey = editing.dateKey;
        const { weekKey, dayId } = getWeekKeyAndDayId(dateKey);
        if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
        const counters = { marco: 0, opa: 0, collab: 0, ...(prev.counters || {}) };
        const profile = 'opa';
        counters[profile] = (counters[profile] || 0) + 1;
        next.counters = counters;
        const item = {
          ...defaultItem(),
          id: newId(),
          objective: draft.title,
          time: draft.note,
          primaryLink: normalizeUrl(draft.link),
          postCaption: draft.legenda,
          observacao: draft.observacao || '',
          responsavel: draft.responsavel,
          contentType, pilar,
          profile,
          postDate: dateKey,
          recordingDate: '',
          completed: false,
          tabKey: 'postar',
          code: formatCode(profile, counters[profile])
        };
        next.weeks[weekKey].postar[dayId].push(item);
      }
      return next;
    });
  };

  const cronoDeletePost = (editing) => {
    if (!editing?.card) return;
    updatePlanner((prev) => {
      const next = { ...prev };
      const list = next.weeks[editing.weekKey]?.postar?.[editing.dayId];
      if (list) next.weeks[editing.weekKey].postar[editing.dayId] = list.filter(i => i.id !== editing.card.id);
      return next;
    });
  };

  // Marca / desmarca um post como já publicado (deixa o card verdinho).
  const cronoTogglePosted = (entry) => {
    updatePlanner((prev) => {
      const next = { ...prev, weeks: { ...prev.weeks } };
      const list = next.weeks[entry.weekKey]?.postar?.[entry.dayId];
      if (!list) return prev;
      const idx = list.findIndex(i => i.id === entry.item.id);
      if (idx < 0) return prev;
      const copy = [...list];
      copy[idx] = { ...copy[idx], completed: !copy[idx].completed };
      next.weeks[entry.weekKey] = { ...next.weeks[entry.weekKey], postar: { ...next.weeks[entry.weekKey].postar, [entry.dayId]: copy } };
      return next;
    });
  };

  // Reordena um post dentro do mesmo dia do cronograma (arrastar para
  // cima/baixo): remove da posição atual e insere antes ou depois do alvo.
  // Dois cards do mesmo dia visual podem viver em slots físicos diferentes
  // (postDate manda no cronograma, não a posição) — nesse caso o arrastado é
  // normalizado para o slot do alvo, herdando o postDate dele.
  const cronoReorderPost = (source, target, before) => {
    updatePlanner((prev) => {
      const srcList = prev.weeks[source.weekKey]?.postar?.[source.dayId];
      const tgtList = prev.weeks[target.weekKey]?.postar?.[target.dayId];
      if (!srcList || !tgtList) return prev;
      const from = srcList.findIndex(i => i.id === source.card.id);
      if (from < 0) return prev;

      const next = { ...prev, weeks: { ...prev.weeks } };
      const sameSlot = source.weekKey === target.weekKey && source.dayId === target.dayId;

      const srcCopy = [...srcList];
      const [moved] = srcCopy.splice(from, 1);
      const tgtCopy = sameSlot ? srcCopy : [...tgtList];
      let insertAt = tgtCopy.findIndex(i => i.id === target.card.id);
      if (insertAt < 0) return prev;
      if (!before) insertAt += 1;
      tgtCopy.splice(insertAt, 0, sameSlot ? moved : { ...moved, postDate: target.card.postDate || moved.postDate });

      next.weeks[source.weekKey] = { ...next.weeks[source.weekKey], postar: { ...next.weeks[source.weekKey].postar, [source.dayId]: sameSlot ? tgtCopy : srcCopy } };
      if (!sameSlot) {
        next.weeks[target.weekKey] = { ...next.weeks[target.weekKey], postar: { ...next.weeks[target.weekKey].postar, [target.dayId]: tgtCopy } };
      }
      return next;
    });
  };

  const cronoMovePost = (source, newDateKey) => {
    updatePlanner((prev) => {
      const next = { ...prev };
      const src = next.weeks[source.weekKey]?.postar?.[source.dayId];
      if (!src) return prev;
      const idx = src.findIndex(i => i.id === source.card.id);
      if (idx < 0) return prev;
      const [moved] = src.splice(idx, 1);
      moved.postDate = newDateKey;
      const { weekKey, dayId } = getWeekKeyAndDayId(newDateKey);
      if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
      next.weeks[weekKey].postar[dayId].push(moved);
      return next;
    });
  };

  // ── Responsáveis ──
  const addPerson = (name, photo) => updatePlanner((prev) => ({ ...prev, people: [...(prev.people || []), { id: newId(), name, photo }] }));
  const removePerson = (id) => updatePlanner((prev) => ({ ...prev, people: (prev.people || []).filter(p => p.id !== id) }));

  // ── Gavetas (grupos por imóvel) ──
  // editing item: { groupId, item? } | grupo: { group? }
  const gavetaSaveItem = (editing, draft) => updatePlanner((prev) => {
    const gavetas = (prev.gavetas || []).map(g => {
      if (g.id !== editing.groupId) return g;
      const item = { type: draft.type, title: draft.title, link: normalizeUrl(draft.link), linkLabel: draft.linkLabel, legenda: draft.legenda };
      if (editing.item) return { ...g, items: g.items.map(i => i.id === editing.item.id ? { ...i, ...item } : i) };
      return { ...g, items: [...g.items, { ...item, id: newId() }] };
    });
    return { ...prev, gavetas };
  });
  const gavetaDeleteItem = (editing) => updatePlanner((prev) => ({
    ...prev,
    gavetas: (prev.gavetas || []).map(g => g.id === editing.groupId ? { ...g, items: g.items.filter(i => i.id !== editing.item.id) } : g)
  }));
  const gavetaSaveGroup = (editing, draft) => updatePlanner((prev) => {
    if (editing?.group) return { ...prev, gavetas: (prev.gavetas || []).map(g => g.id === editing.group.id ? { ...g, name: draft.name, code: draft.code } : g) };
    return { ...prev, gavetas: [...(prev.gavetas || []), { id: newId(), name: draft.name, code: draft.code, items: [] }] };
  });
  const gavetaDeleteGroup = (editing) => updatePlanner((prev) => ({ ...prev, gavetas: (prev.gavetas || []).filter(g => g.id !== editing.group.id) }));

  // Agenda um material da gaveta num dia do cronograma: cria o post na etapa
  // "postar" com os mesmos campos que o cronograma usa (título, tipo, link,
  // legenda, horário, responsável) e remove o item da gaveta — numa única
  // atualização do planner, para o save ser atômico.
  // editing: { groupId, item } | draft: { dateKey, note, responsavel }
  const gavetaScheduleItem = (editing, draft) => {
    const { contentType, pilar } = typeLabelToFields(editing.item.type);
    updatePlanner((prev) => {
      const next = { ...prev, weeks: { ...prev.weeks } };

      const { weekKey, dayId } = getWeekKeyAndDayId(draft.dateKey);
      if (!next.weeks[weekKey]) next.weeks[weekKey] = emptyWeekData();
      const counters = { marco: 0, opa: 0, collab: 0, ...(prev.counters || {}) };
      const profile = 'opa';
      counters[profile] = (counters[profile] || 0) + 1;
      next.counters = counters;

      const post = {
        ...defaultItem(),
        id: newId(),
        objective: editing.item.title,
        time: draft.note || '',
        primaryLink: normalizeUrl(editing.item.link),
        postCaption: editing.item.legenda || '',
        responsavel: draft.responsavel || '',
        contentType, pilar,
        profile,
        postDate: draft.dateKey,
        recordingDate: '',
        completed: false,
        tabKey: 'postar',
        code: formatCode(profile, counters[profile])
      };
      next.weeks[weekKey].postar[dayId] = [...(next.weeks[weekKey].postar[dayId] || []), post];

      // Sai da gaveta: o material vira post e deixa de existir na prateleira.
      next.gavetas = (prev.gavetas || []).map(g =>
        g.id === editing.groupId ? { ...g, items: g.items.filter(i => i.id !== editing.item.id) } : g
      );

      return next;
    });
  };

  const renderCard = (item, dayId, itemWeekKey, opts = {}) => (
    <TaskCard
      key={item.id}
      item={item}
      dayId={dayId}
      itemWeekKey={itemWeekKey}
      activeTab={activeTab}
      captionCopiedId={captionCopiedId}
      firstCommentCopiedId={firstCommentCopiedId}
      brokersCopiedId={brokersCopiedId}
      reorderable={opts.reorderable === true}
      canMoveUp={opts.reorderable === true && opts.index > 0}
      canMoveDown={opts.reorderable === true && opts.index < opts.total - 1}
      onMoveUp={() => moveItem(itemWeekKey, dayId, item.id, 'up', opts.peerIds || [])}
      onMoveDown={() => moveItem(itemWeekKey, dayId, item.id, 'down', opts.peerIds || [])}
      onDragStart={handleDragStart}
      onToggleComplete={toggleComplete}
      onClick={openEdit}
      onSummaryClick={(it) => setSummaryModal({ isOpen: true, item: it })}
      onCopyCaption={handleCopyCaption}
      onCopyFirstComment={handleCopyFirstComment}
      onCopyBrokers={handleCopyBrokers}
      onRemove={removeItem}
    />
  );

  const renderPreviewCard = (item, sourceWeekKey) => (
    <PreviewCard
      key={`preview-${sourceWeekKey}-${item.id}`}
      item={item}
      sourceWeekKey={sourceWeekKey}
      onClick={(it, src) => openEdit('geral', it, src)}
    />
  );

  const renderSlimCard = (item, livesDayId, livesWeekKey, stageLabel) => (
    <SlimCard
      key={`slim-${livesWeekKey}-${livesDayId}-${item.id}`}
      item={item}
      livesDayId={livesDayId}
      livesWeekKey={livesWeekKey}
      stageLabel={stageLabel}
      onClick={(it, dId, wKey) => openEdit(dId, it, wKey)}
    />
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
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 p-6 md:p-10 selection:bg-blue-100">
      <div className={`${showPlanilha ? 'w-full' : 'max-w-7xl mx-auto'} pb-24 md:pb-32`}>
        <HeaderBar
          firebaseReady={firebaseReady}
          saving={saving}
          saveError={saveError}
          onLogout={handleLogout}
        />

        {showPlanilha && (
          <SectionBar
            showPlanilha={showPlanilha}
            weekRangeLabel={formatWeekRange(currentWeekKey)}
            onPrevWeek={() => changeWeek(-1)}
            onNextWeek={() => changeWeek(1)}
            onGoToCurrentWeek={goToCurrentWeek}
            onExportCsv={exportCsv}
            onImportClick={() => setIsBulkImporting(true)}
            onWipeAll={wipeAllContent}
            showFilters
            showEditorFilter
            profileFilter={profileFilter}
            onProfileChange={setProfileFilter}
            editorFilter={editorFilter}
            onEditorChange={setEditorFilter}
          />
        )}


        {showPlanilha ? (
          <Planilha
            items={getAllItems(planner, profileFilter, editorFilter, planilhaSearch)}
            search={planilhaSearch}
            onSearchChange={setPlanilhaSearch}
            onRowClick={(item) => openEdit(item._sourceDayId, item, item._sourceWeekKey, item._stage)}
            onAddClick={() => setIsAdding(true)}
            onAddAtDate={(date, dateField) => {
              const key = toDateKey(date);
              const base = defaultItem();
              if (dateField === 'recordingDate') {
                setNewItem({ ...base, recordingDate: key, postDate: '', initialStage: 'gravar' });
              } else {
                setNewItem({ ...base, postDate: key, recordingDate: '', initialStage: 'postar' });
              }
              setIsAdding(true);
            }}
            onDelete={deletePlanilhaItem}
            dayPilars={planner.dayPilars}
            onSetDayPilar={setDayPilar}
          />
        ) : (
        <motion.div className="space-y-8">
          {activeTab === 'editar' ? (
              <StageQueue title="Fila global de edição">
                  {allFilteredItems.length === 0 && editarSlimEchoes.length === 0 ? (
                      <QueueEmpty>Nenhum conteúdo para editar no momento</QueueEmpty>
                  ) : (
                      <div className="space-y-6">
                          {groupEditarByWeek(allFilteredItems).map((group) => {
                            const isThisWeek = group.weekKey === getWeekKey();
                            return (
                              <div key={group.weekKey} className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.5} />
                                    <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-600">
                                      Semana {formatWeekRange(group.weekKey)}
                                    </span>
                                  </div>
                                  {isThisWeek && (
                                    <span className="text-[9px] font-semibold tracking-wider uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                      Atual
                                    </span>
                                  )}
                                  {!group.hasDate && (
                                    <span className="text-[9px] font-semibold tracking-wider uppercase text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                      Sem data de postar
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold text-slate-300">
                                    {group.items.length} {group.items.length === 1 ? 'item' : 'itens'}
                                  </span>
                                  <div className="flex-1 h-px bg-slate-100" />
                                </div>
                                <div className="space-y-4">
                                  {group.items.map(item => renderCard(item, 'geral', item._sourceWeekKey))}
                                </div>
                              </div>
                            );
                          })}
                          {editarSlimEchoes.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-slate-100 space-y-1.5">
                              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2">Concluídos</p>
                              {editarSlimEchoes
                                .filter(e => (profileMatchesFilter(e.item.profile, effectiveProfileFilter)) && (editorFilter === 'todos' || (e.item.editor || 'allyson') === editorFilter))
                                .map(e => renderSlimCard(e.item, e.livesIn.dayId, e.livesIn.weekKey, e.stageLabel))}
                            </div>
                          )}
                      </div>
                  )}
              </StageQueue>
          ) : isGravarList ? (
              <StageQueue title="Fila de gravação">
                  <QueueTabs
                      value={gravarListFilter}
                      onChange={setGravarListFilter}
                      options={[
                          { value: 'pendentes',  label: `Pendentes (${allGravarGlobal.length})` },
                          { value: 'concluidos', label: `Concluídos (${allGravarConcluidosGlobal.length})` }
                      ]}
                  />
                  {gravarListFilter === 'pendentes' ? (
                      allGravarGlobal.length === 0 ? (
                          <QueueEmpty>Nenhum conteúdo para gravar</QueueEmpty>
                      ) : (
                          <div className="space-y-4">
                              {allGravarGlobal.map(item => renderCard(item, item._sourceDayId, item._sourceWeekKey))}
                          </div>
                      )
                  ) : (
                      allGravarConcluidosGlobal.length === 0 ? (
                          <QueueEmpty>Nenhuma gravação concluída ainda</QueueEmpty>
                      ) : (
                          <div className="space-y-1.5">
                              {allGravarConcluidosGlobal.map(e => renderSlimCard(e.item, e.livesIn.dayId, e.livesIn.weekKey, e.stageLabel))}
                          </div>
                      )
                  )}
              </StageQueue>
          ) : activeTab === 'cronograma' ? (
              <CronogramaView
                planner={planner}
                profileFilter={effectiveProfileFilter}
                onSavePost={cronoSavePost}
                onDeletePost={cronoDeletePost}
                onMovePost={cronoMovePost}
                onReorderPost={cronoReorderPost}
                onTogglePosted={cronoTogglePosted}
                onAddPerson={addPerson}
                onRemovePerson={removePerson}
              />
          ) : activeTab === 'gavetas' ? (
              <GavetasView
                planner={planner}
                onSaveGaveta={gavetaSaveItem}
                onDeleteGaveta={gavetaDeleteItem}
                onSaveGroup={gavetaSaveGroup}
                onDeleteGroup={gavetaDeleteGroup}
                onScheduleGaveta={gavetaScheduleItem}
              />
          ) : (
            (() => {
              const thisWeekKey = getWeekKey();
              const todayId = getTodayDayId();
              return daysOfWeek.map((day, dayIndex) => {
              const allDayItems = (currentWeekData[activeTab][day.id] || []).filter(item => !item.banco && profileMatchesFilter(item.profile, effectiveProfileFilter));
              const filteredDayItems = activeTab === 'postar' ? allDayItems.filter(item => !item.completed) : allDayItems;
              const completedPostarItems = activeTab === 'postar' ? allDayItems.filter(item => item.completed) : [];
              const dayEchoes = activeTab === 'gravar' ? (gravarSlimEchoes[day.id] || []).filter(e => profileMatchesFilter(e.item.profile, effectiveProfileFilter)) : [];
              const dayPreviews = activeTab === 'postar'
                ? (editarPreviewsByDay[day.id] || []).filter(p =>
                    (effectiveProfileFilter === 'todos' || (p.item.profile || 'opa') === effectiveProfileFilter) &&
                    (editorFilter === 'todos' || (p.item.editor || 'allyson') === editorFilter)
                  )
                : [];

              const isToday = currentWeekKey === thisWeekKey && day.id === todayId;
              const isExpanded = expandedDay === day.id;
              const isEmpty =
                filteredDayItems.length === 0 &&
                completedPostarItems.length === 0 &&
                dayEchoes.length === 0 &&
                dayPreviews.length === 0;
              const dateLabel = formatDateShort(addDays(parseWeekKey(currentWeekKey), dayIndex));
              const previewItems = filteredDayItems.slice(0, 2);
              const moreCount = filteredDayItems.length - previewItems.length;
              const isDropTarget = draggedItem && draggedItem.dayId !== day.id;

              if (isEmpty && !isExpanded && !isToday) {
                const dayPilarPills = ['marco', 'opa']
                  .filter(p => effectiveProfileFilter === 'todos' || effectiveProfileFilter === p)
                  .map(p => ({ profile: p, pilar: planner.dayPilars?.[p]?.[day.id] || '' }))
                  .filter(x => x.pilar);
                return (
                  <div
                    key={day.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day.id)}
                    className={`relative ${isDropTarget ? 'border-dashed border-2 border-blue-300 bg-blue-50/30' : 'border border-slate-100 bg-white/70 hover:bg-white hover:border-slate-200'} ${radius.card} transition-colors`}
                  >
                    <button
                      onClick={() => toggleDay(day.id)}
                      className="w-full flex items-center gap-4 px-5 py-3 text-left outline-none"
                    >
                      <span className={`w-2 h-2 rounded-full ${day.color} flex-shrink-0`} />
                      <span className="text-sm font-semibold text-slate-700 flex-shrink-0">{day.label}</span>
                      <span className={`${text.microMeta} text-slate-400`}>{dateLabel}</span>
                      {dayPilarPills.length > 0 && (
                        <span className="flex items-center gap-1.5 flex-shrink min-w-0">
                          {dayPilarPills.map(({ profile, pilar }) => (
                            <span
                              key={profile}
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase leading-none ${getPilarBadgeClass(pilar)}`}
                              title={`${getProfileTag(profile)} — pilar do dia: ${getPilarLabel(pilar)}`}
                            >
                              {getPilarLabel(pilar)}
                            </span>
                          ))}
                        </span>
                      )}
                      <span className="flex-1" />
                      <span className={`${text.microMeta} text-slate-300`}>Vazio</span>
                      <ChevronDown className="w-4 h-4 text-slate-300" strokeWidth={3} />
                    </button>
                  </div>
                );
              }

              return (
              <div
                key={day.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day.id)}
                className={`group relative bg-white ${radius.big} transition-shadow duration-500 ${isToday ? 'border-2 border-emerald-300 ring-4 ring-emerald-100' : 'border border-slate-100'} ${isExpanded && !isToday ? 'shadow-2xl ring-4 ring-blue-50' : isExpanded ? 'shadow-2xl' : 'shadow-sm hover:shadow-xl hover:border-slate-200'} ${isDropTarget ? 'border-dashed border-2 border-blue-300' : ''}`}
              >
                <div className="absolute -top-3 left-8 z-10 flex items-center gap-2">
                  <span className={`${day.color} text-white ${text.meta} px-4 py-1.5 rounded-full shadow-md`}>
                    {day.id.substring(0, 3)}
                  </span>
                  {isToday && (
                    <span className={`inline-flex items-center gap-1.5 bg-emerald-500 text-white ${text.microMeta} px-3 py-1 rounded-full shadow-sm`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Hoje
                    </span>
                  )}
                </div>

                <button onClick={() => toggleDay(day.id)} className="w-full flex items-start justify-between p-5 md:p-6 text-left outline-none">
                  <div className="flex flex-col min-w-0 flex-1">
                    <h2 className={`${text.h2} text-slate-900`}>{day.label}</h2>
                    <p className={`${text.microMeta} text-slate-400 mt-1.5`}>
                      {dateLabel} · {filteredDayItems.length} {filteredDayItems.length === 1 ? 'conteúdo' : 'conteúdos'}
                      {dayPreviews.length > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-600 normal-case">
                          <Scissors className="w-2.5 h-2.5" />
                          +{dayPreviews.length} em edição
                        </span>
                      )}
                    </p>
                    {!isExpanded && previewItems.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {previewItems.map(it => (
                          <li key={it.id} className="flex items-center gap-2 text-sm text-slate-500 font-normal truncate">
                            <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                            <span className="truncate">{it.objective}</span>
                          </li>
                        ))}
                        {moreCount > 0 && (
                          <li className={`${text.microMeta} text-slate-400 ml-3`}>
                            +{moreCount} mais
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                    <ChevronDown className="w-5 h-5" strokeWidth={3} />
                  </div>
                </button>

                <div className="px-5 md:px-6 pb-3 -mt-2">
                  <DayPilarPicker
                    dayId={day.id}
                    dayPilars={planner.dayPilars}
                    onChange={setDayPilar}
                    profileFilter={effectiveProfileFilter}
                  />
                </div>

                <AnimatePresence>
                  {expandedDay === day.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 md:px-6 pb-6 border-t border-slate-50">
                        <div className="space-y-3 mt-5">
                          {filteredDayItems.length === 0 && completedPostarItems.length === 0 && dayEchoes.length === 0 && dayPreviews.length === 0 && (
                            <div className={emptyState}>
                              Sem planos para hoje
                            </div>
                          )}

                          {(() => {
                            const isStoryish = (it) => it.contentType === 'stories' || it.contentType === 'repost_stories';
                            const videos = filteredDayItems.filter(item => !isStoryish(item));
                            const storiesAoVivo = filteredDayItems.filter(item => isStoryish(item) && (item.contentType === 'repost_stories' || (item.storyMode || 'aovivo') === 'aovivo'));
                            const storiesBanco = filteredDayItems.filter(item => item.contentType === 'stories' && item.storyMode === 'banco');
                            return (
                              <>
                                {videos.length > 0 && (
                                  <div className="mb-6">
                                    <h4 className={`${text.microMeta} text-slate-400 mb-3 ml-2`}>Vídeos</h4>
                                    <div className="space-y-3">
                                      {(() => { const peerIds = videos.map(v => v.id); return videos.map((item, idx) => renderCard(item, day.id, currentWeekKey, { reorderable: activeTab === 'postar', index: idx, total: videos.length, peerIds })); })()}
                                    </div>
                                  </div>
                                )}
                                {storiesAoVivo.length > 0 && activeTab === 'gravar' && (
                                  <div className="mb-6 -mx-2 px-3 py-3 rounded-2xl bg-rose-50/60 border border-rose-200">
                                    <div className="flex items-center gap-2 mb-3 ml-1">
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] animate-pulse">●</span>
                                      <h4 className="text-sm font-semibold text-rose-700">Stories ao vivo</h4>
                                      <span className={`${text.microMeta} text-rose-500/80`}>postar agora</span>
                                    </div>
                                    <div className="space-y-3">
                                      {storiesAoVivo.map((item) => renderCard(item, day.id, currentWeekKey))}
                                    </div>
                                  </div>
                                )}
                                {storiesBanco.length > 0 && activeTab === 'gravar' && (
                                  <div className="mb-6 -mx-2 px-3 py-3 rounded-2xl bg-violet-50/60 border border-violet-200">
                                    <div className="flex items-center gap-2 mb-3 ml-1">
                                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-500 text-white text-[11px]">📦</span>
                                      <h4 className="text-sm font-semibold text-violet-700">Stories — banco</h4>
                                      <span className={`${text.microMeta} text-violet-500/80`}>guardar para depois</span>
                                    </div>
                                    <div className="space-y-3">
                                      {storiesBanco.map((item) => renderCard(item, day.id, currentWeekKey))}
                                    </div>
                                  </div>
                                )}
                                {(storiesAoVivo.length > 0 || storiesBanco.length > 0) && activeTab !== 'gravar' && (
                                  <div className="mb-6">
                                    <h4 className={`${text.microMeta} text-slate-400 mb-3 ml-2`}>Stories</h4>
                                    <div className="space-y-3">
                                      {(() => { const all = [...storiesAoVivo, ...storiesBanco]; const peerIds = all.map(v => v.id); return all.map((item, idx) => renderCard(item, day.id, currentWeekKey, { reorderable: activeTab === 'postar', index: idx, total: all.length, peerIds })); })()}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}

                          {dayPreviews.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-dashed border-amber-200 space-y-3">
                              <div className="flex items-center gap-2 ml-1">
                                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                                <h4 className={`${text.microMeta} text-amber-700`}>Chegando do editor ({dayPreviews.length})</h4>
                                <span className="text-xs text-amber-500/80 italic font-normal normal-case">prévia — só liberado após editar</span>
                              </div>
                              <div className="space-y-3 pt-2">
                                {dayPreviews.map(p => renderPreviewCard(p.item, p.sourceWeekKey))}
                              </div>
                            </div>
                          )}

                          {(dayEchoes.length > 0 || completedPostarItems.length > 0) && (
                            <div className="pt-3 mt-3 border-t border-slate-100 space-y-1.5">
                              <h4 className={`${text.microMeta} text-slate-400 mb-2 ml-1`}>Concluídos</h4>
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
            });
            })()
          )}
        </motion.div>
        )}

        <PageFooter
          totalCount={allFilteredItems.length}
          completedCount={allFilteredItems.filter((item) => item.completed).length}
        />
      </div>

      <MobileBottomNav
        activeView={showPlanilha ? 'planilha' : activeTab}
        onChangeView={selectView}
      />

      <FloatingDesktopNav
        activeView={showPlanilha ? 'planilha' : activeTab}
        onChangeView={selectView}
      />

      <AddItemModal isAdding={isAdding} setIsAdding={setIsAdding} newItem={newItem} setNewItem={setNewItem} addItem={addItem} repostablePosts={getRepostablePosts(planner)} />

      <BulkImportModal
        open={isBulkImporting}
        onClose={() => setIsBulkImporting(false)}
        onImport={importItems}
      />

      <SummaryModal
        summaryModal={summaryModal}
        onClose={() => setSummaryModal({ isOpen: false, item: null })}
        handleCopy={handleCopy}
        copiedState={copiedState}
      />

      <EditItemModal editModal={editModal} setEditModal={setEditModal} activeTab={editModal.sourceStage || editModal.item?.tabKey || 'postar'} handleSaveEdit={handleSaveEdit} repostablePosts={getRepostablePosts(planner)} />
    </div>
  );
};

export default App;
