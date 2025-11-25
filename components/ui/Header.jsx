// src/components/layout/Header.jsx
import { useEffect, useState } from "react"
import Logo from "../ui/Logo.jsx";
import { loginWithGoogle, logout } from "@/lib/firebase"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import { Button } from "@/components/ui/button.tsx";
import ModeToggle from "@/components/ModeToggle.jsx"
export default function Header({}) {
    const [showMenu, setShowMenu] = useState(false)
    const [user, setUser] = useState(null)

    
    useEffect(() => {
    const savedUser = localStorage.getItem("user"); 
    if (savedUser) {
        setUser(JSON.parse(savedUser)); 
    }
    }, []);

    const handleShowMenu = () => {
        setShowMenu(true)
    }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <Logo />
      {/* <nav className="hidden md:flex items-center gap-6 text-sm">
        <Button className="font-medium text-slate-900">Home</Button>
        <Button className="text-slate-600 text-sm hover:text-slate-900">
          Report Missing
        </Button>
        <Button className="text-slate-600 hover:text-slate-900">
          Adopt a Stray
        </Button>
        {/* <button className="text-slate-600 hover:text-slate-900">About</button>
      </nav> */}
      <div className="flex items-center gap-2">
         <span>Hi, </span>
         <span>{user?.displayName?.split(' ')?.[0]}</span>
        {/* <span className="hidden sm:inline text-sm text-slate-600">
          Jane Doe
        </span> */}
        <Popover>
          <PopoverTrigger>
        <div className="h-9 w-9 rounded-full bg-violet-200 flex items-center justify-center text-sm font-semibold text-violet-800 cursor-pointer"
        onClick={handleShowMenu}
        >
          {user?.displayName?.[0]}
        </div>
        </PopoverTrigger>
        <PopoverContent>
          <Button className="w-full" onClick={logout}>Log out</Button>
        </PopoverContent>
        </Popover>
        <ModeToggle />
      </div>
    </header>
  );
}
