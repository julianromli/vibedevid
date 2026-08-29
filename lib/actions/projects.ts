import { revalidatePath } from "@/lib/revalidation";
import { z } from "zod";
import { fetchFavicon } from "../favicon-utils";
import { ensureUniqueSlug, getProjectIdBySlug, slugifyTitle } from "../slug";
import { getDb } from "@/lib/db";
import { projects, categories, users, comments, likes, views } from "@/lib/db/schema";
import { getServerSession, requireUser } from "@/lib/server/auth";
import {
  buildProjectFieldErrors,
  buildProjectSubmissionSchema,
  readProjectFormData,
  type ProjectScreenshotFieldErrors,
} from "@/lib/project-submission";
import { eq } from "drizzle-orm";

type SubmitProjectFieldErrors = ProjectScreenshotFieldErrors;

interface SubmitProjectResult {
  success: boolean;
  slug?: string;
  error?: string;
  fieldErrors?: SubmitProjectFieldErrors;
}

interface SubmitProjectInput {
  title: string;
  description: string;
  category: string;
  websiteUrl: string | null;
  imageUrls: string[];
  imageKeys: string[];
  tagline: string;
  tags: string[];
}

interface ProvisionalUploadCleanupResult {
  success: boolean;
  deletedCount: number;
}

const DEFAULT_FAVICON = "/default-favicon.svg";
const PROJECT_LIST_PATH = "/project/list";
const UNEXPECTED_ERROR_MESSAGE = "An unexpected error occurred";
const VALIDATION_ERROR_MESSAGE = "Please fix the highlighted fields and try again";

interface SubmitProjectValidationSuccess {
  success: true;
  data: SubmitProjectInput;
}

interface SubmitProjectValidationFailure {
  success: false;
  result: SubmitProjectResult;
}

const buildValidationErrorResult = (error: z.ZodError): SubmitProjectResult => {
  const fieldErrors = buildProjectFieldErrors(error);
  const firstFieldError = Object.values(fieldErrors).flat()[0];

  return {
    success: false,
    error: firstFieldError || VALIDATION_ERROR_MESSAGE,
    fieldErrors,
  };
};

export async function validateAndNormalizeSubmitProjectInput(
  formData: FormData,
  activeCategoryNames: readonly string[],
): Promise<SubmitProjectValidationSuccess | SubmitProjectValidationFailure> {
  const rawInput = readProjectFormData(formData);
  const schema = buildProjectSubmissionSchema(activeCategoryNames);
  const parsedInput = schema.safeParse(rawInput);

  if (!parsedInput.success) {
    return {
      success: false,
      result: buildValidationErrorResult(parsedInput.error),
    };
  }

  return {
    success: true,
    data: parsedInput.data,
  };
}

const getFaviconOrDefault = async (websiteUrl: string): Promise<string> => {
  if (!websiteUrl) {
    return DEFAULT_FAVICON;
  }

  try {
    return await fetchFavicon(websiteUrl);
  } catch {
    return DEFAULT_FAVICON;
  }
};

const cleanupProvisionalUploadByKey = async (
  imageKey: string | null | undefined,
): Promise<ProvisionalUploadCleanupResult> => {
  const normalizedKey = imageKey?.trim();

  if (!normalizedKey) {
    return {
      success: true,
      deletedCount: 0,
    };
  }

  try {
    const { deleteUploadthingFiles } = await import("../uploadthing");
    return await deleteUploadthingFiles(normalizedKey);
  } catch {
    return {
      success: false,
      deletedCount: 0,
    };
  }
};

const cleanupProvisionalUploadByKeys = async (
  imageKeys: string[] | null | undefined,
): Promise<ProvisionalUploadCleanupResult> => {
  if (!imageKeys || imageKeys.length === 0) {
    return {
      success: true,
      deletedCount: 0,
    };
  }

  const normalizedKeys = imageKeys.map((key) => key?.trim()).filter(Boolean) as string[];

  if (normalizedKeys.length === 0) {
    return {
      success: true,
      deletedCount: 0,
    };
  }

  try {
    const { deleteUploadthingFiles } = await import("../uploadthing");
    return await deleteUploadthingFiles(normalizedKeys);
  } catch {
    return {
      success: false,
      deletedCount: 0,
    };
  }
};

