import React from 'react';

export default function Weapon({ weapon }) {
  if (!weapon) return <div className="w-20 h-20 rounded-full border-4 border-dashed border-stone-600/30" />;
  
  return (
    <div className="relative w-20 h-20 rounded-full border-4 border-[#7b8185] shadow-xl bg-[#2a2d34] flex items-center justify-center">
      <img src={weapon.image} alt={weapon.name} className="w-full h-full object-cover rounded-full" />
      <div className="absolute -bottom-1 -left-2 bg-attack border-2 border-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-white shadow-lg text-sm z-10 drop-shadow-md">
        {weapon.attack}
      </div>
      <div className="absolute -bottom-1 -right-2 bg-stone-300 border-2 border-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-black shadow-lg text-sm z-10 drop-shadow-md">
        {weapon.durability}
      </div>
    </div>
  );
}
