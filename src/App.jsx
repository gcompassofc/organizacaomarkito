import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Calendar, 
  Info, 
  Cloud, 
  Check, 
  Loader2,
  AlertCircle,
  LogIn,
  LogOut,
  Clock,
  X,
  Copy,
  GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  projectId: "gen-lang-client-0601883980",
  appId: "1:946045213254:web:ea0dbdd8a0faa88bc88847",
  apiKey: "AIzaSyBs63bKDn0Wz-aNftk7uBexbMiWmMIHmZc",
  authDomain: "gen-lang-client-0601883980.firebaseapp.com",
  storageBucket: "gen-lang-client-0601883980.firebasestorage.app",
  messagingSenderId: "946045213254",
};

// Custom Database ID for this project
const firestoreDatabaseId = "ai-studio-568f74c2-f715-4e59-828f-2659132b6705";

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('gravar');
  const [data, setData] = useState({
    gravar: { segunda: [], terca: [], quarta: [], quinta: [], sexta: [] },
    postar: { segunda: [], terca: [], quarta: [], quinta: [], sexta: [] }
  });

  const [expandedDay, setExpandedDay] = useState('segunda');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ objective: '', summary: '', link: '', date: '', time: '', recordingType: 'sozinho' });
  const [draggedItem, setDraggedItem] = useState(null);
  const [summaryModal, setSummaryModal] = useState({ isOpen: false, item: null });
  const [copiedState, setCopiedState] = useState(false);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState(null);

  // 1. Initial Authentication & Firebase Setup
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
            // Started sync
            const docRef = doc(db, 'artifacts', 'organizador-semanal', 'users', currentUser.uid, 'weeklyData', 'current');
            unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
              if (docSnap.exists()) {
                const cloudData = docSnap.data().content;
                // Migration: check if it's the old format
                if (cloudData.segunda && !cloudData.gravar) {
                  setData({
                    gravar: cloudData,
                    postar: { segunda: [], terca: [], quarta: [], quinta: [], sexta: [] }
                  });
                } else {
                  setData(cloudData);
                }
              }
              setLoading(false);
            }, (error) => {
              console.error("Snapshot error:", error);
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Firebase init failed:", err);
        setAuthChecking(false);
        setLoading(false);
        setError("Erro ao inicializar Firebase.");
      }
    };

    init();

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      const auth = getAuth(getApp());
      const provider = new GoogleAuthProvider();
      
      // Forces account selection to prevent automatic popup closure
      provider.setCustomParameters({ prompt: 'select_account' });
      
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Firebase Auth Error:", err.code, err.message);
      
      let friendlyMessage = "Erro ao entrar com Google. Tente novamente.";
      if (err.code === 'auth/unauthorized-domain') {
        friendlyMessage = "Este domínio não está autorizado no Console do Firebase (Authentication > Settings > Authorized Domains).";
      } else if (err.code === 'auth/operation-not-allowed') {
        friendlyMessage = "O provedor Google não está ativado no Console do Firebase.";
      } else if (err.code === 'auth/popup-closed-by-user') {
        friendlyMessage = "O login foi cancelado.";
      }
      
      setError(friendlyMessage);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    
    if (!email || !password) {
      setAuthError("Preencha todos os campos.");
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
      console.error("Email Auth Error:", err.code, err.message);
      let friendlyMessage = "Erro na autenticação.";
      
      switch (err.code) {
        case 'auth/invalid-email': friendlyMessage = "E-mail inválido."; break;
        case 'auth/user-disabled': friendlyMessage = "Usuário desativado."; break;
        case 'auth/user-not-found': friendlyMessage = "Usuário não encontrado."; break;
        case 'auth/wrong-password': friendlyMessage = "Senha incorreta."; break;
        case 'auth/email-already-in-use': friendlyMessage = "Este e-mail já está em uso."; break;
        case 'auth/weak-password': friendlyMessage = "Senha muito fraca (mínimo 6 caracteres)."; break;
        case 'auth/invalid-credential': friendlyMessage = "E-mail ou senha incorretos."; break;
        default: friendlyMessage = "Ocorreu um erro. Tente novamente.";
      }
      setAuthError(friendlyMessage);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth(getApp());
      await signOut(auth);
      setData({
        gravar: { segunda: [], terca: [], quarta: [], quinta: [], sexta: [] },
        postar: { segunda: [], terca: [], quarta: [], quinta: [], sexta: [] }
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const saveToCloud = async (newData) => {
    if (!user || !firebaseReady) {
      localStorage.setItem('local_weekly_data', JSON.stringify(newData));
      return;
    }

    setSaving(true);
    try {
      const db = getFirestore(getApp(), firestoreDatabaseId);
      const docRef = doc(db, 'artifacts', 'organizador-semanal', 'users', user.uid, 'weeklyData', 'current');
      await setDoc(docRef, { 
        content: newData, 
        lastUpdated: new Date().toISOString() 
      });
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setTimeout(() => setSaving(false), 600);
    }
  };

  const daysOfWeek = [
    { id: 'segunda', label: 'Segunda-feira', color: 'bg-blue-500' },
    { id: 'terca', label: 'Terça-feira', color: 'bg-emerald-500' },
    { id: 'quarta', label: 'Quarta-feira', color: 'bg-amber-500' },
    { id: 'quinta', label: 'Quinta-feira', color: 'bg-purple-500' },
    { id: 'sexta', label: 'Sexta-feira', color: 'bg-rose-500' },
  ];

  const handleDragStart = (e, dayId, item) => {
    setDraggedItem({ dayId, item });
  };

  const handleDrop = (e, targetDayId) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    const { dayId: sourceDayId, item } = draggedItem;
    if (sourceDayId === targetDayId) return;

    const newData = { ...data };
    newData[activeTab][sourceDayId] = newData[activeTab][sourceDayId].filter(i => i.id !== item.id);
    newData[activeTab][targetDayId] = [...(newData[activeTab][targetDayId] || []), item];

    setData(newData);
    saveToCloud(newData);
    setDraggedItem(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleCopy = () => {
    if (summaryModal.item?.summary) {
      navigator.clipboard.writeText(summaryModal.item.summary);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    }
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
      link: newItem.link.trim() ? (newItem.link.startsWith('http') ? newItem.link : `https://${newItem.link}`) : '',
      date: newItem.date,
      time: newItem.time,
      recordingType: newItem.recordingType,
      completed: false
    };

    const newData = {
      ...data,
      [activeTab]: {
        ...data[activeTab],
        [dayId]: [...(data[activeTab][dayId] || []), item]
      }
    };

    setData(newData);
    saveToCloud(newData);
    setNewItem({ objective: '', summary: '', link: '', date: '', time: '', recordingType: 'sozinho' });
    setIsAdding(false);
  };

  const removeItem = (e, dayId, itemId) => {
    e.stopPropagation();
    const newData = {
      ...data,
      [activeTab]: {
        ...data[activeTab],
        [dayId]: data[activeTab][dayId].filter(item => item.id !== itemId)
      }
    };
    setData(newData);
    saveToCloud(newData);
  };

  const toggleComplete = (e, dayId, itemId) => {
    e.stopPropagation();
    const newData = {
      ...data,
      [activeTab]: {
        ...data[activeTab],
        [dayId]: data[activeTab][dayId].map(item => 
          item.id === itemId ? { ...item, completed: !item.completed } : item
        )
      }
    };
    setData(newData);
    saveToCloud(newData);
  };

  if (authChecking || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse text-lg tracking-tight">Sincronizando seus planos...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 text-center"
        >
          <div className="inline-flex items-center justify-center p-5 bg-blue-50 rounded-3xl mb-8">
            <Calendar className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter leading-none">
            Meu <span className="text-blue-600">Plano</span><br/>Semanal
          </h1>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed text-sm">
            {isRegistering 
              ? "Crie sua conta para começar a organizar seus conteúdos." 
              : "Bem-vindo! Entre para começar a organizar seus conteúdos com segurança."}
          </p>

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6 text-left">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
              <input 
                type="email" 
                placeholder="seu@email.com"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-800"
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

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-100 uppercase tracking-tight text-lg"
            >
              {isRegistering ? "Criar Conta" : "Entrar"}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-300 font-black tracking-widest">ou</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-white border-2 border-slate-100 text-slate-900 font-black py-4 rounded-2xl hover:bg-slate-50 active:scale-[0.98] transition-all uppercase tracking-tight text-lg"
          >
            <LogIn className="w-5 h-5 text-blue-600" />
            <span>Entrar com Google</span>
          </button>

          <button 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setAuthError(null);
            }}
            className="mt-6 text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] hover:underline"
          >
            {isRegistering ? "Já tem uma conta? Entrar" : "Não tem conta? Criar conta"}
          </button>
          
          <p className="mt-8 text-[10px] text-slate-300 font-black uppercase tracking-[0.3em]">
            Feito por G Compass
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-900 p-6 md:p-12 selection:bg-blue-100">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section - Bold Typography Theme */}
        <header className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
          <div className="flex-1">
            <h1 className="text-5xl md:text-7xl leading-[0.85] font-black tracking-tighter uppercase">
              Meu <span className="text-blue-600">Plano</span><br/>Semanal
            </h1>
            <p className="mt-4 text-slate-400 font-bold tracking-[0.3em] uppercase text-xs flex items-center">
              <span className="w-8 h-[2px] bg-blue-600 mr-3"></span>
              Bem vindo, {user.displayName ? user.displayName.split(' ')[0] : user.email.split('@')[0]}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3 self-end md:self-start">
            <div className="flex items-center space-x-3">
              <AnimatePresence>
                {firebaseReady ? (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full shadow-sm"
                  >
                    <div className="w-2.4 h-2.4 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-emerald-700 tracking-wider uppercase">Sincronizado</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-300 font-mono font-bold uppercase tracking-widest">
                ID: {user.uid.substring(0, 8)}
              </p>
            </div>
          </div>
        </header>

        {/* Content Switcher Component */}
        <div className="mb-12 flex justify-center">
          <div className="bg-slate-100 p-1.5 rounded-[24px] flex items-center relative w-full max-w-md">
            <motion.div 
              className="absolute top-1.5 bottom-1.5 rounded-[20px] shadow-sm"
              initial={false}
              animate={{ 
                left: activeTab === 'gravar' ? '6px' : '50%',
                right: activeTab === 'gravar' ? '50%' : '6px',
                backgroundColor: activeTab === 'gravar' ? '#2563eb' : '#059669', // blue-600 and emerald-600
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
            <button 
              onClick={() => setActiveTab('gravar')}
              className="relative flex-1 py-4 text-xs font-black uppercase tracking-widest outline-none"
            >
              <motion.span
                animate={{ color: activeTab === 'gravar' ? '#ffffff' : '#94a3b8' }} // white and slate-400
                transition={{ duration: 0.2 }}
              >
                Marco vai gravar
              </motion.span>
            </button>
            <button 
              onClick={() => setActiveTab('postar')}
              className="relative flex-1 py-4 text-xs font-black uppercase tracking-widest outline-none"
            >
              <motion.span
                animate={{ color: activeTab === 'postar' ? '#ffffff' : '#94a3b8' }} // white and slate-400
                transition={{ duration: 0.2 }}
              >
                Postagens da Semana
              </motion.span>
            </button>
          </div>
        </div>

        {/* Weekly List - Vertical Accordion with Bold Styling */}
        <div className="space-y-8">
          {daysOfWeek.map((day) => (
            <div 
              key={day.id} 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day.id)}
              className={`group relative bg-white border border-slate-100 rounded-[32px] transition-shadow duration-500 ${expandedDay === day.id ? 'shadow-2xl ring-4 ring-blue-50' : 'shadow-sm hover:shadow-xl hover:border-slate-200'} ${draggedItem && draggedItem.dayId !== day.id ? 'border-dashed border-2 border-blue-300' : ''}`}
            >
              {/* Day Badge */}
              <div className="absolute -top-3 left-8 z-10 transition-transform duration-300 group-hover:scale-110">
                <span className={`${day.color} text-white text-[11px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-black/10`}>
                  {day.id.substring(0, 3)}
                </span>
              </div>

              {/* Day Header */}
              <button 
                onClick={() => toggleDay(day.id)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left outline-none"
              >
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{day.label}</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
                    {(data[activeTab][day.id]?.length || 0)} {(data[activeTab][day.id]?.length === 1 ? 'Conteúdo' : 'Conteúdos')}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${expandedDay === day.id ? 'bg-blue-600 text-white rotate-180 shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-300'}`}>
                  <ChevronDown className="w-5 h-5" strokeWidth={3} />
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedDay === day.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0 }}
                    className="overflow-hidden"
                    style={{ willChange: "height, opacity" }}
                  >
                    <div className="px-5 md:px-6 pb-6 border-t border-slate-50">
                      <div className="space-y-3 mt-5">
                        {(!data[activeTab][day.id] || data[activeTab][day.id].length === 0) && !isAdding && (
                          <div className="text-center py-8 text-slate-300 font-black uppercase tracking-widest bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 text-sm">
                            Sem planos para hoje
                          </div>
                        )}
                        
                        {data[activeTab][day.id]?.map((item) => (
                          <motion.div 
                            layout
                            key={item.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, day.id, item)}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30, mass: 0.8 }}
                            className={`group/item flex items-center justify-between p-5 rounded-2xl border-2 ${item.completed ? 'bg-slate-50/50 border-transparent opacity-50' : 'bg-white border-slate-50 hover:border-blue-200 shadow-sm'} cursor-grab active:cursor-grabbing`}
                            style={{ willChange: "transform, opacity" }}
                          >
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="text-slate-300 cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <button 
                                onClick={(e) => toggleComplete(e, day.id, item.id)}
                                className={`flex-shrink-0 transition-transform active:scale-125 ${item.completed ? 'text-emerald-500' : 'text-slate-200 hover:text-blue-500'}`}
                              >
                                <CheckCircle2 className="w-10 h-10" strokeWidth={2.5} />
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-base font-bold text-slate-800 truncate leading-tight ${item.completed ? 'line-through text-slate-400 font-semibold italic' : ''}`}>
                                  {item.objective}
                                </p>
                                {item.summary && (
                                  <div className="flex items-center mt-1 space-x-2">
                                    <p className={`text-xs font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px] ${item.completed ? 'text-slate-300' : 'text-slate-500'}`}>
                                      {item.summary}
                                    </p>
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setSummaryModal({ isOpen: true, item }); }}
                                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold uppercase tracking-wider flex-shrink-0 transition-colors"
                                    >
                                      Ler Resumo
                                    </button>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  {item.recordingType && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                      item.recordingType === 'sozinho' 
                                        ? 'bg-purple-100 text-purple-700' 
                                        : 'bg-orange-100 text-orange-700'
                                    }`}>
                                      {item.recordingType === 'sozinho' ? 'Gravar sozinho' : 'Gravar com alguém'}
                                    </span>
                                  )}
                                  {item.date && (
                                    <span className={`flex items-center text-[10px] font-black uppercase tracking-wider ${item.completed ? 'text-slate-300' : 'text-slate-400'}`}>
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {item.date}
                                    </span>
                                  )}
                                  {item.time && (
                                    <span className={`flex items-center text-[10px] font-black uppercase tracking-wider ${item.completed ? 'text-slate-300' : 'text-slate-400'}`}>
                                      <Clock className="w-3 h-3 mr-1" />
                                      {item.time}
                                    </span>
                                  )}
                                </div>
                                {item.link && (
                                  <a 
                                    href={item.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center text-[10px] font-black text-blue-500 hover:text-blue-700 mt-2 transition-colors uppercase tracking-widest underline decoration-2 underline-offset-4"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    Link Externo
                                  </a>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={(e) => removeItem(e, day.id, item.id)}
                              className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </motion.div>
                        ))}
                      </div>

                      {/* Highlighted Form */}
                      <AnimatePresence>
                        {isAdding ? (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-5 md:p-6 bg-slate-900 rounded-[24px] shadow-2xl space-y-4"
                          >
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-2">Tarefa</label>
                              <input 
                                type="text" 
                                placeholder="O QUE VAMOS FAZER?"
                                className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-base placeholder:text-slate-600"
                                value={newItem.objective}
                                onChange={(e) => setNewItem({...newItem, objective: e.target.value})}
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-2">Resumo</label>
                              <textarea 
                                placeholder="BREVE DESCRIÇÃO DO CONTEÚDO"
                                className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600 min-h-[80px] resize-none"
                                value={newItem.summary}
                                onChange={(e) => setNewItem({...newItem, summary: e.target.value})}
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-2">Formato</label>
                                <select
                                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm appearance-none"
                                  value={newItem.recordingType}
                                  onChange={(e) => setNewItem({...newItem, recordingType: e.target.value})}
                                >
                                  <option value="sozinho">Gravar sozinho</option>
                                  <option value="com_alguem">Gravar com alguém</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-2">Link opcional</label>
                                <input 
                                  type="text" 
                                  placeholder="WWW.EXEMPLO.COM"
                                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600"
                                  value={newItem.link}
                                  onChange={(e) => setNewItem({...newItem, link: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-2">Data</label>
                                <input 
                                  type="text" 
                                  placeholder="24/04"
                                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600"
                                  value={newItem.date}
                                  onChange={(e) => setNewItem({...newItem, date: e.target.value})}
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 ml-2">Horário</label>
                                <input 
                                  type="text" 
                                  placeholder="14:00"
                                  className="w-full p-4 bg-slate-800 text-white rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600"
                                  value={newItem.time}
                                  onChange={(e) => setNewItem({...newItem, time: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <button 
                                onClick={() => addItem(day.id)} 
                                className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/20 text-sm uppercase tracking-tight"
                              >
                                Adicionar Plano
                              </button>
                              <button 
                                onClick={() => setIsAdding(false)} 
                                className="px-8 bg-slate-800 text-white font-black py-4 rounded-xl hover:bg-slate-700 transition-all text-sm uppercase tracking-tight"
                              >
                                Voltar
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <button 
                            onClick={() => setIsAdding(true)}
                            className="mt-4 w-full flex items-center justify-center p-6 border-4 border-slate-50 rounded-2xl text-slate-300 font-black text-base uppercase tracking-tighter hover:text-blue-600 hover:border-blue-50 hover:bg-blue-50/20 transition-all group"
                          >
                            <Plus className="w-6 h-6 mr-3 group-hover:scale-125 transition-transform duration-500" strokeWidth={3} />
                            Novo Item
                          </button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Footer - Bold Typography Style */}
        <footer className="mt-20 mb-16 flex flex-col md:flex-row items-center justify-between border-t border-slate-100 pt-10 gap-6">
          <div className="flex items-center space-x-8 text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-200"></span>
              <span className="text-[11px] font-black uppercase tracking-widest">
                Total: {Object.values(data[activeTab]).flat().length} Itens
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-black uppercase tracking-widest">
                {Object.values(data[activeTab]).flat().filter(i => i.completed).length} Concluídos
              </span>
            </div>
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">
            Feito por G Compass
          </div>
        </footer>
      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {summaryModal.isOpen && summaryModal.item && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSummaryModal({ isOpen: false, item: null })}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setSummaryModal({ isOpen: false, item: null })} 
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4 pr-10 leading-tight">
                {summaryModal.item.objective}
              </h3>
              
              <div className="bg-slate-50 p-6 rounded-2xl mb-6 max-h-[50vh] overflow-y-auto">
                <p className="text-slate-600 font-medium whitespace-pre-wrap text-sm leading-relaxed">
                  {summaryModal.item.summary}
                </p>
              </div>
              
              <button 
                onClick={handleCopy}
                className={`w-full font-black py-4 rounded-xl active:scale-[0.98] transition-all text-sm uppercase tracking-tight flex items-center justify-center space-x-2 ${
                  copiedState 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20'
                }`}
              >
                {copiedState ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                <span>{copiedState ? 'Copiado!' : 'Copiar Resumo'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
