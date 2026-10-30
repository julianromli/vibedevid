import { useTranslation } from "react-i18next";
import { authInputClassName, fieldClassName } from "@/components/ui/form-classes";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CharCounter,
  FieldFooter,
  FieldLabel,
  type FieldStepProps,
  fieldAria,
} from "@/components/ui/submit-project-form/field-parts";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/lib/categories";
import { PROJECT_LIMITS } from "@/lib/project-submission";
import { cn } from "@/lib/utils";

const { MAX_TITLE_LENGTH, MAX_TAGLINE_LENGTH, MAX_DESCRIPTION_LENGTH } = PROJECT_LIMITS;

export interface BasicsStepProps extends FieldStepProps {
  title: string;
  setTitle: (value: string) => void;
  tagline: string;
  setTagline: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  categories: Category[];
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
  errors,
  onFieldBlur,
  disabled,
}: BasicsStepProps) {
  const { t } = useTranslation("projectSubmit");

  return (
    <div className="space-y-6">
      <div>
        <FieldLabel htmlFor="title">{t("form.projectTitle")}</FieldLabel>
        <Input
          id="title"
          name="title"
          placeholder={t("form.projectTitlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => onFieldBlur("title")}
          autoComplete="off"
          maxLength={MAX_TITLE_LENGTH}
          className={cn(authInputClassName, "mt-2")}
          aria-required="true"
          enterKeyHint="next"
          disabled={disabled}
          {...fieldAria("title", errors)}
        />
        <FieldFooter
          field="title"
          hint={t("form.titleHint")}
          error={errors.title}
          counter={<CharCounter value={title} max={MAX_TITLE_LENGTH} />}
        />
      </div>

      <div>
        <FieldLabel htmlFor="tagline" optional>
          {t("form.tagline")}
        </FieldLabel>
        <Input
          id="tagline"
          name="tagline"
          placeholder={t("form.taglinePlaceholder")}
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          onBlur={() => onFieldBlur("tagline")}
          maxLength={MAX_TAGLINE_LENGTH}
          className={cn(authInputClassName, "mt-2")}
          enterKeyHint="next"
          disabled={disabled}
          {...fieldAria("tagline", errors)}
        />
        <FieldFooter
          field="tagline"
          hint={t("form.taglineHint")}
          error={errors.tagline}
          counter={<CharCounter value={tagline} max={MAX_TAGLINE_LENGTH} />}
        />
      </div>

      <div>
        <FieldLabel htmlFor="description">{t("form.description")}</FieldLabel>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => onFieldBlur("description")}
          maxLength={MAX_DESCRIPTION_LENGTH}
          placeholder={t("form.descriptionPlaceholder")}
          className={cn(authInputClassName, "mt-2 h-auto min-h-32 py-3")}
          rows={5}
          aria-required="true"
          disabled={disabled}
          {...fieldAria("description", errors)}
        />
        <FieldFooter
          field="description"
          hint={t("form.descriptionHint")}
          error={errors.description}
          counter={<CharCounter value={description} max={MAX_DESCRIPTION_LENGTH} />}
        />
      </div>

      <div>
        <FieldLabel htmlFor="category">{t("form.category")}</FieldLabel>
        <Select name="category" disabled={disabled} value={category} onValueChange={setCategory}>
          <SelectTrigger
            id="category"
            className={cn(
              fieldClassName,
              authInputClassName,
              "mt-2 w-full data-[size=default]:h-12",
            )}
            aria-required="true"
            {...fieldAria("category", errors, false)}
          >
            <SelectValue placeholder={t("form.selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name} className="min-h-11 sm:min-h-8">
                  {cat.display_name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="no-categories" disabled>
                {t("form.noCategories")}
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <FieldFooter field="category" error={errors.category} />
      </div>
    </div>
  );
}
