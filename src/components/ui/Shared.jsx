import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export const Toast = ({ message, type, isVisible, onClose }) => {
  if (!isVisible) return null;
  const isError = type === 'error';
  return (
    <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 ${
        isError ? 'bg-rose-500/90 border-rose-400 text-white' : 'bg-emerald-500/90 border-emerald-400 text-white'
    }`}>
       {isError ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
       <span className="font-bold text-sm">{message}</span>
       <button onClick={onClose}><X className="w-4 h-4" /></button>
    </div>
  );
};

export const Loading = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
    <div className="w-16 h-16 border-t-4 border-l-4 border-blue-400 rounded-full animate-spin mb-6"></div>
    <p className="text-blue-100 font-bold text-xl tracking-wider animate-pulse">SMARTSPEND PRO</p>
    {message && <p className="text-slate-400 text-sm mt-2">{message}</p>}
  </div>
);

export const ErrorScreen = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 text-center">
    <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
    <h1 className="text-2xl font-bold mb-2">System Error</h1>
    <p className="text-slate-400 mb-6 max-w-xs mx-auto text-sm">
      {error || "Something went wrong while starting the app."}
    </p>
    <button
      onClick={onRetry}
      className="bg-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-500 transition"
    >
      Try Again
    </button>
  </div>
);

export const ConfirmationDialog = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f0c29] border border-white/10 p-6 rounded-3xl shadow-2xl max-w-sm w-full transform scale-100 transition-all">
        <h3 className="text-lg font-bold text-white mb-2">Confirmation</h3>
        <p className="text-slate-300 mb-6 text-sm">{message}</p>
        <div className="flex gap-3 justify-end">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};