const revalidateProjectCreationPaths = (slug: string) => {
  revalidatePath(PROJECT_LIST_PATH);
  revalidatePath(`/project/${slug}`);
};

const getActiveCategoryNames = async (): Promise<{ data: string[]; error: string | null }> => {
  const db = getDb();

  try {
    const data = await db
      .select({ name: categories.name })
      .from(categories)
      .where(eq(categories.isActive, true));

    return {
      data: data.map((category) => category.name).filter(Boolean),
      error: null,
    };
  } catch {
    return {
      data: [],
      error: "Unable to validate project category right now",
    };
  }
};

const resolveAuthorId = async (
  authenticatedUserId: string,
  providedUserId: string,
): Promise<string> => {
  const candidateUserId =
    providedUserId.trim() === authenticatedUserId ? providedUserId.trim() : authenticatedUserId;
  const db = getDb();
  const [profile] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, candidateUserId))
    .limit(1);

  return profile?.id || authenticatedUserId;
};

const insertProject = async (
  input: SubmitProjectInput,
  authorId: string,
  faviconUrl: string,
  slug: string,
) => {
  const db = getDb();
  return db
    .insert(projects)
    .values({
      title: input.title,
      description: input.description,
      category: input.category,
      websiteUrl: input.websiteUrl,
      imageUrls: input.imageUrls,
      imageKeys: input.imageKeys,
      tagline: input.tagline || null,
      faviconUrl: faviconUrl,
      authorId: authorId,
      tags: input.tags,
      slug,
    })
    .returning({ slug: projects.slug });
};

const isSlugConflict = (error: unknown): boolean => {
  const pgError = error as { code?: string; message?: string };
  return pgError?.code === "23505" && pgError.message?.includes("slug") === true;
};

const createProjectWithRetry = async (
  input: SubmitProjectInput,
  authorId: string,
  faviconUrl: string,
): Promise<SubmitProjectResult> => {
  const baseSlug = slugifyTitle(input.title);
  const slug = await ensureUniqueSlug(baseSlug);

  try {
    const initialInsert = await insertProject(input, authorId, faviconUrl, slug);
    return { success: true, slug: initialInsert[0]?.slug || slug };
  } catch (error) {
    if (!isSlugConflict(error)) {
      const pgError = error as { message?: string };
      return { success: false, error: pgError.message || UNEXPECTED_ERROR_MESSAGE };
    }
  }

  const retrySlug = await ensureUniqueSlug(baseSlug);

  try {
    const retryInsert = await insertProject(input, authorId, faviconUrl, retrySlug);
    return { success: true, slug: retryInsert[0]?.slug || retrySlug };
  } catch (error) {
    const pgError = error as { message?: string };
    return { success: false, error: pgError.message || UNEXPECTED_ERROR_MESSAGE };
  }
};

export async function cleanupProjectProvisionalUpload(
  imageKey: string,
): Promise<ProvisionalUploadCleanupResult> {
  const session = await getServerSession();

  if (!session?.user) {
    return {
      success: false,
      deletedCount: 0,
    };
  }

  return cleanupProvisionalUploadByKey(imageKey);
}

