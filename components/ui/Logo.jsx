// src/components/ui/Logo.jsx
import React from "react";
import Image from "next/image";
export default function Logo() {
  return (
    <div className="w-full">
      {/* <div className="w-9 h-9 rounded-2xl flex items-center justify-center">
        {/* <span className="text-xl text-white">🐾</span>
      </div> */}
      {/* <span className="font-semibold text-xl text-slate-900">FindMyPet</span> */}
      <Image 
        src='/assets/logobrand.png' 
        height={100} 
        width={100} 
        alt="logo"
        style={{ width: 'auto', height: '100px' }}
      />
     </div>
  );
}
