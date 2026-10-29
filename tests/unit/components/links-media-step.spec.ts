import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vite-plus/test";
import {
  LinksMediaStep,
  type LinksMediaStepProps,
} from "@/components/ui/submit-project-form/steps/links-media-step";
import i18n from "@/i18n";
import type { Shot } from "@/lib/project-screenshots";

vi.mock("@unpic/react", () => ({
  Image: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement("img", props),
}));

function shot(overrides: Partial<Shot>): Shot {
  return {
    id: "a",
    source: "upload",
    status: "done",
    previewUrl: "blob:a",
    url: "https://app.ufs.sh/f/a",
    key: "a",
    progress: 100,
    ...overrides,
  };
}

function renderStep(overrides: Partial<LinksMediaStepProps> = {}) {
  const props: LinksMediaStepProps = {
    websiteUrl: "",
    setWebsiteUrl: vi.fn(),
    faviconUrl: "",
    setFaviconUrl: vi.fn(),
    selectedTags: [],
    setSelectedTags: vi.fn(),
    shots: [],
    uploadNotice: null,
    uploadsBusyMessage: null,
    onAddFiles: vi.fn(),
    onRetryShot: vi.fn(),
    onRemoveShot: vi.fn(),
    onMakeCover: vi.fn(),
    onMoveShot: vi.fn(),
    errors: {},
    onFieldBlur: vi.fn(),
    disabled: false,
    ...overrides,
  };
  render(React.createElement(LinksMediaStep, props));
  return props;
}

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

describe("LinksMediaStep screenshots", () => {
  it("offers Retry on a failed tile and marks the first tile as cover", () => {
    const props = renderStep({
      shots: [
        shot({ id: "gh", source: "github", key: undefined }),
        shot({ id: "b", status: "error", url: undefined, error: "Upload failed." }),
      ],
    });

    expect(screen.getByRole("group", { name: "Screenshots (2 of 10)" })).toBeInTheDocument();
    expect(screen.getByText("Cover")).toBeInTheDocument();
    expect(screen.getByText("From GitHub")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed.");

    fireEvent.click(screen.getByRole("button", { name: "Retry screenshot 2" }));
    expect(props.onRetryShot).toHaveBeenCalledWith("b");

    fireEvent.click(screen.getByRole("button", { name: "Make screenshot 1 the cover" }));
    expect(props.onMakeCover).not.toHaveBeenCalled();
  });

  it("opens the file picker from a keyboard-reachable dropzone button", () => {
    renderStep();
    const input = screen.getByTestId("screenshot-file-input") as HTMLInputElement;
    const click = vi.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: /Drop screenshots here/ }));

    expect(click).toHaveBeenCalled();
  });
});
