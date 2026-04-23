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
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut 
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
  
  const [data, setData] = useState({
    segunda: [],
    terca: [],
    quarta: [],
    quinta: [],
    sexta: []
  });

  const [expandedDay, setExpandedDay] = useState('segunda');
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState({ objective: '', summary: '', link: '' });

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
                setData(docSnap.data().content);
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

  const handleLogout = async () => {
    try {
      const auth = getAuth(getApp());
      await signOut(auth);
      setData({
        segunda: [],
        terca: [],
        quarta: [],
        quinta: [],
        sexta: []
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
      completed: false
    };

    const newData = {
      ...data,
      [dayId]: [...(data[dayId] || []), item]
    };

    setData(newData);
    saveToCloud(newData);
    setNewItem({ objective: '', summary: '', link: '' });
    setIsAdding(false);
  };

  const removeItem = (e, dayId, itemId) => {
    e.stopPropagation();
    const newData = {
      ...data,
      [dayId]: data[dayId].filter(item => item.id !== itemId)
    };
    setData(newData);
    saveToCloud(newData);
  };

  const toggleComplete = (e, dayId, itemId) => {
    e.stopPropagation();
    const newData = {
      ...data,
      [dayId]: data[dayId].map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
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
          <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter leading-none">
            Meu <span className="text-blue-600">Plano</span><br/>Semanal
          </h1>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            Bem-vindo! Entre com sua conta Google para começar a organizar seus conteúdos com segurança.
          </p>
          
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-xl shadow-slate-200 uppercase tracking-tight text-lg"
          >
            <LogIn className="w-6 h-6" />
            <span>Entrar com Google</span>
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
        <header className="flex flex-col md:flex-row justify-between items-start mb-16 gap-8">
          <div className="flex-1">
            <h1 className="text-[60px] md:text-[100px] leading-[0.85] font-black tracking-tighter uppercase">
              Meu <span className="text-blue-600">Plano</span><br/>Semanal
            </h1>
            <p className="mt-6 text-slate-400 font-bold tracking-[0.3em] uppercase text-xs flex items-center">
              <span className="w-8 h-[2px] bg-blue-600 mr-3"></span>
              Bem vindo, {user.displayName?.split(' ')[0]}
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

        {/* Weekly List - Vertical Accordion with Bold Styling */}
        <div className="space-y-8">
          {daysOfWeek.map((day) => (
            <div 
              key={day.id} 
              className={`group relative bg-white border border-slate-100 rounded-[32px] transition-all duration-500 ${expandedDay === day.id ? 'shadow-2xl ring-4 ring-blue-50' : 'shadow-sm hover:shadow-xl hover:border-slate-200'}`}
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
                className="w-full flex items-center justify-between p-8 text-left outline-none"
              >
                <div className="flex flex-col">
                  <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">{day.label}</h2>
                  <p className="text-xs text-slate-300 font-black uppercase tracking-[0.2em] mt-1">
                    {(data[day.id]?.length || 0)} {(data[day.id]?.length === 1 ? 'Conteúdo' : 'Conteúdos')}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${expandedDay === day.id ? 'bg-blue-600 text-white rotate-180 shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-300'}`}>
                  <ChevronDown className="w-6 h-6" strokeWidth={3} />
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedDay === day.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-10 border-t border-slate-50">
                      <div className="space-y-4 mt-8">
                        {(!data[day.id] || data[day.id].length === 0) && !isAdding && (
                          <div className="text-center py-12 text-slate-300 font-black uppercase tracking-widest bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                            Sem planos para hoje
                          </div>
                        )}
                        
                        {data[day.id]?.map((item) => (
                          <motion.div 
                            layout
                            key={item.id} 
                            className={`group/item flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${item.completed ? 'bg-slate-50/50 border-transparent opacity-50' : 'bg-white border-slate-50 hover:border-blue-200 shadow-sm'}`}
                          >
                            <div className="flex items-center space-x-5 flex-1 min-w-0">
                              <button 
                                onClick={(e) => toggleComplete(e, day.id, item.id)}
                                className={`flex-shrink-0 transition-transform active:scale-125 ${item.completed ? 'text-emerald-500' : 'text-slate-200 hover:text-blue-500'}`}
                              >
                                <CheckCircle2 className="w-10 h-10" strokeWidth={2.5} />
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className={`text-lg font-bold text-slate-800 truncate leading-tight ${item.completed ? 'line-through text-slate-400 font-semibold italic' : ''}`}>
                                  {item.objective}
                                </p>
                                {item.summary && (
                                  <p className={`text-sm font-medium mt-1 ${item.completed ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {item.summary}
                                  </p>
                                )}
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
                            className="mt-8 p-8 bg-slate-900 rounded-[32px] shadow-2xl space-y-6"
                          >
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-2">Tarefa</label>
                              <input 
                                type="text" 
                                placeholder="O QUE VAMOS FAZER?"
                                className="w-full p-5 bg-slate-800 text-white rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-xl placeholder:text-slate-600"
                                value={newItem.objective}
                                onChange={(e) => setNewItem({...newItem, objective: e.target.value})}
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-2">Resumo</label>
                              <textarea 
                                placeholder="BREVE DESCRIÇÃO DO CONTEÚDO"
                                className="w-full p-5 bg-slate-800 text-white rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm placeholder:text-slate-600 min-h-[100px] resize-none"
                                value={newItem.summary}
                                onChange={(e) => setNewItem({...newItem, summary: e.target.value})}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 ml-2">Link opcional</label>
                              <input 
                                type="text" 
                                placeholder="WWW.EXEMPLO.COM"
                                className="w-full p-5 bg-slate-800 text-white rounded-2xl border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold placeholder:text-slate-600"
                                value={newItem.link}
                                onChange={(e) => setNewItem({...newItem, link: e.target.value})}
                              />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                              <button 
                                onClick={() => addItem(day.id)} 
                                className="flex-1 bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl shadow-blue-500/20 text-lg uppercase tracking-tight"
                              >
                                Adicionar Plano
                              </button>
                              <button 
                                onClick={() => setIsAdding(false)} 
                                className="px-10 bg-slate-800 text-white font-black py-5 rounded-2xl hover:bg-slate-700 transition-all uppercase tracking-tight"
                              >
                                Voltar
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <button 
                            onClick={() => setIsAdding(true)}
                            className="mt-8 w-full flex items-center justify-center p-8 border-4 border-slate-50 rounded-[32px] text-slate-300 font-black text-xl uppercase tracking-tighter hover:text-blue-600 hover:border-blue-50 hover:bg-blue-50/20 transition-all group"
                          >
                            <Plus className="w-8 h-8 mr-4 group-hover:scale-125 transition-transform duration-500" strokeWidth={3} />
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
                Total: {Object.values(data).flat().length} Itens
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-black uppercase tracking-widest">
                {Object.values(data).flat().filter(i => i.completed).length} Concluídos
              </span>
            </div>
          </div>
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">
            Feito por G Compass
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
