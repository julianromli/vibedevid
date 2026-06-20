"use client";

import { FilePenLine, FileText, FolderOpen, LayoutGrid, User } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BlogTab } from "@/components/profile/blog-tab";
import { EmptyState } from "@/components/profile/empty-state";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileStats } from "@/components/profile/profile-stats";
import { ProjectTab } from "@/components/profile/project-tab";
import { Footer } from "@/components/ui/footer";
import { ScaleIn, ScrollReveal } from "@/components/ui/motion-wrapper";
import { SiteNavbar } from "@/components/ui/site-navbar";
import ProfileEditDialog from "@/components/ui/profile-edit-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateUserProfileFn } from "@/lib/actions/user.functions";
import type { ProfilePageData, ProfileUser } from "@/app/[username]/profile-data";

export default function ProfilePage({ data }: { data: ProfilePageData }) {
  const router = useRouter();
  const { currentUser, isLoggedIn, isOwner } = data;

  const [user, setUser] = useState<ProfileUser | null>(data.user);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const userProjects = data.projects;
  const userPosts = data.posts;
  const userStats = data.stats;

  const handleEdit = () => setShowEditDialog(true);

  const handleSaveProfile = async (profileData: {
    displayName: string;
    username: string;
    bio: string;
    location: string;
    website: string;
    github_url: string;
    x_url: string;
    instagram_url: string;
    threads_url: string;
    avatar_url: string;
  }) => {
    if (!user) return;
    setSaving(true);
    try {
      const result = await updateUserProfileFn({
        data: {
          currentUsername: user.username,
          profileData: {
            username: profileData.username,
            displayName: profileData.displayName,
            bio: profileData.bio,
            avatar_url: profileData.avatar_url,
            location: profileData.location,
            website: profileData.website,
            github_url: profileData.github_url,
            x_url: profileData.x_url,
            instagram_url: profileData.instagram_url,
            threads_url: profileData.threads_url,
          },
        },
      });

      if (result.success) {
        setShowEditDialog(false);
        const savedProfileData = result.data || profileData;

        const updatedUser: ProfileUser = {
          ...user,
          username: savedProfileData.username,
          display_name: savedProfileData.displayName,
          bio: savedProfileData.bio,
          location: savedProfileData.location,
          website: savedProfileData.website,
          github_url: savedProfileData.github_url,
          x_url: savedProfileData.x_url,
          instagram_url: savedProfileData.instagram_url,
          threads_url: savedProfileData.threads_url,
          twitter_url: null,
          avatar_url: savedProfileData.avatar_url,
        };

        setUser(updatedUser);
        toast.success("Profile updated successfully");
        await router.invalidate();

        if (result.usernameChanged && result.newUsername) {
          router.navigate({ to: "/$username", params: { username: result.newUsername } });
        }
      } else {
        toast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-grid-pattern relative min-h-screen">
        <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>
        <SiteNavbar showNavigation={true} />
        <div className="relative mx-auto max-w-6xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">User Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The profile you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-grid-pattern relative min-h-screen">
      <div className="from-background/80 via-background/60 to-background/80 absolute inset-0 bg-gradient-to-b"></div>

      <SiteNavbar showNavigation={true} isLoggedIn={isLoggedIn} user={currentUser ?? undefined} />

      <div className="relative mx-auto max-w-6xl px-4 py-8 pt-24 sm:px-6 lg:px-8">
        <ScrollReveal>
          <ProfileHeader user={user} isOwner={isOwner} onEdit={handleEdit} />
        </ScrollReveal>

        <div className="mb-8">
          <ProfileStats stats={userStats} />
        </div>

        <Tabs defaultValue="projects" className="w-full">
          <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="bg-muted/50 p-1 h-auto">
              <TabsTrigger
                value="projects"
                className="px-4 py-2 gap-2 data-[state=active]:bg-background"
              >
                <LayoutGrid className="h-4 w-4" />
                Projects
                <span className="ml-1 rounded-full bg-muted-foreground/20 px-2 py-0.5 text-xs">
                  {userStats.projects}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="blog"
                className="px-4 py-2 gap-2 data-[state=active]:bg-background"
              >
                <FileText className="h-4 w-4" />
                Blog Posts
                <span className="ml-1 rounded-full bg-muted-foreground/20 px-2 py-0.5 text-xs">
                  {userStats.posts}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="px-4 py-2 gap-2 data-[state=active]:bg-background"
              >
                <User className="h-4 w-4" />
                About
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="projects" className="mt-0 focus-visible:outline-none">
            {userProjects.length > 0 ? (
              <ProjectTab projects={userProjects} />
            ) : (
              <ScaleIn>
                <EmptyState
                  icon={FolderOpen}
                  title="No Projects Yet"
                  description={
                    isOwner
                      ? "You haven't showcased any projects yet. Start building your portfolio!"
                      : "This user hasn't added any projects yet."
                  }
                  actionLabel="Add Project"
                  actionLink="/project/submit"
                  isOwner={isOwner}
                />
              </ScaleIn>
            )}
          </TabsContent>

          <TabsContent value="blog" className="mt-0 focus-visible:outline-none">
            {userPosts.length > 0 ? (
              <BlogTab posts={userPosts} />
            ) : (
              <ScaleIn>
                <EmptyState
                  icon={FilePenLine}
                  title="No Blog Posts Yet"
                  description={
                    isOwner
                      ? "Share your thoughts and knowledge with the community."
                      : "This user hasn't written any blog posts yet."
                  }
                  actionLabel="Write First Post"
                  actionLink="/blog/editor"
                  isOwner={isOwner}
                />
              </ScaleIn>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-0 focus-visible:outline-none">
            <ScaleIn>
              <div className="bg-card border-border rounded-xl border p-8">
                <h3 className="text-xl font-bold mb-6">
                  About {user.display_name || user.username}
                </h3>

                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap leading-relaxed text-base">
                    {user.bio || "No bio available."}
                  </p>
                </div>

                <div className="mt-8 pt-8 border-t grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Joined</span>
                    <span className="font-medium">
                      {new Date(user.joined_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Location</span>
                    <span className="font-medium">{user.location || "Not specified"}</span>
                  </div>
                </div>
              </div>
            </ScaleIn>
          </TabsContent>
        </Tabs>
      </div>

      <ProfileEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        defaultValues={{
          name: user?.display_name || "",
          username: user?.username || "",
          avatar: user?.avatar_url || "/placeholder.svg",
          bio: user?.bio || "",
          location: user?.location || "",
          website: user?.website || "",
          github_url: user?.github_url || "",
          x_url: user?.x_url || user?.twitter_url || "",
          instagram_url: user?.instagram_url || "",
          threads_url: user?.threads_url || "",
          twitter_url: user?.twitter_url || "",
        }}
        onSave={handleSaveProfile}
        saving={saving}
      />

      <Footer />
    </div>
  );
}
