"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PrimaryButton, OutlinedButton } from "@/components/ui/Buttons.jsx";
import TextInput from "@/components/ui/TextInput.jsx";
import { loginWithGoogle, auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import Home from "../../home/page";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [error, setError] = React.useState("");

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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!emailOrUsername || !password) return;

    setLoginLoading(true);
    setError("");
    try {
      let email = emailOrUsername;

      // Check if input is a username (simple check: no @ symbol)
      if (!email.includes("@")) {
        console.log("Attempting to resolve username:", email);
        const q = query(collection(db, "users"), where("username", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.error("Username not found in DB");
          throw new Error("Username not found");
        }

        email = querySnapshot.docs[0].data().email;
        console.log("Resolved username to email:", email);
      }

      console.log("Attempting sign in with:", email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Sign in successful");
      router.push("/home");
    } catch (error) {
      console.error("Login error details:", error.code, error.message);
      if (error.code === 'auth/invalid-credential' || error.message === "Username not found") {
        setError("Invalid username/email or password");
      } else {
        setError("Failed to login. Please try again.");
      }
    } finally {
      setLoginLoading(false);
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
            {/* <div className="w-40 h-40 rounded-3xl bg-violet-200 dark:bg-violet-800 flex items-center justify-center mb-6">
              <span className="text-6xl">🐱</span>
            </div> */}
            {/* <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Helping lost pets find their way home.
              </h1>
              <p className="text-lg text-slate-700 dark:text-slate-300 max-w-md">
                Track missing cats on a live map and connect with the people who find them.
              </p> */}
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-6">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-lg border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-2 gap-4 mb-2">
            <Image
              src="/assets/logobrand.png"
              height={40}
              width={100}
              alt="logo"
              style={{ width: 'auto', height: '100px' }}
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

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <TextInput
              label="Email"
              type="text"
              placeholder="you@example.com or username"
              value={emailOrUsername}
              onChange={(e) => {
                setEmailOrUsername(e.target.value);
                setError("");
              }}
              disabled={loginLoading}
            />
            <div className="space-y-1">
              <TextInput
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                disabled={loginLoading}
              />
              {error && (
                <p className="text-sm text-red-500 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>

            <Button className="w-full mt-2" disabled={loginLoading || !emailOrUsername || !password}>
              {loginLoading ? "Logging in..." : "Login"}
            </Button>
          </form>

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


          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <span className="font-medium text-violet-600 dark:text-violet-400">
              Sign in with Google to get started
            </span>
          </p>
        </div>
      </div>
    </div >
  );
}
