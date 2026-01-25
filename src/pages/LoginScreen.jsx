// Login Screen Page
import React from 'react';
import { Wallet } from 'lucide-react';
import { APP_VERSION } from '../config/constants';

const LoginScreen = ({ onLoginGoogle, onGuest, error }) => (
  <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black text-white flex flex-col items-center justify-center p-6">
      <div className="z-10 w-full max-w-sm text-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-[2rem] mx-auto mb-10 shadow-2xl flex items-center justify-center transform rotate-6 border border-white/10">
          <Wallet className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-5xl font-black text-white mb-3">SmartSpend</h1>
        <p className="text-blue-200/70 mb-10 text-lg">Financial clarity for the <span className="text-blue-100 font-medium">modern era</span>.</p>
        
        {error && <div className="bg-rose-500/20 border border-rose-500/30 p-3 rounded-xl mb-6 text-xs text-rose-200">{error}</div>}
        
        <div className="space-y-4">
            <button onClick={onLoginGoogle} className="w-full bg-white text-slate-900 font-bold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2">
                <span className="font-serif">G</span> Continue with Google
            </button>
            <button onClick={onGuest} className="w-full bg-white/5 hover:bg-white/10 text-blue-100 font-semibold py-4 px-6 rounded-2xl border border-white/10">
                Continue as Guest
            </button>
        </div>
        <div className="mt-8 text-xs text-slate-500 font-mono">{APP_VERSION}</div>
      </div>
  </div>
);

export default LoginScreen;