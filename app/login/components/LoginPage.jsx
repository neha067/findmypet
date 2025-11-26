"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PrimaryButton, OutlinedButton } from "@/components/ui/Buttons.jsx";
import TextInput from "@/components/ui/TextInput.jsx";
import { loginWithGoogle } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import Home from "../../home/page";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/home");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      router.push("/home");
    } catch (error) {
      console.error("Login error:", error);
      alert("Failed to login. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Home />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-1/2 items-center justify-center bg-violet-100 dark:bg-violet-900/20">
        <div className="h-full w-full bg-[url('/assets/homeleft.png')] bg-cover bg-center bg-no-repeat relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-purple-600/20"></div>
          <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-40 h-40 rounded-3xl bg-violet-200 dark:bg-violet-800 flex items-center justify-center mb-6">
              <span className="text-6xl">🐱</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Helping lost pets find their way home.
            </h1>
            <p className="text-lg text-slate-700 dark:text-slate-300 max-w-md">
              Track missing cats on a live map and connect with the people who find them.
            </p>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4 mb-2">
            <Image 
              src="/assets/logobrand.png" 
              height={40} 
              width={100} 
              alt="logo"
              style={{ width: 'auto', height: '40px' }}
            />
            <Image 
              src="/assets/loginH1.png" 
              height={100} 
              width={200} 
              alt="FindMyPet"
              style={{ width: 'auto', height: '100px' }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Login to your FindMyPet account
          </p>

          <div className="mt-6 space-y-4">
            <TextInput
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              disabled
            />
            <TextInput
              label="Password"
              type="password"
              placeholder="••••••••"
              disabled
            />

            <PrimaryButton className="w-full mt-2" disabled>
              Login (Coming Soon)
            </PrimaryButton>

            <div className="flex items-center gap-2 my-4">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-500 dark:text-slate-400">OR</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <OutlinedButton
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleLogin}
            >
              <Image
                src="/assets/Googlebtn/logogoogle.png"
                width={20}
                height={20}
                alt="Google logo"
              />
              Continue with Google
            </OutlinedButton>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <span className="font-medium text-violet-600 dark:text-violet-400">
              Sign in with Google to get started
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
