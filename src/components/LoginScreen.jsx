import React from 'react';
import { AlertCircle, Calendar, LogIn } from 'lucide-react';

const LoginScreen = ({
  email,
  setEmail,
  password,
  setPassword,
  isRegistering,
  setIsRegistering,
  authError,
  setAuthError,
  handleEmailAuth,
  handleLogin,
  error
}) => (
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

export default LoginScreen;
