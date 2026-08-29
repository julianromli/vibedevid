# 010 — Label guest comment name

- **Status**: DONE
- **Commit**: c829824
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Rule**: react-doctor/no-placeholder-only-field
- **Estimated scope**: 1 file, small

## Problem

`components/ui/comment-section.tsx:131` is a guest name field with only `placeholder="Your name"`. It shows on `/project/$slug` when `allowGuest={true}`. Placeholder text disappears during entry and is not a persistent label.

    // components/ui/comment-section.tsx:130 — current
    {!isLoggedIn && allowGuest && (
      <input
        type="text"
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
        placeholder="Your name"
        className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border p-3 focus:ring-2 focus:outline-none"
        maxLength={50}
      />
    )}

Canonical recipe:

    // candidate corrected pattern from the rule prompt
    <label htmlFor="email">Email</label>
    <input id="email" placeholder="Email address" type="email" />

Add a visible associated label. Keep the placeholder as a hint.

Run this after plan `011` (same file).

## Target

    // target
    {!isLoggedIn && allowGuest && (
      <div className="space-y-2">
        <Label htmlFor="guest-comment-name">Your name</Label>
        <input
          id="guest-comment-name"
          type="text"
          name="guestName"
          autoComplete="name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Alex"
          className="border-border bg-background text-foreground focus:ring-primary w-full rounded-lg border p-3 focus:ring-2 focus:outline-none"
          maxLength={50}
        />
      </div>
    )}

Import `Label` from `@/components/ui/label`. Do not use the placeholder as the only name.

## Repo conventions to follow

- Imitate `components/testimonial/testimonial-form.tsx:88` (`<Label htmlFor="fullName">` + `Input` with a distinct placeholder).
- Use the shared `Label` primitive. Do not invent a new label class.
- Keep `space-y-2` between label and field (same as the testimonial form).

## Steps

1. Import `Label` in `components/ui/comment-section.tsx`.
2. Wrap the guest name field with a visible label and a stable `id`.
3. Change the placeholder to an example (`Alex`), not a duplicate of the label.
4. Do not change submit logic (already handled in `011`).

## Boundaries

- Do NOT change the comment textarea in this plan unless you also add a visible label for it without changing behavior.
- Do NOT add dependencies.
- STOP if the guest field has drifted from commit `c829824` (or from `011` if that plan already landed).

## Verification

- **Mechanical**:
  - `npx react-doctor@latest --scope changed` clears `no-placeholder-only-field` at `comment-section.tsx`. Score does not drop.
  - `vp check` and `vp test`.
- **Behavior check**: Open a project while logged out. Confirm “Your name” stays visible while you type. Confirm a screen reader / a11y tree names the field “Your name”. Confirm submit still requires a name of length ≥ 2.
- **Done when**: the diagnostic is gone and the label stays on screen during entry.
