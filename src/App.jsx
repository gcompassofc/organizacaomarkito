import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogOut,
  Plus,
  Table2,
  Video,
  Scissors,
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
  profileMatchesFilter
} from './lib/tags';
import LoginScreen from './components/LoginScreen';
import SummaryModal from './components/SummaryModal';
import AddItemModal from './components/AddItemModal';
import EditItemModal from './components/EditItemModal';
import { TaskCard, PreviewCard, SlimCard } from './components/TaskCard';
import { FilterBar } from './components/FilterBar';
import { Planilha } from './components/Planilha';
import { ExportMenu } from './components/ExportMenu';
import { radius, emptyState } from './lib/ui';
import {
  emptyWeekData,
  newId,
  defaultItem,
  createPlanner,
  normalizeUrl,
  normalizePlanner,
  stripHtml
} from './lib/planner';
import {
  getEditarQueue,
  getGravarQueue,
  getGravarConcluidos,
  getGravarSlimEchoes,
  getEditarSlimEchoes,
  getEditarPreviewsByDay,
  getAllItems
} from './lib/selectors';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('gravar');
  const [planner, setPlanner] = useState(() => createPlanner());
  const [expandedDay, setExpandedDay] = useState(() => getTodayDayId());
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState(() => defaultItem());
  const [draggedItem, setDraggedItem] = useState(null);
  const [summaryModal, setSummaryModal] = useState({ isOpen: false, item: null });
  const [editModal, setEditModal] = useState({ isOpen: false, dayId: null, item: null, itemWeekKey: null, sourceStage: null });
  const [copiedState, setCopiedState] = useState(false);
  const [captionCopiedId, setCaptionCopiedId] = useState(null);
  const [firstCommentCopiedId, setFirstCommentCopiedId] = useState(null);
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
    Object.values(tabData).flat().filter(item => profileMatchesFilter(item.profile, effectiveProfileFilter));

  const allFilteredItems = activeTab === 'editar'
    ? allEditarItemsGlobal
    : isGravarList
      ? allGravarGlobal
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
      const next = { ...prev };
      const { dayId: oldDayId, itemWeekKey: oldWeekKey, item: newProps } = editModal;
      const sourceStage = editModal.sourceStage || activeTab;

      if (sourceStage === 'editar') {
         next.weeks[oldWeekKey].editar.geral = next.weeks[oldWeekKey].editar.geral.filter(i => i.id !== newProps.id);
      } else {
         next.weeks[oldWeekKey][sourceStage][oldDayId] = next.weeks[oldWeekKey][sourceStage][oldDayId].filter(i => i.id !== newProps.id);
      }
      
      const item = {
         ...newProps,
         primaryLink: normalizeUrl(newProps.primaryLink),
         secondaryLink: normalizeUrl(newProps.secondaryLink),
         editedVideoLink: normalizeUrl(newProps.editedVideoLink)
      };
      
      const targetTab = item.tabKey || sourceStage;
      
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

  const addItem = () => {
    if (!newItem.objective.trim()) return;

    const isEstatico = newItem.contentType === 'estatico' || newItem.contentType === 'carrossel';
    const stage = newItem.initialStage || (isEstatico ? 'editar' : 'gravar');

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
      recordingDate: newItem.recordingDate,
      postDate: newItem.postDate,
      contentType: newItem.contentType,
      recordingType: newItem.recordingType,
      profile: newItem.profile,
      pilar: newItem.pilar || '',
      storyMode: newItem.storyMode || 'aovivo',
      time: newItem.time,
      completed: false,
      tabKey: stage
    };

    updatePlanner((prev) => {
      const next = { ...prev };

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

  const renderCard = (item, dayId, itemWeekKey, opts = {}) => (
    <TaskCard
      key={item.id}
      item={item}
      dayId={dayId}
      itemWeekKey={itemWeekKey}
      activeTab={activeTab}
      captionCopiedId={captionCopiedId}
      firstCommentCopiedId={firstCommentCopiedId}
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
      onClick={openEdit}
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
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 p-6 md:p-12 selection:bg-blue-100">
      <div className={`${showPlanilha ? 'w-full' : 'max-w-4xl mx-auto'} pb-24 md:pb-32`}>
        <header className="flex items-center justify-between mb-8 pt-2">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900">
            Meu <span className="text-blue-600">Plano</span>
          </h1>
          <div className="flex items-center gap-3 text-slate-300">
            {firebaseReady && (
              <span
                className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${saveError ? 'text-rose-600' : 'text-slate-400'}`}
                title={saveError ? 'Falha ao salvar — alterações podem estar fora de sincronia' : (saving ? 'Salvando' : 'Sincronizado')}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${saveError ? 'bg-rose-500 animate-pulse' : saving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                {saveError ? 'Erro' : saving ? 'Salvando' : 'Sync'}
              </span>
            )}
            <button onClick={handleLogout} className="p-1.5 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors" title="Sair">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <section className="mb-10 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            {showPlanilha ? (
              <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 whitespace-nowrap">
                <span className="text-blue-600">Controle</span> — todas postagens
              </h2>
            ) : (
              <>
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-900 whitespace-nowrap">
                  Semana <span className="text-blue-600">{formatWeekRange(currentWeekKey)}</span>
                </h2>
                <div className="flex items-center text-slate-300">
                  <button onClick={() => changeWeek(-1)} className="p-1 hover:text-slate-700" title="Semana anterior">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={goToCurrentWeek} className="px-2 text-[10px] font-black uppercase text-slate-400 hover:text-blue-600">
                    Hoje
                  </button>
                  <button onClick={() => changeWeek(1)} className="p-1 hover:text-slate-700" title="Próxima semana">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ExportMenu onExport={exportCsv} onWipe={wipeAllContent} />
            <button
              onClick={() => setShowPlanilha(s => !s)}
              className={`h-9 px-4 flex items-center gap-1.5 rounded-full font-black text-[10px] uppercase transition-colors ${showPlanilha ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-blue-600 text-white'}`}
              title={showPlanilha ? 'Voltar pra visualização' : 'Abrir planilha de controle'}
            >
              {showPlanilha ? <X className="w-3.5 h-3.5" /> : <Table2 className="w-3.5 h-3.5" />}
              {showPlanilha ? 'Voltar' : 'Planilha'}
            </button>
          </div>
        </section>

        <FilterBar
          visible={showPlanilha || activeTab !== 'gravar'}
          showEditor={showPlanilha || activeTab === 'editar'}
          profileFilter={profileFilter}
          onProfileChange={setProfileFilter}
          editorFilter={editorFilter}
          onEditorChange={setEditorFilter}
        />


        {showPlanilha ? (
          <Planilha
            items={getAllItems(planner, profileFilter, editorFilter, planilhaSearch)}
            search={planilhaSearch}
            onSearchChange={setPlanilhaSearch}
            onRowClick={(item) => openEdit(item._sourceDayId, item, item._sourceWeekKey, item._stage)}
            onAddClick={() => setIsAdding(true)}
          />
        ) : (
        <motion.div className="space-y-8">
          {activeTab === 'editar' ? (
              <div className={`bg-white border border-slate-100 ${radius.big} p-5 md:p-8 shadow-sm`}>
                  <h2 className="text-2xl font-black text-slate-800 uppercase mb-6 text-center">Fila Global de Edição</h2>
                  {allFilteredItems.length === 0 && editarSlimEchoes.length === 0 ? (
                      <div className={emptyState}>
                          Nenhum conteúdo para editar no momento
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {allFilteredItems.map(item => renderCard(item, 'geral', item._sourceWeekKey))}
                          {editarSlimEchoes.length > 0 && (
                            <div className="pt-4 mt-4 border-t border-slate-100 space-y-1.5">
                              <p className="text-[9px] font-black text-slate-300 uppercase mb-2">Concluídos</p>
                              {editarSlimEchoes
                                .filter(e => (profileMatchesFilter(e.item.profile, effectiveProfileFilter)) && (editorFilter === 'todos' || (e.item.editor || 'allyson') === editorFilter))
                                .map(e => renderSlimCard(e.item, e.livesIn.dayId, e.livesIn.weekKey, e.stageLabel))}
                            </div>
                          )}
                      </div>
                  )}
              </div>
          ) : isGravarList ? (
              <div className={`bg-white border border-slate-100 ${radius.big} p-5 md:p-8 shadow-sm`}>
                  <h2 className="text-2xl font-black text-slate-800 uppercase mb-6 text-center">Fila de Gravação</h2>
                  <div className="flex items-center justify-center mb-6">
                      <div className="inline-flex items-center bg-slate-50 rounded-full p-1 text-[10px] font-black uppercase">
                          <button
                              onClick={() => setGravarListFilter('pendentes')}
                              className={`px-3 py-1.5 rounded-full transition-colors ${gravarListFilter === 'pendentes' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                              Pendentes ({allGravarGlobal.length})
                          </button>
                          <button
                              onClick={() => setGravarListFilter('concluidos')}
                              className={`px-3 py-1.5 rounded-full transition-colors ${gravarListFilter === 'concluidos' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                          >
                              Concluídos ({allGravarConcluidosGlobal.length})
                          </button>
                      </div>
                  </div>
                  {gravarListFilter === 'pendentes' ? (
                      allGravarGlobal.length === 0 ? (
                          <div className={emptyState}>
                              Nenhum conteúdo para gravar
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {allGravarGlobal.map(item => renderCard(item, item._sourceDayId, item._sourceWeekKey))}
                          </div>
                      )
                  ) : (
                      allGravarConcluidosGlobal.length === 0 ? (
                          <div className={emptyState}>
                              Nenhuma gravação concluída ainda
                          </div>
                      ) : (
                          <div className="space-y-1.5">
                              {allGravarConcluidosGlobal.map(e => renderSlimCard(e.item, e.livesIn.dayId, e.livesIn.weekKey, e.stageLabel))}
                          </div>
                      )
                  )}
              </div>
          ) : (
            (() => {
              const thisWeekKey = getWeekKey();
              const todayId = getTodayDayId();
              return daysOfWeek.map((day, dayIndex) => {
              const allDayItems = (currentWeekData[activeTab][day.id] || []).filter(item => profileMatchesFilter(item.profile, effectiveProfileFilter));
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
                      <span className="text-sm font-black text-slate-500 uppercase tracking-wide flex-shrink-0">{day.label}</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase">{dateLabel}</span>
                      <span className="flex-1" />
                      <span className="text-[10px] font-black text-slate-300 uppercase">Vazio</span>
                      <ChevronDown className="w-4 h-4 text-slate-200" strokeWidth={3} />
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
                  <span className={`${day.color} text-white text-[11px] font-black px-5 py-1.5 rounded-full uppercase shadow-lg`}>
                    {day.id.substring(0, 3)}
                  </span>
                  {isToday && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Hoje
                    </span>
                  )}
                </div>

                <button onClick={() => toggleDay(day.id)} className="w-full flex items-start justify-between p-5 md:p-6 text-left outline-none">
                  <div className="flex flex-col min-w-0 flex-1">
                    <h2 className="text-2xl font-black text-slate-800 uppercase">{day.label}</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1">
                      {dateLabel} - {filteredDayItems.length} {filteredDayItems.length === 1 ? 'Conteudo' : 'Conteudos'}
                      {dayPreviews.length > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                          <Scissors className="w-2.5 h-2.5" />
                          +{dayPreviews.length} em edição
                        </span>
                      )}
                    </p>
                    {!isExpanded && previewItems.length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {previewItems.map(it => (
                          <li key={it.id} className="flex items-center gap-2 text-xs text-slate-500 font-medium truncate">
                            <span className="w-1 h-1 rounded-full bg-slate-300 flex-shrink-0" />
                            <span className="truncate">{it.objective}</span>
                          </li>
                        ))}
                        {moreCount > 0 && (
                          <li className="text-[10px] font-black text-slate-300 uppercase ml-3">
                            +{moreCount} mais
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-50 text-slate-300 group-hover:bg-slate-100'}`}>
                    <ChevronDown className="w-5 h-5" strokeWidth={3} />
                  </div>
                </button>

                <AnimatePresence>
                  {expandedDay === day.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 md:px-6 pb-6 border-t border-slate-50">
                        <div className="space-y-3 mt-5">
                          {filteredDayItems.length === 0 && completedPostarItems.length === 0 && dayEchoes.length === 0 && dayPreviews.length === 0 && (
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
                                      {(() => { const peerIds = videos.map(v => v.id); return videos.map((item, idx) => renderCard(item, day.id, currentWeekKey, { reorderable: activeTab === 'postar', index: idx, total: videos.length, peerIds })); })()}
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
                                <h4 className="text-[10px] font-black text-amber-700 uppercase">Chegando do editor ({dayPreviews.length})</h4>
                                <span className="text-[9px] font-bold text-amber-500/80 normal-case">prévia — só liberado após editar</span>
                              </div>
                              <div className="space-y-3 pt-2">
                                {dayPreviews.map(p => renderPreviewCard(p.item, p.sourceWeekKey))}
                              </div>
                            </div>
                          )}

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
            });
            })()
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
          <button onClick={() => { setActiveTab('gravar'); setShowPlanilha(false); }} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'gravar' && !showPlanilha ? 'text-blue-600' : 'text-slate-400'}`}>
            <Video className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Gravar</span>
          </button>
          <button onClick={() => { setActiveTab('editar'); setShowPlanilha(false); }} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'editar' && !showPlanilha ? 'text-amber-600' : 'text-slate-400'}`}>
            <Scissors className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Editar</span>
          </button>
          <button onClick={() => { setActiveTab('postar'); setShowPlanilha(false); }} className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'postar' && !showPlanilha ? 'text-emerald-600' : 'text-slate-400'}`}>
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase">Postar</span>
          </button>
        </div>
      </nav>

      <nav className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-white/95 backdrop-blur border border-slate-100 shadow-xl shadow-slate-900/10 rounded-full px-2 py-2 flex items-center relative">
          <motion.div
            className="absolute top-2 bottom-2 rounded-full"
            initial={false}
            animate={{
              left: activeTab === 'gravar' ? '8px' : activeTab === 'editar' ? '124px' : '240px',
              width: '112px',
              backgroundColor: activeTab === 'gravar' ? '#2563eb' : activeTab === 'editar' ? '#f59e0b' : '#059669'
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
          {[
            { id: 'gravar', label: 'Gravar', Icon: Video },
            { id: 'editar', label: 'Editar', Icon: Scissors },
            { id: 'postar', label: 'Postar', Icon: Calendar }
          ].map(t => {
            const active = activeTab === t.id;
            const Icon = t.Icon;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTab(t.id); setShowPlanilha(false); }}
                className="relative w-28 h-10 flex items-center justify-center gap-2 text-xs font-black uppercase"
              >
                <motion.span animate={{ color: active ? '#ffffff' : '#94a3b8' }} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {t.label}
                </motion.span>
              </button>
            );
          })}
        </div>
      </nav>

      <AddItemModal isAdding={isAdding} setIsAdding={setIsAdding} newItem={newItem} setNewItem={setNewItem} addItem={addItem} />

      <SummaryModal
        summaryModal={summaryModal}
        onClose={() => setSummaryModal({ isOpen: false, item: null })}
        handleCopy={handleCopy}
        copiedState={copiedState}
      />

      <EditItemModal editModal={editModal} setEditModal={setEditModal} activeTab={editModal.sourceStage || activeTab} handleSaveEdit={handleSaveEdit} />
    </div>
  );
};

export default App;
