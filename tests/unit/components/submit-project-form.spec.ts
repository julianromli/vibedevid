import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { SubmitProjectForm } from "@/components/ui/submit-project-form";
import type { BasicsStepProps } from "@/components/ui/submit-project-form/steps/basics-step";
import type { LinksMediaStepProps } from "@/components/ui/submit-project-form/steps/links-media-step";

const h = vi.hoisted(() => ({
  submitProjectFn: vi.fn(),
  cleanupProjectProvisionalUploadFn: vi.fn(),
  navigate: vi.fn(),
  back: vi.fn(),
}));

vi.mock("@/lib/actions/projects.functions", () => ({
  submitProjectFn: h.submitProjectFn,
  cleanupProjectProvisionalUploadFn: h.cleanupProjectProvisionalUploadFn,
}));

vi.mock("@/lib/navigation", () => ({
  useRouter: () => ({ navigate: h.navigate, back: h.back }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@unpic/react", () => ({
  Image: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement("img", props),
}));

// The step UIs (Radix select, UploadThing button) are replaced with buttons that
// call the same props the real steps call. The form logic under test is real.
vi.mock("@/components/ui/submit-project-form/steps/source-step", () => ({
  SourceStep: () => React.createElement("div", null, "source step"),
}));

vi.mock("@/components/ui/submit-project-form/steps/basics-step", () => ({
  BasicsStep: (props: BasicsStepProps) =>
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          props.setTitle("Vibe Board");
          props.setTagline("A board for vibe coders");
          props.setDescription("A tiny board where vibe coders share what they ship every week.");
          props.setCategory("web-app");
        },
      },
      "fill basics",
    ),
}));

const VERIFIED = {
  key: "file-key-1",
  url: "https://app123.ufs.sh/f/file-key-1",
};

vi.mock("@/components/ui/submit-project-form/steps/links-media-step", () => ({
  LinksMediaStep: (props: LinksMediaStepProps) =>
    React.createElement(
      "div",
      null,
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            props.setSelectedTags([{ value: "react", label: "React" }]);
            props.onUploadComplete([
              { serverData: VERIFIED, key: VERIFIED.key, url: VERIFIED.url },
            ]);
          },
        },
        "upload verified",
      ),
      React.createElement(
        "button",
        {
          type: "button",
          // onUploadComplete failed on the server, so UploadThing returns no serverData.
          onClick: () =>
            props.onUploadComplete([
              { serverData: undefined, key: "orphan-key", url: "https://utfs.io/f/orphan-key" },
            ]),
        },
        "upload unverified",
      ),
      React.createElement("span", null, `images:${props.uploadedImageUrls.length}`),
    ),
}));

const categories = [
  { id: "1", name: "web-app", display_name: "Web App", sort_order: 1, is_active: true },
];

function renderForm() {
  return render(
    React.createElement(SubmitProjectForm, {
      userId: "user-1",
      categories,
    }),
  );
}

function next() {
  fireEvent.click(screen.getByTestId("next-step-button"));
}

async function goToReview() {
  renderForm();
  next(); // source -> basics
  fireEvent.click(screen.getByText("fill basics"));
  next(); // basics -> links & media
  fireEvent.click(screen.getByText("upload verified"));
  next(); // links & media -> review
  await screen.findByTestId("submit-project-button");
}

beforeEach(() => {
  h.submitProjectFn.mockReset();
  h.cleanupProjectProvisionalUploadFn.mockReset();
  h.cleanupProjectProvisionalUploadFn.mockResolvedValue({ success: true });
  h.navigate.mockReset();
});

describe("SubmitProjectForm uploads", () => {
  it("rejects an upload the server never confirmed instead of failing later at submit", () => {
    renderForm();
    next();
    fireEvent.click(screen.getByText("fill basics"));
    next();

    fireEvent.click(screen.getByText("upload unverified"));

    expect(screen.getByText("images:0")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/could not be saved/i);
  });

  it("keeps a confirmed upload", () => {
    renderForm();
    next();
    fireEvent.click(screen.getByText("fill basics"));
    next();

    fireEvent.click(screen.getByText("upload verified"));

    expect(screen.getByText("images:1")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("SubmitProjectForm review step", () => {
  it("shows what will be submitted", async () => {
    await goToReview();

    expect(screen.getByText("Vibe Board")).toBeInTheDocument();
    expect(screen.getByText("A board for vibe coders")).toBeInTheDocument();
    expect(screen.getByText("Web App")).toBeInTheDocument();
    expect(screen.getByAltText("Screenshot 1")).toHaveAttribute("src", VERIFIED.url);
  });

  it("labels screenshot errors from the server in plain words", async () => {
    h.submitProjectFn.mockResolvedValue({
      success: false,
      error: "One or more screenshots are not valid uploads for your account",
      fieldErrors: {
        image_urls: ["One or more screenshots are not valid uploads for your account"],
      },
    });
    await goToReview();

    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-project-button"));
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/^Screenshots: /);
    expect(alert).not.toHaveTextContent("Image urls");
  });
});

describe("SubmitProjectForm submit", () => {
  it("does not send a second submit after the first one succeeded", async () => {
    h.submitProjectFn.mockResolvedValue({ success: true, slug: "vibe-board" });
    await goToReview();
    const submit = screen.getByTestId("submit-project-button");

    await act(async () => {
      fireEvent.click(submit);
    });
    await waitFor(() => expect(h.navigate).toHaveBeenCalledTimes(1));

    // Navigation to the project page can take a moment. The button must stay locked.
    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-project-button"));
    });

    expect(h.submitProjectFn).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("submit-project-button")).toBeDisabled();
  });

  it("ignores a fast double click", async () => {
    let resolve: (value: unknown) => void = () => {};
    h.submitProjectFn.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    await goToReview();
    const submit = screen.getByTestId("submit-project-button");

    await act(async () => {
      fireEvent.click(submit);
      fireEvent.click(submit);
    });
    await act(async () => {
      resolve({ success: true, slug: "vibe-board" });
    });

    expect(h.submitProjectFn).toHaveBeenCalledTimes(1);
  });
});
