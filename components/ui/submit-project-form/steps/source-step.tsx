import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface SourceStepProps {
  mounted: boolean;
  githubRepoUrl: string;
  setGithubRepoUrl: (value: string) => void;
  isLoading: boolean;
  isUploading: boolean;
  isImporting: boolean;
  onImport: () => void;
}

export function SourceStep({
  mounted,
  githubRepoUrl,
  setGithubRepoUrl,
  isLoading,
  isUploading,
  isImporting,
  onImport,
}: SourceStepProps) {
  if (!mounted) return null;

  return (
    <div className="space-y-4" data-testid="github-import">
      <div className="space-y-2">
        <Label htmlFor="github_repo" className="text-lg font-medium">
          Import from GitHub
        </Label>
        <p className="text-sm text-muted-foreground">
          Save time by importing project details from your repository.
        </p>
        <div className="flex gap-2 mt-4">
          <Input
            id="github_repo"
            placeholder="owner/repo or https://github.com/owner/repo"
            className="flex-1"
            value={githubRepoUrl}
            onChange={(e) => setGithubRepoUrl(e.target.value)}
            disabled={isLoading || isUploading || isImporting}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={onImport}
            disabled={isLoading || isUploading || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          We&apos;ll pull name, description, homepage, tags, and preview. You can manually edit
          these in the next steps.
        </p>
      </div>
    </div>
  );
}
