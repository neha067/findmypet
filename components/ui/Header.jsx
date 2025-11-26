"use client";

import { useEffect, useState } from "react";
import Logo from "../ui/Logo.jsx";
import { logout } from "@/lib/firebase";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import ModeToggle from "@/components/ModeToggle.jsx";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-6">
      <Logo />
      
      <div className="flex items-center gap-3">
        {loading ? (
          <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : user ? (
          <>
            <span className="hidden sm:inline text-sm text-slate-600 dark:text-slate-400">
              Hi, {user.displayName?.split(' ')?.[0] || "User"}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-9 w-9 rounded-full bg-violet-200 dark:bg-violet-900 flex items-center justify-center text-sm font-semibold text-violet-800 dark:text-violet-200 cursor-pointer hover:bg-violet-300 dark:hover:bg-violet-800 transition-colors overflow-hidden">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      width={36}
                      height={36}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span>{user.displayName?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="end">
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-sm text-slate-600 dark:text-slate-400">
                    {user.email}
                  </div>
                  <Button
                    className="w-full justify-start"
                    variant="ghost"
                    onClick={handleLogout}
                  >
                    Log out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        ) : null}
        <ModeToggle />
      </div>
    </header>
  );
}
