const MIN_GUEST_NAME_LENGTH = 2;

export function guestCommentNameError(guestName: string | null | undefined): string | null {
  const name = guestName?.trim() ?? "";
  if (name.length < MIN_GUEST_NAME_LENGTH) {
    return "Enter your name to comment";
  }
  return null;
}
