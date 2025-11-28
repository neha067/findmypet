"use client";

import Image from "next/image";
import { useState } from "react";

interface UserAvatarProps {
  photoUrl?: string | null;
  name?: string;
  size?: number;
  className?: string;
}

/**
 * User Avatar component that handles profile photos with fallback to initials
 * Uses Next.js Image component like Header for consistency
 */
export default function UserAvatar({ photoUrl, name = "User", size = 40, className = "" }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const hasValidPhoto = photoUrl && 
    photoUrl.trim() !== '' && 
    photoUrl !== "null" && 
    photoUrl !== "undefined" && 
    !imageError;

  return (
    <div 
      className={`rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-sm font-semibold text-violet-800 dark:text-violet-200 overflow-hidden flex-shrink-0 relative ${className}`}
      style={{ width: size, height: size }}
    >
      {hasValidPhoto ? (
        <Image
          src={photoUrl}
          alt={name}
          width={size}
          height={size}
          className="rounded-full object-cover"
          unoptimized
          onError={() => setImageError(true)}
        />
      ) : (
        <span style={{ fontSize: `${size * 0.4}px` }}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

