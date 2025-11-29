"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  setDoc,
  runTransaction,
  writeBatch,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MapPin, Heart, MessageCircle, MoreVertical, Trash2, CheckCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import PetIcon, { SocialPostIcon } from "@/components/PetIcon";
import UserAvatar from "@/components/UserAvatar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
interface PostCardProps {
  postId: string;
  title?: string;
  imageUrl?: string;
  createdAt?: any;
  petType?: "cat" | "dog" | "other";
  post: any;
  changeTabToCreate?: (data: any) => void;
  catData?: any[];
  handleShowInMap?: (petId: string, location: [number, number]) => void;
}

const PostCard = ({
  postId,
  title,
  imageUrl,
  petType,
  post,
  changeTabToCreate,
  catData = [],
  handleShowInMap
}: PostCardProps) => {
  const { user, username } = useAuth();
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [postPetType, setPostPetType] = useState<"cat" | "dog" | "other" | undefined>(petType);
  const [postAuthor, setPostAuthor] = useState<{
    name: string;
    email: string;
    uid?: string;
    photo?: string;
  } | null>(null);
  const [postCreatedAt, setPostCreatedAt] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"adoption" | "claim" | "report" | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [claimerMobile, setClaimerMobile] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [postPet, setPostPet] = useState<any>(null)
  const [userAction, setUserAction] = useState<any>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");


  useEffect(() => {
    console.log('pet in postcard', post);
    console.log('catData in post', catData);
    setPostPet(catData.find((it: { id: any; }) => it.id === post.catId))
  }, [catData, post])

  // Load post + comments + like status
  useEffect(() => {
    if (!postId) return;
    if (!db) {
      console.error("Firestore is not initialized");
      setLoading(false);
      return;
    }

    // Create local const for TypeScript type narrowing
    const dbInstance = db;

    const postRef = doc(dbInstance, "posts", postId);

    // Real-time listener for post data
    const unsubscribePost = onSnapshot(postRef, async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLikes(data.likeCount || 0);

        // Get author information
        if (data.reportedBy) {
          // Check multiple possible fields for photo URL (for compatibility with old/new posts)
          let photoUrl = data.reportedBy.photo || data.reportedBy.userPhoto || data.reportedBy.photoURL || null;

          // If no photo in database but this is the current user's post, use their current photo
          if (!photoUrl && user && data.reportedBy.uid === user.uid && user.photoURL) {
            photoUrl = user.photoURL;
          }

          // Only set photo if it's a valid non-empty string
          const validPhoto = photoUrl && typeof photoUrl === 'string' && photoUrl.trim() !== '' && photoUrl !== "null" && photoUrl !== "undefined" ? photoUrl.trim() : null;

          setPostAuthor({
            name: data.reportedBy.name || "Anonymous",
            email: data.reportedBy.email || "",
            uid: data.reportedBy.uid,
            photo: validPhoto || undefined,
          });
        } else {
          // Fallback if reportedBy doesn't exist (for old posts)
          setPostAuthor({
            name: "Anonymous",
            email: "",
            photo: undefined,
          });
        }

        // Get creation date
        if (data.createdAt) {
          setPostCreatedAt(data.createdAt);
        }

        // Get petType from post (may be stored directly or need to fetch from cat document)
        if (data.petType) {
          setPostPetType(data.petType);
        } else if (data.catId) {
          // Fetch petType from cat document if not in post
          try {
            const catRef = doc(dbInstance, "cats", data.catId);
            const catSnap = await getDoc(catRef);
            if (catSnap.exists()) {
              const catData = catSnap.data();
              if (catData.petType) {
                setPostPetType(catData.petType);
              }
            }
          } catch (error) {
            console.error("Error fetching cat data for petType:", error);
          }
        }

        // Check if user liked this post
        if (user) {
          const likeRef = doc(dbInstance, "posts", postId, "likes", user.uid);
          const likeSnap = await getDoc(likeRef);
          setIsLiked(likeSnap.exists());
        }
      }
      setLoading(false);
    });

    // Real-time listener for comments
    const commentsRef = collection(dbInstance, "posts", postId, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));
    const unsubscribeComments = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    // Check if user has already performed an action
    let unsubscribeActions = () => { };
    if (user) {
      const actionsRef = collection(dbInstance, "posts", postId, "actions");
      const qActions = query(actionsRef, where("userId", "==", user.uid));
      unsubscribeActions = onSnapshot(qActions, (snap) => {
        if (!snap.empty) {
          setUserAction(snap.docs[0].data());
        } else {
          setUserAction(null);
        }
      });
    }

    return () => {
      unsubscribePost();
      unsubscribeComments();
      unsubscribeActions();
    };
  }, [postId, user]);

  // Handle like/unlike with transaction for atomicity
  const handleLike = async () => {
    if (!user) {
      alert("Please login to like posts");
      return;
    }
    if (!db) {
      alert("Firebase is not initialized. Please check your configuration.");
      return;
    }
    if (likeLoading) return; // Prevent double-clicks

    setLikeLoading(true);
    const previousLiked = isLiked;
    const previousLikes = likes;

    // Optimistic update (will revert on error)
    setIsLiked(!previousLiked);
    setLikes(previousLiked ? previousLikes - 1 : previousLikes + 1);

    try {
      // TypeScript now knows db is defined after the check above
      const dbInstance = db; // Create a local const for type narrowing
      if (!dbInstance) return;

      const postRef = doc(dbInstance, "posts", postId);
      const likeRef = doc(dbInstance, "posts", postId, "likes", user.uid);

      // Use transaction for atomic operations
      await runTransaction(dbInstance, async (transaction) => {
        const postSnap = await transaction.get(postRef);

        if (!postSnap.exists()) {
          throw new Error("Post does not exist");
        }

        const likeSnap = await transaction.get(likeRef);
        const currentlyLiked = likeSnap.exists();
        const currentLikeCount = postSnap.data().likeCount || 0;

        if (currentlyLiked === previousLiked) {
          // State matches, proceed with toggle
          if (previousLiked) {
            // Unlike: delete like doc and decrement count
            transaction.delete(likeRef);
            transaction.update(postRef, {
              likeCount: increment(-1),
            });
          } else {
            // Like: create like doc and increment count
            transaction.set(likeRef, {
              userId: user.uid,
              likedAt: serverTimestamp(),
            });
            transaction.update(postRef, {
              likeCount: increment(1),
            });
          }
        } else {
          // State mismatch - someone else changed it, use current state
          throw new Error("Like state changed, please refresh");
        }
      });

      // Transaction succeeded - optimistic update was correct
    } catch (error: any) {
      console.error("Error toggling like:", error);
      // Revert optimistic update on error
      setIsLiked(previousLiked);
      setLikes(previousLikes);

      // Show user-friendly error
      if (error.message?.includes("refresh")) {
        alert("Post was updated. Please refresh to see current state.");
      } else {
        alert("Failed to update like. Please try again.");
      }
    } finally {
      setLikeLoading(false);
    }
  };

  // Handle comment add
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      alert("Please login to comment");
      return;
    }
    if (!db) {
      alert("Firebase is not initialized. Please check your configuration.");
      return;
    }

    try {
      const commentsRef = collection(db, "posts", postId, "comments");
      await addDoc(commentsRef, {
        userId: user.uid,
        userName: username || user.displayName || "Anonymous",
        userPhoto: user.photoURL || "",
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });

      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!db) return;

    try {
      // @ts-ignore
      await deleteDoc(doc(db, "posts", postId, "comments", commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  // Handle action button click
  const handleActionClick = (type: "adoption" | "claim" | "report") => {
    if (type === 'report') {
      //redirect to create post
      console.log('pet,postid', post, postId);

      changeTabToCreate?.({
        ...postPet,
        targetOwnerEmail: postAuthor?.email,
        targetOwnerName: postAuthor?.name,
        targetPostId: postId
      })
      return
    }
    if (!user) {
      alert("Please login to perform this action");
      return;
    }
    setActionType(type);
    setActionDialogOpen(true);
    setActionMessage("");
  };

  // Handle action submission
  const handleActionSubmit = async () => {
    if (!actionType || !actionMessage.trim()) {
      alert("Please provide a message");
      return;
    }
    if ((actionType === 'claim' || actionType === 'adoption') && !claimerMobile.trim()) {
      alert("Please provide your mobile number");
      return;
    }
    if (!db || !user) {
      alert("Error: Database or user not initialized");
      return;
    }

    setActionLoading(true);
    try {
      const dbInstance = db;

      // Create an action record in a new 'petActions' collection
      const actionsRef = collection(dbInstance, "posts", postId, "actions");
      await addDoc(actionsRef, {
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email || "",
        userPhoto: user.photoURL || "",
        actionType: actionType, // 'adoption', 'claim', or 'report'
        message: actionMessage.trim(),
        claimerMobile: (actionType === 'claim' || actionType === 'adoption') ? claimerMobile.trim() : null,
        createdAt: serverTimestamp(),
        status: "pending", // pending, accepted, rejected
      });

      // Send email to post owner
      if (postAuthor?.email) {
        let subject = "";
        let body = "";

        if (actionType === 'claim') {
          subject = `Regarding your found pet: ${displayTitle}`;
          body = `
            <p>Hello ${postAuthor.name},</p>
            <p>I am claiming the pet you found: <strong>${displayTitle}</strong>.</p>
            <p><strong>Message:</strong> ${actionMessage.trim()}</p>
            <h3>My Contact Details:</h3>
            <ul>
              <li>Name: ${user.displayName || "Anonymous"}</li>
              <li>Email: ${user.email}</li>
              <li>Mobile: ${claimerMobile.trim()}</li>
            </ul>
            <p>Please contact me to verify ownership.</p>
            <p>Thanks,<br/>${user.displayName || "Anonymous"}</p>
          `;
        } else if (actionType === 'adoption') {
          subject = `Adoption Request for: ${displayTitle}`;
          body = `
            <p>Hello ${postAuthor.name},</p>
            <p>I am interested in adopting: <strong>${displayTitle}</strong>.</p>
            <p><strong>Message:</strong> ${actionMessage.trim()}</p>
            <h3>My Contact Details:</h3>
            <ul>
              <li>Name: ${user.displayName || "Anonymous"}</li>
              <li>Email: ${user.email}</li>
              <li>Mobile: ${claimerMobile.trim()}</li>
            </ul>
            <p>Please contact me to discuss further.</p>
            <p>Thanks,<br/>${user.displayName || "Anonymous"}</p>
          `;
        } else if (actionType === 'report') {
          subject = `Information regarding lost pet: ${displayTitle}`;
          body = `
            <p>Hello ${postAuthor.name},</p>
            <p>I have information regarding your lost pet: <strong>${displayTitle}</strong>.</p>
            <p><strong>Message:</strong> ${actionMessage.trim()}</p>
            <h3>My Contact Details:</h3>
            <ul>
              <li>Name: ${user.displayName || "Anonymous"}</li>
              <li>Email: ${user.email}</li>
            </ul>
            <p>Please contact me.</p>
            <p>Thanks,<br/>${user.displayName || "Anonymous"}</p>
          `;
        }

        if (subject && body) {
          try {
            await fetch('/api/send-email', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: postAuthor.email,
                subject: subject,
                html: body,
              }),
            });
          } catch (emailError) {
            console.error("Error sending email:", emailError);
            // Don't block the UI success if email fails, but maybe log it
          }
        }
      }

      setSuccessMessage(`${actionType === "adoption" ? "Adoption request" : actionType === "claim" ? "Pet claim" : "Found pet report"} submitted successfully!`);
      setSuccessDialogOpen(true);
      setActionDialogOpen(false);
      setActionMessage("");
      setClaimerMobile("");
      setActionType(null);
    } catch (error) {
      console.error("Error submitting action:", error);
      alert("Failed to submit action. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete post
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    if (!db || !user) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "posts", postId));
      // Also delete the pet document if it exists and was created for this post
      if (post.catId) {
        await deleteDoc(doc(db, "cats", post.catId));
      }
      setSuccessMessage("Post deleted successfully");
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    } finally {
      setLoading(false);
    }
  };

  // Handle resolve post
  const handleResolve = async () => {
    if (!confirm("Mark this case as resolved?")) return;
    if (!db || !user) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);

      // Update post status
      const postRef = doc(db, "posts", postId);
      batch.update(postRef, {
        status: "resolved",
        resolvedAt: serverTimestamp()
      });

      // Update pet status if linked
      if (post.catId) {
        const catRef = doc(db, "cats", post.catId);
        batch.update(catRef, {
          status: "resolved",
          resolvedAt: serverTimestamp()
        });
      }

      await batch.commit();
      setSuccessMessage("Marked as resolved!");
      setSuccessDialogOpen(true);
    } catch (error) {
      console.error("Error resolving post:", error);
      alert("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="border dark:border-[#3B3B52] rounded-2xl p-4 shadow-lg bg-white dark:bg-[#1A1A28] max-w-md animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
      </div>
    );
  }

  const displayTitle = title || "Untitled Post";
  // Check if we should use icon (if no imageUrl provided)
  const useIcon = !imageUrl || imageUrl.trim().length === 0;

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return "just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
    } catch (error) {
      return "";
    }
  };

  // Find linked pet data to get location
  const linkedPet: any = post.catId ? catData.find((c: any) => c.id === post.catId) : null;
  const hasLocation = linkedPet && (linkedPet?.latitude && linkedPet?.longitude);

  console.log('hasLocation', postPet?.latitude, postPet?.longitude);
  const onShowInMap = () => {
    if (hasLocation && handleShowInMap && linkedPet) {
      const position = [linkedPet.latitude, linkedPet.longitude] as [number, number];
      handleShowInMap(linkedPet.id, position);
    }
  };

  const renderCommentText = (text: string) => {
    // Regex to find URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <Button
            key={index}
            variant="link"
            className="h-auto p-0 text-blue-600 dark:text-blue-400 underline"
            onClick={() => window.location.href = part}
          >
            View Post
          </Button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="border dark:border-[#3B3B52] rounded-2xl p-4 shadow-lg bg-white dark:bg-[#1A1A28] max-w-md w-full">
      {/* User Info Header */}
      <div className="flex items-center gap-3 mb-3 justify-between">
        <div className="flex items-center gap-3">
          <UserAvatar
            photoUrl={postAuthor?.photo}
            name={postAuthor?.name || "Anonymous"}
            size={40}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold dark:text-gray-200 truncate">
                {postAuthor?.name || "Anonymous"}
              </h3>
              {postCreatedAt && (
                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {formatDate(postCreatedAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-1">
          {/* Show in Map Button - Visible for everyone if location exists */}
          {hasLocation && handleShowInMap && post?.type !== 'social' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={onShowInMap}
              title="Show in Map"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          )}

          {/* Author Actions Dropdown */}
          {user && postAuthor?.email === user.email && post.type !== 'social' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleResolve} className="text-green-600 cursor-pointer">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  <span>Mark Resolved</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete Post</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
      {post?.type !== 'social' && (
        <h2 className="text-lg font-semibold dark:text-gray-200 mb-3">{displayTitle}</h2>
      )}


      <h3 className="text-lg font-semibold dark:text-gray-200 mb-3">{post?.description}</h3>

      {/* Show icon if no image, otherwise show image */}
      {!(post?.type === 'social' && useIcon) && (
        <div className="relative w-full h-64 mb-3 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {useIcon ? (
            postPetType || petType ? (
              <PetIcon petType={postPetType || petType} size={200} />
            ) : (
              <SocialPostIcon size={200} />
            )
          ) : (
            <Image
              src={imageUrl}
              alt={displayTitle}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          )}
        </div>
      )}

      {/* Likes */}
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={handleLike}
          disabled={!user || likeLoading}
          className={`flex items-center gap-1 transition-colors ${isLiked
            ? "text-red-600 hover:text-red-700"
            : "text-gray-600 hover:text-pink-600 dark:text-gray-400 dark:hover:text-pink-600"
            } ${!user || likeLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <Heart
            size={18}
            fill={isLiked ? "currentColor" : "none"}
            className={likeLoading ? "animate-pulse" : ""}
          />
          <span className="font-medium">{likes}</span>
        </button>

        {/* Action Buttons Logic */}
        {post.type !== 'social' && user && postAuthor?.email !== user.email && (
          <Button
            className="cursor-pointer"
            disabled={!!userAction}
            onClick={() => handleActionClick(post.type === 'adoption' ? 'adoption' : post.type === 'found' ? 'claim' : 'report')}
          >
            {userAction ? (
              userAction.actionType === 'adoption' ? 'Adoption Requested' :
                userAction.actionType === 'claim' ? 'Claim Sent' : 'Reported'
            ) : (
              post.type === 'adoption' ? 'Request Adoption' :
                post.type === 'found' ? 'Claim Pet' : 'Report Found'
            )}
          </Button>
        )}

      </div>

      {/* Comments */}
      <div className="mt-4 border-t dark:border-[#3B3B52] pt-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1 dark:text-gray-300">
          <MessageCircle size={16} /> Comments ({comments.length})
        </h3>

        <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="border dark:border-[#333] p-3 rounded-lg text-sm dark:bg-[#1A1A28] bg-gray-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <UserAvatar
                    photoUrl={c.userPhoto}
                    name={c.userName || "Anonymous"}
                    size={24}
                  />
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    {c.userName || "Anonymous"}
                  </p>
                  {(user?.uid === c.userId || user?.uid === postAuthor?.uid) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-auto text-gray-400 hover:text-red-500"
                      onClick={() => handleDeleteComment(c.id)}
                      title="Delete comment"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-gray-700 dark:text-gray-200">
                  {renderCommentText(c.text)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add comment */}
        {user ? (
          <form onSubmit={handleComment} className="flex flex-col gap-2">
            <div className="flex gap-2 w-full">
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 border rounded-md p-2 dark:bg-[#2A2A3C] dark:text-gray-100 dark:border-[#3B3B52] resize-none text-sm"
                rows={2}
              />
              <Button
                type="submit"
                disabled={!newComment.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Please login to comment
          </p>
        )}
      </div>

      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-slate-100">
              {actionType === 'adoption' && 'Request Adoption'}
              {actionType === 'claim' && 'Claim Found Pet'}
              {actionType === 'report' && 'Report Found Pet'}
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              {actionType === 'adoption' && 'Tell us why you\'d like to adopt this pet and provide your contact information.'}
              {actionType === 'claim' && 'If this is your pet, provide details to help verify your claim.'}
              {actionType === 'report' && 'Help us locate the owner by providing details about where you found the pet.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="action-message" className="dark:text-slate-100">
                {actionType === 'adoption' && 'Why do you want to adopt this pet?'}
                {actionType === 'claim' && 'Proof or details of pet ownership'}
                {actionType === 'report' && 'Where and when did you find the pet?'}
              </Label>
              <textarea
                id="action-message"
                placeholder={
                  actionType === 'adoption'
                    ? 'Tell us about your home, experience with pets, and why you\'d be a great owner...'
                    : actionType === 'claim'
                      ? 'Include any distinctive marks, collar details, or proof of ownership...'
                      : 'Provide location, time, and current condition of the pet...'
                }
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                className="w-full border rounded-md p-2 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 resize-none text-sm"
                rows={4}
              />
            </div>

            {(actionType === 'claim' || actionType === 'adoption') && (
              <div className="space-y-2">
                <Label htmlFor="mobile-number" className="dark:text-slate-100">
                  Mobile Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mobile-number"
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={claimerMobile}
                  onChange={(e) => setClaimerMobile(e.target.value)}
                  className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
                />
              </div>
            )}

            {actionType === 'adoption' && (
              <div className="space-y-2">
                <Label htmlFor="contact-info" className="text-sm dark:text-slate-300">
                  Contact Information
                </Label>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {user?.email && `Email: ${user.email}`}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              className="dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleActionSubmit}
              disabled={actionLoading || !actionMessage.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {actionLoading ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-center text-xl dark:text-slate-100">Success! 🎉</DialogTitle>
            <DialogDescription className="text-center dark:text-slate-400">
              {successMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                setSuccessDialogOpen(false);
                if (successMessage.includes("deleted")) {
                  // Optional: Redirect or refresh if needed
                }
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PostCard;
