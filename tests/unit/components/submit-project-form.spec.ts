import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { SubmitProjectForm } from "@/components/ui/submit-project-form";
import { FieldFooter, fieldAria } from "@/components/ui/submit-project-form/field-parts";
import type { BasicsStepProps } from "@/components/ui/submit-project-form/steps/basics-step";
import type { LinksMediaStepProps } from "@/components/ui/submit-project-form/steps/links-media-step";
import i18n from "@/i18n";

const h = vi.hoisted(() => ({
  submitProjectFn: vi.fn(),
  cleanupProjectProvisionalUploadFn: vi.fn(),
  uploadFiles: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/lib/actions/projects.functions", () => ({
  submitProjectFn: h.submitProjectFn,
  cleanupProjectProvisionalUploadFn: h.cleanupProjectProvisionalUploadFn,
}));

vi.mock("@/lib/uploadthing-client", () => ({ uploadFiles: h.uploadFiles }));

vi.mock("@/lib/navigation", () => ({
  useRouter: () => ({ navigate: h.navigate, back: vi.fn() }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@unpic/react", () => ({
  Image: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement("img", props),
}));

// Basics and Links & media use Radix Select, cmdk, and file pickers that jsdom
// cannot drive. These stand-ins call the same props and render the same field
// ids and error parts. The form logic and the other steps are real.
vi.mock("@/components/ui/submit-project-form/steps/basics-step", () => ({
  BasicsStep: (props: BasicsStepProps) =>
    React.createElement(
      "div",
      null,
      React.createElement("input", {
        id: "title",
        "aria-label": "Project title",
        value: props.title,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => props.setTitle(e.target.value),
        onBlur: () => props.onFieldBlur("title"),
        ...fieldAria("title", props.errors),
      }),
      React.createElement(FieldFooter, { field: "title", error: props.errors.title }),
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
    ),
}));

vi.mock("@/components/ui/submit-project-form/steps/links-media-step", () => ({
  SCREENSHOTS_DROPZONE_ID: "screenshots-dropzone",
  LinksMediaStep: (props: LinksMediaStepProps) =>
    React.createElement(
      "div",
      null,
      React.createElement("input", { id: "website_url", "aria-label": "Website" }),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            props.setSelectedTags([{ value: "react", label: "React" }]);
            props.onAddFiles([new File([new Uint8Array(10)], "shot.png", { type: "image/png" })]);
          },
        },
        "add screenshot",
      ),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => props.setFaviconUrl("https://vibeboard.app/icon.png"),
        },
        "set favicon",
      ),
      React.createElement("button", { id: "screenshots-dropzone", type: "button" }, "dropzone"),
      React.createElement(
        "span",
        null,
        `shots:${props.shots.map((shot) => `${shot.source}-${shot.status}`).join(",")}`,
      ),
      props.uploadsBusyMessage && React.createElement("p", null, props.uploadsBusyMessage),
      React.createElement(FieldFooter, { field: "image_urls", error: props.errors.image_urls }),
    ),
}));

const UPLOADED = { key: "file-key-1", url: "https://app123.ufs.sh/f/file-key-1" };
const PREVIEW = "https://opengraph.githubassets.com/1/owner/vibe-board";

const categories = [
  { id: "1", name: "web-app", display_name: "Web App", sort_order: 1, is_active: true },
];

function renderForm() {
  return render(React.createElement(SubmitProjectForm, { userId: "user-1", categories }));
}

function next() {
  fireEvent.click(screen.getByTestId("next-step-button"));
}

async function addScreenshot() {
  await act(async () => {
    fireEvent.click(screen.getByText("add screenshot"));
  });
  await screen.findByText(/shots:.*upload-done/);
}

async function goToReview() {
  renderForm();
  next(); // source -> basics
  fireEvent.click(screen.getByText("fill basics"));
  next(); // basics -> links & media
  await addScreenshot();
  next(); // links & media -> review
  await screen.findByTestId("submit-project-button");
}

