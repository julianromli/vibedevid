"use client";

import { Heart } from "lucide-react";
import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getProjectLikeStatusFn, toggleLikeFn } from "@/lib/actions/likes";
import { cn } from "@/lib/utils";

export interface ProminentLikeButtonProps {
  projectId: string;
  initialLikes?: number;
  initialIsLiked?: boolean;
  isLoggedIn?: boolean;
  onLikeChange?: (likes: number, isLiked: boolean) => void;
}

export function ProminentLikeButton({
  projectId,
  initialLikes = 0,
  initialIsLiked = false,
  isLoggedIn = false,
  onLikeChange,
}: ProminentLikeButtonProps) {
  const [isLiked, setIsLiked] = React.useState(initialIsLiked);
  const [likes, setLikes] = React.useState(initialLikes);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  React.useEffect(() => {
    if (!projectId) return;

    let isCurrentRequest = true;

    void getProjectLikeStatusFn({ data: { projectIdentifier: projectId } })
      .then(({ totalLikes, isLiked: dbIsLiked, error }) => {
        if (!error && isCurrentRequest) {
          setLikes(totalLikes);
          setIsLiked(isLoggedIn ? dbIsLiked : false);
        }
      })
      .catch(() => {
        // Keep SSR-provided initial state when refresh fails.
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [projectId, isLoggedIn]);

  const handleClick = async () => {
    if (!isLoggedIn) {
      setShowAuthDialog(true);
      return;
    }

    const previousLikes = likes;
    const previousIsLiked = isLiked;
    const newIsLiked = !isLiked;
    const newLikes = newIsLiked ? likes + 1 : Math.max(0, likes - 1);

    setIsAnimating(true);
    setIsLiked(newIsLiked);
    setLikes(newLikes);
    onLikeChange?.(newLikes, newIsLiked);

    try {
      const result = await toggleLikeFn({ data: { projectIdentifier: projectId } });

      if (result.error) {
        setIsLiked(previousIsLiked);
        setLikes(previousLikes);
        onLikeChange?.(previousLikes, previousIsLiked);
        return;
      }

      if (typeof result.totalLikes === "number") {
        setLikes(result.totalLikes);
      }
      if (typeof result.isLiked === "boolean") {
        setIsLiked(result.isLiked);
        onLikeChange?.(result.totalLikes ?? newLikes, result.isLiked);
      }
    } catch {
      setIsLiked(previousIsLiked);
      setLikes(previousLikes);
      onLikeChange?.(previousLikes, previousIsLiked);
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <>
      <Button
        className="py-0 pe-0 transition-transform duration-150 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        variant="default"
        onClick={handleClick}
        title={
          !isLoggedIn
            ? "Sign in to like projects"
            : isLiked
              ? "Unlike this project"
              : "Like this project"
        }
      >
        <Heart
          className={cn(
            "me-2 transition-[color,fill,transform] duration-200 ease-out motion-reduce:transition-none",
            isLiked ? "fill-red-500 text-red-500" : "text-primary-foreground opacity-80",
            isAnimating && !prefersReducedMotion && "scale-105 animate-heart-beat",
          )}
          size={16}
          strokeWidth={2}
          aria-hidden="true"
        />
        Like
        <span className="text-primary-foreground/80 before:bg-primary-foreground/20 relative ms-3 inline-flex h-full items-center justify-center rounded-full px-3 text-xs font-medium before:absolute before:inset-0 before:left-0 before:w-px">
          {likes}
        </span>
      </Button>

      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Masuk untuk Memberi Like</AlertDialogTitle>
            <AlertDialogDescription>
              Kamu harus masuk untuk memberi like pada project ini. Yuk, gabung ke VibeDev
              community!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.location.href = "/user/auth";
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
