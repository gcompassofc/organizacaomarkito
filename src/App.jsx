import React, { useEffect, useRef, useState } from 'react';
import {
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
  getWeekKeyAndDayId
} from './lib/dates';
import {
  tabConfig,
  getRecordingTag,
  getContentTypeTag,
  getContentTypeBadgeClass,
  getProfileTag,
  getProfileBadgeClass,
  profileMatchesFilter
} from './lib/tags';
import LoginScreen from './components/LoginScreen';
import SummaryModal from './components/SummaryModal';
import AddItemModal from './components/AddItemModal';
import EditItemModal from './components/EditItemModal';
import MonthView from './components/MonthView';
import KanbanView from './components/KanbanView';
import {
  emptyTabData,
  emptyWeekData,
  newId,
  defaultItem,
  createPlanner,
  normalizeUrl,
  normalizePlanner,
  stripHtml
} from './lib/planner';

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
  const [firstCommentCopiedId, setFirstCommentCopiedId] = useState(null);

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
  useEffect(() => { try { localStorage.setItem('editorFilter', editorFilter); } catch {} }, [editorFilter]);
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

  // Fila global de gravação (todas as semanas, em sequência) — respeita filtro de perfil
  const allGravarGlobal = Object.entries(planner.weeks).flatMap(([weekKey, weekData]) => {
    return daysOfWeek.flatMap(d => {
      return (weekData.gravar?.[d.id] || [])
        .filter(item => profileMatchesFilter(item.profile, profileFilter))
        .map(item => ({ ...item, _sourceWeekKey: weekKey, _sourceDayId: d.id }));
    });
  });

  allGravarGlobal.sort((a, b) => {
    const dateA = a.recordingDate
      ? new Date(a.recordingDate + 'T12:00:00')
      : new Date(a._sourceWeekKey + 'T12:00:00');
    const dateB = b.recordingDate
      ? new Date(b.recordingDate + 'T12:00:00')
      : new Date(b._sourceWeekKey + 'T12:00:00');
    return dateA - dateB;
  });

  const getFilteredGravarPostar = (tabData) => {
    return Object.values(tabData).flat().filter(item => profileMatchesFilter(item.profile, profileFilter));
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

  const editarPreviewsByDay = {};
  daysOfWeek.forEach(d => { editarPreviewsByDay[d.id] = []; });
  const currentWeekDayKeys = daysOfWeek.map((_, idx) => toDateKey(addDays(parseWeekKey(currentWeekKey), idx)));
  Object.entries(planner.weeks).forEach(([weekKey, weekData]) => {
    (weekData.editar?.geral || []).forEach(item => {
      if (!item.postDate) return;
      const idx = currentWeekDayKeys.indexOf(item.postDate);
      if (idx >= 0) {
        editarPreviewsByDay[daysOfWeek[idx].id].push({ item, sourceWeekKey: weekKey });
      }
    });
  });
  
  const isGravarList = activeTab === 'gravar';

  const allFilteredItems = activeTab === 'editar'
      ? allEditarItemsGlobal.filter(item =>
          (profileMatchesFilter(item.profile, profileFilter)) &&
          (editorFilter === 'todos' || (item.editor || 'allyson') === editorFilter)
        )
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
    } catch (saveError) {
      console.error('Save error:', saveError);
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
        draggable={activeTab !== 'editar' && !isGravarList}
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
        {activeTab !== 'editar' && !isGravarList && (
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
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase ${getContentTypeBadgeClass(item.contentType, activeTab === 'gravar' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')}`}>
                {getContentTypeTag(item.contentType)}
                </span>
            )}
            {activeTab === 'gravar' && item.recordingType && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase ${item.recordingType === 'sozinho' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                {getRecordingTag(item.recordingType)}
                </span>
            )}
            {item.profile && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase ${getProfileBadgeClass(item.profile)}`}>
                {getProfileTag(item.profile)}
                </span>
            )}
            {activeTab === 'editar' && item.editor && (
                item.editor === 'torres' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-violet-600 text-white shadow-sm ring-1 ring-violet-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    Torres • Externo
                  </span>
                ) : (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 text-amber-700`}>
                  Editor: {item.editor}
                  </span>
                )
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
            {activeTab === 'postar' && item.firstComment && (
            <div className="mt-2 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-black text-indigo-500 uppercase">Primeiro comentário</p>
                    <button
                        onClick={(e) => handleCopyFirstComment(e, item)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${firstCommentCopiedId === item.id ? 'bg-emerald-500 text-white' : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'}`}
                    >
                        {firstCommentCopiedId === item.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{firstCommentCopiedId === item.id ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                </div>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{item.firstComment}</p>
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
    if (!profileMatchesFilter(item.profile, profileFilter)) return false;
    if (editorFilter !== 'todos' && (item.editor || 'allyson') !== editorFilter) return false;
    return true;
  };


  const renderPreviewCard = (item, sourceWeekKey) => (
    <motion.div
      layout
      key={`preview-${sourceWeekKey}-${item.id}`}
      onClick={() => setEditModal({ isOpen: true, dayId: 'geral', item: { ...item }, itemWeekKey: sourceWeekKey })}
      className="relative flex items-start md:items-center justify-between p-3 md:p-4 rounded-[18px] border-2 border-dashed border-amber-300 bg-amber-50/30 hover:bg-amber-50/60 cursor-pointer opacity-90"
      title="Ainda em edição — vai aparecer aqui quando for marcado como editado"
    >
      <div className="absolute -top-2.5 left-5 inline-flex items-center gap-1.5 bg-amber-500 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase shadow-sm">
        <Scissors className="w-2.5 h-2.5" />
        Ainda em edição
      </div>
      <div className="flex items-start md:items-center space-x-3 flex-1 min-w-0 mt-1">
        <div className="flex-1 min-w-0">
          <p className="text-sm md:text-base leading-snug font-bold text-slate-600 italic">
            {item.objective}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {item.contentType && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase ${getContentTypeBadgeClass(item.contentType, 'bg-amber-100 text-amber-700')}`}>
                {getContentTypeTag(item.contentType)}
              </span>
            )}
            {item.editor && (
              item.editor === 'torres' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase bg-violet-600 text-white">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Torres • Externo
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-500">
                  Editor: {item.editor}
                </span>
              )
            )}
            {item.time && (
              <span className="flex items-center text-[10px] font-black uppercase text-slate-400">
                <Clock className="w-3 h-3 mr-1" />
                {item.time}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

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
              <button
                onClick={() => {
                  const next = !panoramaMode;
                  setPanoramaMode(next);
                  try { localStorage.setItem('panoramaMode', String(next)); } catch {}
                  if (!next) setViewMode('semanal');
                }}
                className={`h-11 px-4 flex items-center gap-2 rounded-2xl font-black text-[10px] uppercase transition-all ${panoramaMode ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'}`}
                title="Alternar modo Panorama (visão mensal e kanban)"
              >
                <LayoutGrid className="w-4 h-4" />
                Panorama
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
              {['todos', 'allyson', 'kallyl', 'natalia', 'torres'].map(ed => {
                const isTorres = ed === 'torres';
                const activeCls = isTorres ? 'bg-violet-600 text-white shadow-md' : 'bg-amber-500 text-white shadow-md';
                const idleCls = isTorres ? 'text-violet-600 hover:bg-violet-50' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600';
                return (
                  <button
                    key={ed}
                    onClick={() => setEditorFilter(ed)}
                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${editorFilter === ed ? activeCls : idleCls}`}
                  >
                    {ed === 'todos' ? 'Todos Editores' : isTorres ? 'Torres • Ext' : ed}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {panoramaMode && viewMode === 'mes' && (
          <MonthView
            planner={planner}
            panoramaMonth={panoramaMonth}
            setPanoramaMonth={setPanoramaMonth}
            calendarDateField={calendarDateField}
            setCalendarDateField={setCalendarDateField}
            matchesPanoramaFilters={matchesPanoramaFilters}
            todayKey={todayKey}
            openItemFromPanorama={openItemFromPanorama}
          />
        )}
        {panoramaMode && viewMode === 'kanban' && (
          <KanbanView
            planner={planner}
            currentWeekKey={currentWeekKey}
            matchesPanoramaFilters={matchesPanoramaFilters}
            todayKey={todayKey}
            openItemFromPanorama={openItemFromPanorama}
          />
        )}

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
                                .filter(e => (profileMatchesFilter(e.item.profile, profileFilter)) && (editorFilter === 'todos' || (e.item.editor || 'allyson') === editorFilter))
                                .map(e => renderSlimCard(e.item, e.livesIn.dayId, e.livesIn.weekKey, e.stageLabel))}
                            </div>
                          )}
                      </div>
                  )}
              </div>
          ) : isGravarList ? (
              <div className="bg-white border border-slate-100 rounded-[32px] p-5 md:p-8 shadow-sm">
                  <h2 className="text-2xl font-black text-slate-800 uppercase mb-6 text-center">Fila de Gravação</h2>
                  {allGravarGlobal.length === 0 ? (
                      <div className="text-center py-12 text-slate-300 font-black uppercase bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 text-sm">
                          Nenhum conteúdo para gravar
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {allGravarGlobal.map(item => renderCard(item, item._sourceDayId, item._sourceWeekKey))}
                      </div>
                  )}
              </div>
          ) : (
            daysOfWeek.map((day, dayIndex) => {
              const allDayItems = (currentWeekData[activeTab][day.id] || []).filter(item => profileMatchesFilter(item.profile, profileFilter));
              const filteredDayItems = activeTab === 'postar' ? allDayItems.filter(item => !item.completed) : allDayItems;
              const completedPostarItems = activeTab === 'postar' ? allDayItems.filter(item => item.completed) : [];
              const dayEchoes = activeTab === 'gravar' ? (gravarSlimEchoes[day.id] || []).filter(e => profileMatchesFilter(e.item.profile, profileFilter)) : [];
              const dayPreviews = activeTab === 'postar'
                ? (editarPreviewsByDay[day.id] || []).filter(p =>
                    (profileFilter === 'todos' || (p.item.profile || 'opa') === profileFilter) &&
                    (editorFilter === 'todos' || (p.item.editor || 'allyson') === editorFilter)
                  )
                : [];
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
                      {dayPreviews.length > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                          <Scissors className="w-2.5 h-2.5" />
                          +{dayPreviews.length} em edição
                        </span>
                      )}
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

      <AddItemModal isAdding={isAdding} setIsAdding={setIsAdding} newItem={newItem} setNewItem={setNewItem} addItem={addItem} />

      <SummaryModal
        summaryModal={summaryModal}
        onClose={() => setSummaryModal({ isOpen: false, item: null })}
        handleCopy={handleCopy}
        copiedState={copiedState}
      />

      <EditItemModal editModal={editModal} setEditModal={setEditModal} activeTab={activeTab} handleSaveEdit={handleSaveEdit} />
    </div>
  );
};

export default App;