export async function cleanupReplacedProjectProvisionalUpload(
  previousImageKey: string,
  nextImageKey: string,
): Promise<ProvisionalUploadCleanupResult> {
  const session = await getServerSession();

  if (!session?.user) {
    return {
      success: false,
      deletedCount: 0,
    };
  }

  const normalizedPreviousKey = previousImageKey.trim();
  const normalizedNextKey = nextImageKey.trim();

  if (!normalizedPreviousKey || normalizedPreviousKey === normalizedNextKey) {
    return {
      success: true,
      deletedCount: 0,
    };
  }

  return cleanupProvisionalUploadByKey(normalizedPreviousKey);
}
export async function editProject(projectSlug: string, formData: FormData) {
  if (!projectSlug || typeof projectSlug !== "string" || projectSlug.trim() === "") {
    return { success: false, error: "Project slug is required" };
  }

  const projectIdStr = await getProjectIdBySlug(projectSlug.trim());
  if (!projectIdStr) {
    return { success: false, error: "Project not found" };
  }

  const projectId = Number(projectIdStr);
  if (!Number.isInteger(projectId)) {
    return { success: false, error: "Project not found" };
  }

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be logged in to edit projects" };
  }

  const db = getDb();

  try {
    const [project] = await db
      .select({ authorId: projects.authorId })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (project.authorId !== user.id) {
      return { success: false, error: "You can only edit your own projects" };
    }

    const rawInput = readProjectFormData(formData);
    const activeCategories = await getActiveCategoryNames();
    const activeCategoryNames = activeCategories.error ? [] : activeCategories.data;
    const validation = buildProjectSubmissionSchema(activeCategoryNames).safeParse(rawInput);

    if (!validation.success) {
      return buildValidationErrorResult(validation.error);
    }

    const input = validation.data;
    let faviconUrl: string | undefined;
    if (input.websiteUrl) {
      try {
        faviconUrl = await fetchFavicon(input.websiteUrl);
      } catch (e) {
        console.warn("Failed to fetch favicon, keeping existing", e);
      }
    }

    await db
      .update(projects)
      .set({
        title: input.title,
        description: input.description,
        category: input.category,
        websiteUrl: input.websiteUrl,
        imageUrls: input.imageUrls,
        imageKeys: input.imageKeys,
        tagline: input.tagline,
        ...(faviconUrl && { faviconUrl }),
        tags: input.tags,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    revalidatePath(`/project/${projectSlug}`);
    revalidatePath("/project/list");

    return { success: true, slug: projectSlug };
  } catch (error) {
    console.error("Edit project error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function deleteProject(projectSlug: string) {
  if (!projectSlug || typeof projectSlug !== "string" || projectSlug.trim() === "") {
    return { success: false, error: "Project slug is required" };
  }

  const projectIdStr = await getProjectIdBySlug(projectSlug.trim());
  if (!projectIdStr) {
    return { success: false, error: "Project not found" };
  }

  const projectId = Number(projectIdStr);
  if (!Number.isInteger(projectId)) {
    return { success: false, error: "Project not found" };
  }

  let user;
  try {
    user = await requireUser();
  } catch {
    return { success: false, error: "You must be logged in to delete projects" };
  }

  const db = getDb();

  try {
    const [project] = await db
      .select({ authorId: projects.authorId, imageKeys: projects.imageKeys })
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    if (project.authorId !== user.id) {
      return { success: false, error: "You can only delete your own projects" };
    }

    await Promise.all([
      db.delete(comments).where(eq(comments.projectId, projectId)),
      db.delete(likes).where(eq(likes.projectId, projectId)),
      db.delete(views).where(eq(views.projectId, projectId)),
    ]);

    await db.delete(projects).where(eq(projects.id, projectId));

    if (project.imageKeys?.length) {
      try {
        const { deleteUploadthingFiles } = await import("../uploadthing");
        await deleteUploadthingFiles(project.imageKeys);
      } catch {
        console.warn("Failed to cleanup uploaded images for deleted project:", projectSlug);
      }
    }

    revalidatePath("/project/list");
    revalidatePath(`/project/${projectSlug}`);

    console.log("[Delete Project] Successfully deleted project with slug:", projectSlug);
    return { success: true };
  } catch (error) {
    console.error("Delete project error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function submitProject(
  formData: FormData,
  userId: string,
): Promise<SubmitProjectResult> {
  let provisionalImageKeys: string[] = [];

  try {
    const session = await getServerSession();

    if (!session?.user) {
      return { success: false, error: "You must be logged in to submit projects" };
    }

    const activeCategories = await getActiveCategoryNames();
    if (activeCategories.error) {
      return { success: false, error: activeCategories.error };
    }

    const validationResult = await validateAndNormalizeSubmitProjectInput(
      formData,
      activeCategories.data,
    );
    if (!validationResult.success) {
      return validationResult.result;
    }

    const input = validationResult.data;
    provisionalImageKeys = input.imageKeys;

    const [faviconUrl, authorId] = await Promise.all([
      getFaviconOrDefault(input.websiteUrl ?? ""),
      resolveAuthorId(session.user.id, userId),
    ]);

    const result = await createProjectWithRetry(input, authorId, faviconUrl);
    if (!result.success || !result.slug) {
      await cleanupProvisionalUploadByKeys(input.imageKeys);
      return result;
    }

    revalidateProjectCreationPaths(result.slug);
    return result;
  } catch {
    await cleanupProvisionalUploadByKeys(provisionalImageKeys);
    return { success: false, error: UNEXPECTED_ERROR_MESSAGE };
  }
}
