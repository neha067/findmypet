"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { EmailAuthProvider, linkWithCredential, updatePassword } from "firebase/auth";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

const UsernameSetup = () => {
    const { user, username, loading, refreshUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAvailability = async () => {
            if (!newUsername || newUsername.trim().length < 3) {
                setIsAvailable(null);
                return;
            }

            if (!db) return;

            setIsChecking(true);
            setIsAvailable(null);

            try {
                const q = query(
                    collection(db, "users"),
                    where("username", "==", newUsername.trim())
                );
                const querySnapshot = await getDocs(q);
                setIsAvailable(querySnapshot.empty);
            } catch (err) {
                console.error("Error checking username:", err);
            } finally {
                setIsChecking(false);
            }
        };

        const timeoutId = setTimeout(() => {
            checkAvailability();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [newUsername]);

    useEffect(() => {
        if (!loading && user && username === null) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [user, username, loading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !db) return;

        if (newUsername.trim().length < 3) {
            setError("Username must be at least 3 characters long");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            // Check if username is taken (optional but good practice, skipping for now to keep it simple as per request flow)
            // For now, just save it to the user's document

            if (isAvailable === false) {
                setError("Username is already taken");
                setIsSubmitting(false);
                return;
            }

            if (password.length < 6) {
                setError("Password must be at least 6 characters long");
                setIsSubmitting(false);
                return;
            }

            if (password !== confirmPassword) {
                setError("Passwords do not match");
                setIsSubmitting(false);
                return;
            }

            // Link password to account or update if already exists
            if (user.email) {
                const passwordProvider = user.providerData.find(p => p.providerId === 'password');

                if (passwordProvider) {
                    await updatePassword(user, password);
                } else {
                    const credential = EmailAuthProvider.credential(user.email, password);
                    await linkWithCredential(user, credential);
                }
            }

            await setDoc(doc(db, "users", user.uid), {
                username: newUsername.trim(),
                email: user.email,
                createdAt: new Date(),
                updatedAt: new Date()
            }, { merge: true });

            await refreshUser();
            setIsOpen(false);
        } catch (err) {
            console.error("Error saving username:", err);
            // @ts-ignore
            if (err.code === 'auth/operation-not-allowed' || err.message?.includes('OPERATION_NOT_ALLOWED')) {
                setError("Email/Password sign-in is not enabled. Please enable it in Firebase Console.");
            } else {
                // @ts-ignore
                setError(err.message || "Failed to save username. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || !user || username) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && setIsOpen(true)}> {/* Prevent closing by clicking outside */}
            <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        Choose a username and set a password to secure your account.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            placeholder="e.g. PetLover123"
                            value={newUsername}
                            onChange={(e) => {
                                setNewUsername(e.target.value);
                                setError("");
                            }}
                            disabled={isSubmitting}
                            className={isAvailable === true ? "border-green-500 focus-visible:ring-green-500" : isAvailable === false ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        <div className="h-5 flex items-center text-xs">
                            {isChecking && (
                                <span className="flex items-center text-gray-500">
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Checking availability...
                                </span>
                            )}
                            {!isChecking && isAvailable === true && (
                                <span className="flex items-center text-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" /> Username is available
                                </span>
                            )}
                            {!isChecking && isAvailable === false && (
                                <span className="flex items-center text-red-600">
                                    <XCircle className="w-3 h-3 mr-1" /> Username is already taken
                                </span>
                            )}
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isSubmitting}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-500" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isSubmitting}
                            className={confirmPassword && password !== confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""}
                        />
                        {confirmPassword && password !== confirmPassword && (
                            <p className="text-sm text-red-500">Passwords do not match</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting || !newUsername.trim() || isAvailable === false || isChecking || !password || !confirmPassword || password !== confirmPassword}>
                            {isSubmitting ? "Saving..." : "Save Profile"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
};

export default UsernameSetup;
