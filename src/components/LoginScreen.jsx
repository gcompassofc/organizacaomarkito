import React from 'react';
import { AlertCircle, Calendar, LogIn } from 'lucide-react';
import { Button } from './ui/Button';
import { Field, Input } from './ui/Input';
import { text } from '../lib/ui';

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
    <div className="max-w-md w-full bg-white p-10 rounded-[32px] shadow-xl shadow-slate-900/5 border border-slate-100 text-center">
      <div className="inline-flex items-center justify-center p-5 bg-blue-50 rounded-3xl mb-6">
        <Calendar className="w-10 h-10 text-blue-600" strokeWidth={2.25} />
      </div>
      <h1 className={`${text.display} text-slate-900 mb-3 leading-tight`}>
        Meu <span className="text-blue-600">Plano</span><br />Semanal
      </h1>
      <p className="text-slate-500 font-normal mb-8 text-sm leading-relaxed">
        {isRegistering ? 'Crie sua conta para começar a organizar seus conteúdos.' : 'Entre para começar a organizar seus conteúdos com segurança.'}
      </p>

      <form onSubmit={handleEmailAuth} className="space-y-4 mb-6 text-left">
        <Field label="E-mail">
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Senha">
          <Input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {authError && (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-xs font-medium">{authError}</p>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full">
          {isRegistering ? 'Criar conta' : 'Entrar'}
        </Button>
      </form>

      <Button variant="secondary" size="lg" onClick={handleLogin} icon={LogIn} className="w-full">
        Entrar com Google
      </Button>

      <button
        onClick={() => {
          setIsRegistering(!isRegistering);
          setAuthError(null);
        }}
        className="mt-6 text-xs text-blue-600 font-medium hover:underline"
      >
        {isRegistering ? 'Já tem uma conta? Entrar' : 'Não tem conta? Criar conta'}
      </button>
      {error && <p className="mt-4 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  </div>
);

export default LoginScreen;
