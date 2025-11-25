// src/pages/LoginPage.jsx
import React, { useEffect,useState } from "react";
import Logo from "@/components/ui/Logo.jsx";
import TextInput from "@/components/ui/TextInput.jsx";
import { PrimaryButton, OutlinedButton } from "@/components/ui/Buttons.jsx";
import Image from "next/image";
import Home from "../../home/page"
import { auth } from "@/lib/firebase"

export default function LoginPage({ loginWithGoogle }) {
    const [user, setUser] = useState(null)
    useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
        setUser(currentUser)
        if (currentUser) {
            localStorage.setItem("user", JSON.stringify(currentUser));
        } else {
            localStorage.removeItem("user");
        }
    })
    return unsubscribe
    }, [])

    useEffect(() => {
        console.log('user',user);
        
    },[user])
  return (
    user ?  <Home/> :
    <div className="min-h-screen flex bg-slate-50" >
      {/* Left branding panel */}
      <div className=" md:flex md:w-1/2 items-center justify-center bg-violet-100"
      >
        <div className="h-full w-full  
        bg-[url('/assets/homeleft.png')]
        bg-cover bg-center bg-no-repeat"
        >
            {/* <div>
                <Logo />
            </div> */}

            {/* <Image src={'/assets/homeleft.png'} height={500} width={300} alt="left"/> */}
          
          {/* <div className="mt-4">
            <h1 className="text-4xl font-semibold text-slate-900">
              Helping lost pets find their way home.
            </h1>
            <p className="mt-4 text-slate-600">
              Track missing cats on a live map and connect with the people who
              find them.
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center">
            <div className="w-40 h-40 rounded-3xl bg-violet-200 flex items-center justify-center">
              <span className="text-6xl">🐱</span>
            </div>
            // <p className="mt-4 text-sm text-slate-600">
            //   Loved by pet parents & rescuers in your city.
            // </p>
          </div> */}
          
        </div>
      </div>
       

      {/* Right login panel */}
      <div className="flex  md:w-1/2 items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg border border-slate-100">
           <div className="w-full h-full grid grid-cols-2">
            
                {/* <Logo /> */}
                <Image src='/assets/logobrand.png' height={40} width={100} alt="logo"/>
                <Image src='/assets/loginH1.png' height={100} width={200} alt="h1" />
            </div>
          <p className="mt-1 text-sm text-slate-600">
            Login to your FindMyPet account
          </p>

          <div className="mt-6 space-y-4">
            <TextInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
            />
            <TextInput
              label="Password"
              type="password"
              placeholder="••••••••"
            />

            <PrimaryButton className="w-full mt-2">
              Login
            </PrimaryButton>

            <div className="flex items-center gap-2 my-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-500">OR</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <OutlinedButton className="w-full flex gap-2" onClick={loginWithGoogle}>
              <Image src={'/assets/Googlebtn/logogoogle.png'} width={20} height={20} alt="logo"/>
              Continue with Google
            </OutlinedButton>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <button className="font-medium text-violet-600 hover:underline">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
   
  );
}