function mockImport(body: Record<string, unknown>) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function importRepo() {
  fireEvent.change(screen.getByLabelText("GitHub repository"), {
    target: { value: "owner/vibe-board" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Import" }));
  });
}

function sentFormData(): FormData {
  return h.submitProjectFn.mock.calls[0]?.[0]?.data as FormData;
}

beforeAll(async () => {
  await i18n.changeLanguage("en");
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
  h.submitProjectFn.mockReset();
  h.cleanupProjectProvisionalUploadFn.mockReset();
  h.cleanupProjectProvisionalUploadFn.mockResolvedValue({ success: true });
  h.uploadFiles.mockReset();
  h.uploadFiles.mockResolvedValue([{ ...UPLOADED, serverData: UPLOADED }]);
  h.navigate.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SubmitProjectForm step validation", () => {
  it("moves past Basics even when a Links & media field is invalid", async () => {
    mockImport({ website_url: "not a url" });
    renderForm();
    await importRepo(); // lands on Basics with a bad website from the import

    fireEvent.click(screen.getByText("fill basics"));
    next();

    expect(screen.getByRole("heading", { name: "Links and screenshots" })).toBeInTheDocument();
  });

  it("focuses an empty title on Next and clears the error once fixed", () => {
    renderForm();
    next();
    next();

    const title = screen.getByLabelText("Project title");
    expect(title).toHaveFocus();
    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(/Title needs 3 to 120 characters/);

    fireEvent.change(title, { target: { value: "Vibe Board" } });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(title).not.toHaveAttribute("aria-invalid");
  });

  it("shows no error on blur of an empty field", () => {
    renderForm();
    next();
    fireEvent.blur(screen.getByLabelText("Project title"));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("SubmitProjectForm import", () => {
  it("runs Import, not Next, on Enter in the repo input", async () => {
    const fetchMock = mockImport({ title: "Vibe Board" });
    renderForm();
    const repo = screen.getByLabelText("GitHub repository");
    fireEvent.change(repo, { target: { value: "owner/vibe-board" } });

    await act(async () => {
      fireEvent.keyDown(repo, { key: "Enter" });
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Project title")).toHaveValue("Vibe Board");
  });

  it("sends the imported preview first, as the cover", async () => {
    mockImport({ preview_image_url: PREVIEW });
    h.submitProjectFn.mockResolvedValue({ success: true, slug: "vibe-board" });
    renderForm();
    await importRepo();
    fireEvent.click(screen.getByText("fill basics"));
    next();
    await addScreenshot();
    next();

    await act(async () => {
      fireEvent.click(await screen.findByTestId("submit-project-button"));
    });

    expect(JSON.parse(String(sentFormData().get("image_urls")))).toEqual([PREVIEW, UPLOADED.url]);
    expect(JSON.parse(String(sentFormData().get("image_keys")))).toEqual([UPLOADED.key]);
  });
});

describe("SubmitProjectForm uploads", () => {
  it("holds Next while a screenshot is still uploading", async () => {
    h.uploadFiles.mockReturnValue(new Promise(() => {}));
    renderForm();
    next();
    fireEvent.click(screen.getByText("fill basics"));
    next();
    await act(async () => {
      fireEvent.click(screen.getByText("add screenshot"));
    });
    await screen.findByText(/shots:upload-uploading/);

    next();

    expect(screen.getByText("Wait for uploads to finish before continuing.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Links and screenshots" })).toBeInTheDocument();
  });
});

describe("SubmitProjectForm review step", () => {
  it("shows what will be submitted", async () => {
    await goToReview();

    expect(screen.getByText("Vibe Board")).toBeInTheDocument();
    expect(screen.getByText("A board for vibe coders")).toBeInTheDocument();
    expect(screen.getByText("Web App")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByAltText("Screenshot 1")).toHaveAttribute("src", UPLOADED.url);
  });

  it("goes back to Basics from Edit and focuses its first field", async () => {
    await goToReview();

    fireEvent.click(screen.getByRole("button", { name: "Edit Basics" }));

    expect(screen.getByLabelText("Project title")).toHaveFocus();
  });

  it("puts a server screenshot error under the screenshots field", async () => {
    const message = "One or more screenshots are not valid uploads for your account";
    h.submitProjectFn.mockResolvedValue({
      success: false,
      error: message,
      fieldErrors: { image_urls: [message] },
    });
    await goToReview();

    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-project-button"));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("heading", { name: "Links and screenshots" })).toBeInTheDocument();
    expect(screen.getByText("dropzone")).toHaveFocus();
  });

  it("shows a non-field server error in the banner and keeps the data", async () => {
    h.submitProjectFn.mockResolvedValue({ success: false, error: "Database is busy" });
    await goToReview();

    await act(async () => {
      fireEvent.click(screen.getByTestId("submit-project-button"));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Database is busy");
    expect(screen.getByText("Vibe Board")).toBeInTheDocument();
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
    expect(screen.getByTestId("submit-project-button")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("prev-step-button")).toBeDisabled();
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

  it("sends the favicon URL the user entered", async () => {
    h.submitProjectFn.mockResolvedValue({ success: true, slug: "vibe-board" });
    renderForm();
    next();
    fireEvent.click(screen.getByText("fill basics"));
    next();
    await addScreenshot();
    fireEvent.click(screen.getByText("set favicon"));
    next();
    await act(async () => {
      fireEvent.click(await screen.findByTestId("submit-project-button"));
    });

    expect(sentFormData().get("favicon_url")).toBe("https://vibeboard.app/icon.png");
  });
});
