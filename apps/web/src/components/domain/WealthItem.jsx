import React from 'react';
import { Trash2, Building2, FileText } from 'lucide-react';
import { formatIndianCompact } from '../../../../../packages/shared/utils/helpers';

const WealthItem = ({ item, onDelete }) => {
    const isAsset = item.type === 'asset';
    return (
        <div className="group flex items-center p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl mb-3 transition-all hover:bg-white/10 relative overflow-hidden">
            <div className={`p-3.5 rounded-2xl mr-4 ${isAsset ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'} shadow-inner shrink-0 relative z-10`}>
                {isAsset ? <Building2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 relative z-10">
                <h4 className="font-semibold text-blue-50 truncate text-base md:text-lg">{item.name}</h4>
                <p className="text-xs md:text-sm text-blue-300/70 mt-1 capitalize">{item.type}</p>
            </div>
            <div className="text-right pl-4 shrink-0 flex flex-col items-end relative z-10">
                <p className={`font-bold text-lg md:text-xl tracking-tight ${isAsset ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {formatIndianCompact(item.amount)}
                </p>
                {onDelete && (
                    <button 
                        onClick={() => onDelete(item.id)} 
                        className="mt-1 p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-all active:scale-90"
                        title="Delete Asset/Liability"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default WealthItem;