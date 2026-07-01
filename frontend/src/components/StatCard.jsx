import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, trendType = 'success', color = 'indigo' }) => {
  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/10',
    violet: 'from-violet-500/20 to-violet-600/5 text-violet-400 border-violet-500/10',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/10',
    rose: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/10',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/10',
  };

  const selectedColor = colorMap[color] || colorMap.indigo;

  return (
    <div className={`glass-panel rounded-2xl p-6 border bg-gradient-to-br ${selectedColor} relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:border-white/10`}>
      <div className="flex items-center justify-between">
        <span className="text-slate-400 text-sm font-medium tracking-wide uppercase">{title}</span>
        {Icon && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trendType === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' 
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
          }`}>
            {trend}
          </span>
        )}
      </div>
      {/* Decorative accent background blob */}
      <div className="absolute -bottom-10 -right-10 w-24 h-24 rounded-full bg-white/5 blur-2xl pointer-events-none" />
    </div>
  );
};

export default StatCard;
