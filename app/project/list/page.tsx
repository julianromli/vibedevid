"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/ui/navbar";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { HeartButtonDisplay } from "@/components/ui/heart-button-display";
import { ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fetchProjectsWithSorting, signOut } from "@/lib/actions";
import { getCategories } from "@/lib/categories";
import { Footer } from "@/components/ui/footer";

export default function ProjectListPage() {
  const router = useRouter();
  
  // State management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar: string;
    username?: string;
  } | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  // Filter and sort state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isTrendingOpen, setIsTrendingOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedTrending, setSelectedTrending] = useState("Newest");
  const [filterOptions, setFilterOptions] = useState<string[]>(["All"]);

  const trendingOptions = ["Trending", "Top", "Newest"];

  // Fetch categories for filter options
  useEffect(() => {
    const fetchFilterCategories = async () => {
      try {
        const categories = await getCategories();
        const categoryDisplayNames = categories.map((cat) => cat.display_name);
        setFilterOptions(["All", ...categoryDisplayNames]);
      } catch (error) {
        console.error("Failed to fetch categories for filters:", error);
      }
    };

    fetchFilterCategories();
  }, []);

  // Authentication check
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        console.log("[ProjectList] Checking authentication state...");
        const supabase = createClient();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth check timeout")), 3000),
        );

        const sessionPromise = supabase.auth.getSession();

        const result = (await Promise.race([
          sessionPromise,
          timeoutPromise,
        ])) as { data: { session: any }; error?: any };
        
        const {
          data: { session },
        } = result;

        if (!isMounted) return;

        console.log("[ProjectList] Session data:", session);

        if (session?.user) {
          console.log("[ProjectList] User found in session:", session.user);
          setIsLoggedIn(true);

          // Get user profile from database
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (!isMounted) return;

          console.log("[ProjectList] User profile from database:", profile);

          if (profile) {
            const userData = {
              name: profile.display_name,
              email: session.user.email || "",
              avatar: profile.avatar_url || "/vibedev-guest-avatar.png",
              username: profile.username,
            };
            console.log("[ProjectList] Setting user data:", userData);
            setUser(userData);
          }
        } else {
          console.log("[ProjectList] No session found, user not logged in");
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("[ProjectList] Error in checkAuth:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setAuthReady(true);
      }
    };

    checkAuth();

    // Listen for auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log("[ProjectList] Auth state change:", event, session);
      if (event === "SIGNED_IN" && session) {
        console.log("[ProjectList] User signed in via auth state change");
        setAuthReady(true);
      } else if (event === "SIGNED_OUT") {
        console.log("[ProjectList] User signed out, clearing state");
        setIsLoggedIn(false);
        setUser(null);
        setAuthReady(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch projects with sorting and filtering
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        console.log("[ProjectList] Fetching projects with sorting:", {
          selectedTrending,
          selectedFilter,
          authReady,
        });
        
        setLoading(true);
        
        // Convert selectedTrending to sortBy parameter
        let sortBy: "trending" | "top" | "newest" = "newest";
        switch (selectedTrending) {
          case "Trending":
            sortBy = "trending";
            break;
          case "Top":
            sortBy = "top";
            break;
          case "Newest":
          default:
            sortBy = "newest";
            break;
        }
        
        // Fetch ALL projects (no limit for list page)
        const { projects: fetchedProjects, error } = await fetchProjectsWithSorting(
          sortBy,
          selectedFilter === "All" ? undefined : selectedFilter,
          100 // High limit to get all projects
        );
        
        if (error) {
          console.error("[ProjectList] Error fetching projects:", error);
          return;
        }
        
        console.log("[ProjectList] Projects fetched:", fetchedProjects.length);
        setProjects(fetchedProjects || []);
        
      } catch (error) {
        console.error("[ProjectList] Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch projects when auth state changes OR when sorting/filter changes
    if (authReady) {
      fetchProjects();
    }
  }, [authReady, selectedTrending, selectedFilter]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleProfile = () => {
    if (user) {
      // Navigate to user profile using their username from database
      router.push(`/${user.username?.toLowerCase().replace(/\s+/g, "")}`);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar dengan background pattern sama seperti profile page */}
      <div className="min-h-screen bg-grid-pattern relative">
        {/* Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80"></div>
        
        <Navbar
          showNavigation={true}
          isLoggedIn={isLoggedIn}
          user={user ?? undefined}
          scrollToSection={scrollToSection}
        />

        {/* Main Content */}
        <section className="relative py-12 pt-24 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4 tracking-tight">
                Showcase Project Developer Indonesia
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Temukan project keren yang dibuat oleh komunitas vibe coder
                Indonesia. Dari AI tools sampai open source projects, semua karya
                developer terbaik ada di sini.
              </p>
            </div>

            {/* Filter Controls - sama seperti homepage */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                {/* Filters Dropdown */}
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                    className="flex items-center gap-2"
                  >
                    Filter
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isFiltersOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>

                  {isFiltersOpen && (
                    <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-10">
                      <div className="p-2">
                        {filterOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSelectedFilter(option);
                              setIsFiltersOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors ${
                              selectedFilter === option
                                ? "bg-muted text-foreground"
                                : "text-muted-foreground"
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 flex justify-center">
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/project/submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Project
                  </Link>
                </Button>
              </div>

              {/* Trending Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setIsTrendingOpen(!isTrendingOpen)}
                  className="flex items-center gap-2"
                >
                  {selectedTrending}
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      isTrendingOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>

                {isTrendingOpen && (
                  <div className="absolute top-full right-0 mt-2 w-32 bg-background border border-border rounded-lg shadow-lg z-10">
                    <div className="p-2">
                      {trendingOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedTrending(option);
                            setIsTrendingOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors ${
                            selectedTrending === option
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Project Grid - sama layout seperti homepage tapi tampilkan semua */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading
                ? Array.from({ length: 9 }).map((_, index) => (
                    <div key={index} className="group cursor-pointer py-0 my-4">
                      <div className="relative overflow-hidden rounded-lg bg-muted animate-pulse mb-4">
                        <div className="w-full h-64 bg-muted"></div>
                      </div>
                      <div className="space-y-3">
                        <div className="h-6 bg-muted rounded animate-pulse"></div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                            <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
                          </div>
                          <div className="h-8 w-16 bg-muted rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ))
                : projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/project/${project.slug}`}
                      className="group cursor-pointer py-0 my-4 block"
                    >
                      {/* Thumbnail Preview Section */}
                      <div className="relative overflow-hidden rounded-lg bg-background shadow-md hover:shadow-xl transition-all duration-300 mb-4">
                        <AspectRatio ratio={16 / 9}>
                          <Image
                            src={project.image || "/vibedev-guest-avatar.png"}
                            alt={project.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.src = "/vibedev-guest-avatar.png";
                            }}
                          />
                        </AspectRatio>

                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="px-2 py-1 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
                            {project.category}
                          </span>
                        </div>
                      </div>

                      {/* Project Details Section */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300 text-lg py-0">
                          {project.title}
                        </h3>

                        {/* Author and Stats */}
                        <div className="flex items-center justify-between py-0">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity z-10 relative cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/${project.author.username}`);
                              }}
                            >
                              <OptimizedAvatar
                                src={project.author.avatar}
                                alt={project.author.name}
                                size="sm"
                                className="ring-2 ring-muted"
                                showSkeleton={false}
                              />
                              <span className="text-sm font-medium text-muted-foreground">
                                {project.author.name}
                              </span>
                            </div>
                          </div>
                          <div className="relative z-20">
                            <HeartButtonDisplay
                              likes={project.likes || 0}
                              variant="default"
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
            </div>

            {/* No projects message */}
            {!loading && projects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground mb-4">
                  Belum ada project dengan filter yang dipilih
                </p>
                <Button asChild>
                  <Link href="/project/submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Jadi yang Pertama Submit Project
                  </Link>
                </Button>
              </div>
            )}

            {/* Stats info */}
            {!loading && projects.length > 0 && (
              <div className="text-center mt-8">
                <p className="text-muted-foreground">
                  Menampilkan {projects.length} project dari komunitas developer Indonesia
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Footer - using reusable Footer component */}
        <Footer />
      </div>
    </div>
  );
}