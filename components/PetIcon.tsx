"use client";

import React from "react";

type PetType = "cat" | "dog" | "other";

interface PetIconProps {
  petType?: PetType | string | null;
  size?: number;
  className?: string;
}

/**
 * Icon component for pet types
 * Returns emoji-based icons for cats, dogs, and other pets
 */
export default function PetIcon({ petType, size = 80, className = "" }: PetIconProps) {
  const normalizedType = String(petType || "cat").toLowerCase().trim();
  
  // Get emoji based on pet type
  let icon: string;
  switch (normalizedType) {
    case "dog":
      icon = "🐶";
      break;
    case "other":
      icon = "🦜";
      break;
    case "cat":
    default:
      icon = "🐱";
      break;
  }

  return (
    <div 
      className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <span 
        className="text-6xl"
        style={{ fontSize: `${size * 0.6}px` }}
        role="img"
        aria-label={`${normalizedType} icon`}
      >
        {icon}
      </span>
    </div>
  );
}

/**
 * Icon for social posts
 */
export function SocialPostIcon({ size = 80, className = "" }: { size?: number; className?: string }) {
  return (
    <div 
      className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <span 
        className="text-6xl"
        style={{ fontSize: `${size * 0.6}px` }}
        role="img"
        aria-label="social post icon"
      >
        📸
      </span>
    </div>
  );
}

