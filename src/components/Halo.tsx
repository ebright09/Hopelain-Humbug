import React from 'react';

interface HaloProps {
  size?: 'sm' | 'md' | 'lg';
}

const Halo: React.FC<HaloProps> = ({ size = 'lg' }) => {
  const sizeClasses = {
    sm: 'w-24 h-24 md:w-32 md:h-32',
    md: 'w-32 h-32 md:w-40 md:h-40',
    lg: 'w-40 h-40 md:w-52 md:h-52 lg:w-64 lg:h-64'
  };

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Outer glow ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-r from-[#FDB515] via-yellow-300 to-[#FDB515] opacity-20 blur-xl animate-pulse`} />
      </div>
      
      {/* Rotating ring decoration */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${sizeClasses[size]} rounded-full border-2 border-dashed border-[#FDB515]/30 halo-ring`} />
      </div>
      
      {/* Main frame */}
      <div className={`relative ${sizeClasses[size]} border-4 md:border-6 border-[#FDB515] halo-glow bg-white flex items-center justify-center p-2 md:p-3 shadow-2xl`}>
        {/* Image */}
        <img 
          src="/image.png" 
          alt="Professor Hopelain - Marketing Strategy Master" 
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback if image doesn't load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const fallback = document.createElement('div');
              fallback.className = 'w-full h-full flex items-center justify-center text-[#003262] font-black text-xs md:text-sm text-center';
              fallback.innerHTML = '📊<br/>PROF.<br/>HOPELAIN';
              parent.appendChild(fallback);
            }
          }}
        />
        
        {/* Corner accent - top left */}
        <div className="absolute -top-1 -left-1 w-3 h-3 md:w-4 md:h-4 border-t-2 border-l-2 border-[#FDB515]" />
        {/* Corner accent - top right */}
        <div className="absolute -top-1 -right-1 w-3 h-3 md:w-4 md:h-4 border-t-2 border-r-2 border-[#FDB515]" />
        {/* Corner accent - bottom left */}
        <div className="absolute -bottom-1 -left-1 w-3 h-3 md:w-4 md:h-4 border-b-2 border-l-2 border-[#FDB515]" />
        {/* Corner accent - bottom right */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 border-b-2 border-r-2 border-[#FDB515]" />
      </div>
      
      {/* Title underneath */}
      <div className="mt-3 md:mt-4 text-center">
        <h2 className="text-[#FDB515] text-sm md:text-lg lg:text-xl font-black tracking-widest uppercase italic haas-font leading-tight">
          "Master" Strategist
        </h2>
        <p className="text-white/40 font-black uppercase text-[8px] md:text-[10px] tracking-widest mt-1">
          (Title purely decorative)
        </p>
      </div>
    </div>
  );
};

export default Halo;
