import type { Category } from "@/lib/categories";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const MAX_TITLE_LENGTH = 120;
const MIN_TITLE_LENGTH = 3;
const MAX_TAGLINE_LENGTH = 160;
const MIN_TAGLINE_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 1600;
const MIN_DESCRIPTION_LENGTH = 30;

export interface BasicsStepProps {
  title: string;
  setTitle: (value: string) => void;
  tagline: string;
  setTagline: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: Category[];
  isLoading: boolean;
  isUploading: boolean;
}

export function BasicsStep({
  title,
  setTitle,
  tagline,
  setTagline,
  description,
  setDescription,
  category,
  setCategory,
  categories,
  isLoading,
  isUploading,
}: BasicsStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="form-label-enhanced">
          Project Title *
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="Enter your project title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input-enhanced"
          required
          disabled={isLoading || isUploading}
          maxLength={MAX_TITLE_LENGTH}
        />
        <div className="flex items-center justify-between text-sm">
          <p className="form-helper-text mt-1 text-xs">
            {title.trim().length === 0
              ? `Required. Minimum ${MIN_TITLE_LENGTH} characters.`
              : title.trim().length < MIN_TITLE_LENGTH
                ? `Needs ${MIN_TITLE_LENGTH - title.trim().length} more characters.`
                : title.length > MAX_TITLE_LENGTH
                  ? `Exceeds maximum ${MAX_TITLE_LENGTH} characters.`
                  : "Looking good! ✨"}
          </p>
          <span
            className={`font-medium text-xs ${title.length > MAX_TITLE_LENGTH || (title.length > 0 && title.trim().length < MIN_TITLE_LENGTH) ? "text-red-500" : "text-muted-foreground"}`}
          >
            {title.length}/{MAX_TITLE_LENGTH}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tagline" className="form-label-enhanced">
          Tagline
        </Label>
        <Input
          id="tagline"
          name="tagline"
          placeholder="A short tagline that describes your project in one sentence"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="form-input-enhanced"
          disabled={isLoading || isUploading}
          maxLength={MAX_TAGLINE_LENGTH}
        />
        <div className="flex items-center justify-between text-sm">
          <p className="form-helper-text mt-1 text-xs">
            {tagline.trim().length === 0
              ? `Optional. At least ${MIN_TAGLINE_LENGTH} characters if provided.`
              : tagline.trim().length < MIN_TAGLINE_LENGTH
                ? `Needs ${MIN_TAGLINE_LENGTH - tagline.trim().length} more characters.`
                : tagline.length > MAX_TAGLINE_LENGTH
                  ? `Exceeds maximum ${MAX_TAGLINE_LENGTH} characters.`
                  : "Looking good! ✨"}
          </p>
          <span
            className={`font-medium text-xs ${tagline.length > MAX_TAGLINE_LENGTH || (tagline.length > 0 && tagline.trim().length < MIN_TAGLINE_LENGTH) ? "text-amber-500" : "text-muted-foreground"}`}
          >
            {tagline.length}/{MAX_TAGLINE_LENGTH}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="form-label-enhanced">
          Description *
        </Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project, its features, and what makes it special"
          className="form-input-enhanced"
          rows={4}
          required
          disabled={isLoading || isUploading}
          maxLength={MAX_DESCRIPTION_LENGTH}
        />
        <div className="flex items-center justify-between text-sm">
          <p className="form-helper-text mt-1 text-xs">
            {description.trim().length === 0
              ? `Required. Explain your project (min ${MIN_DESCRIPTION_LENGTH} chars, max ${MAX_DESCRIPTION_LENGTH} chars).`
              : description.trim().length < MIN_DESCRIPTION_LENGTH
                ? `Needs ${MIN_DESCRIPTION_LENGTH - description.trim().length} more characters to reach the ${MIN_DESCRIPTION_LENGTH} minimum.`
                : description.length > MAX_DESCRIPTION_LENGTH
                  ? `Exceeds maximum ${MAX_DESCRIPTION_LENGTH} characters.`
                  : "Looking good! ✨"}
          </p>
          <span
            className={`font-medium text-xs ${description.length > MAX_DESCRIPTION_LENGTH || (description.length > 0 && description.trim().length < MIN_DESCRIPTION_LENGTH) ? "text-amber-500" : description.length > 1500 ? "text-amber-500" : "text-muted-foreground"}`}
          >
            {description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category" className="form-label-enhanced">
          Category *
        </Label>
        <Select
          name="category"
          required
          disabled={isLoading || isUploading}
          value={category}
          onValueChange={setCategory}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.display_name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-categories" disabled>
                No categories available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <p className="form-helper-text mt-1 text-xs text-muted-foreground">
          {!category
            ? "Required. Select a category that best fits your project."
            : categories.find((c) => c.name === category)?.description || "Looking good! ✨"}
        </p>
      </div>
    </div>
  );
}
