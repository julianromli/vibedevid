"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { checkUsernameAvailabilityFn, claimUsernameFn } from "@/lib/actions/onboarding.functions";
import {
  normalizeUsername,
  USERNAME_MAX_LENGTH,
  type UsernameError,
  validateUsername,
} from "@/lib/username";

export type UsernameState =
  | { kind: "hint" }
  | { kind: "invalid"; error: UsernameError }
  | { kind: "checking" }
  | { kind: "available"; username: string }
  | { kind: "taken"; username: string; suggestions: string[] }
  | { kind: "reserved"; username: string; suggestions: string[] }
  | { kind: "checkFailed" };

const DEBOUNCE_MS = 400;

/** Uppercase is lowered as you type. Other characters stay so the format error can explain them. */
export function lowerUsernameInput(value: string): string {
  return value.toLowerCase().slice(0, USERNAME_MAX_LENGTH);
}

export type UsernameCheckPlan =
  | { kind: "local"; state: UsernameState }
  | { kind: "remote"; username: string };

/**
 * What the live check does with a value. Reserved names go to the server like
 * taken ones so the answer comes back with free suggestions.
 */
export function planUsernameCheck(value: string, revealErrors: boolean): UsernameCheckPlan {
  const validation = validateUsername(value);
  if (validation.ok) return { kind: "remote", username: validation.username };
  if (validation.error === "reserved")
    return { kind: "remote", username: normalizeUsername(value) };
  return {
    kind: "local",
    state: revealErrors ? { kind: "invalid", error: validation.error } : { kind: "hint" },
  };
}

export function useUsernameClaim(input: { initialUsername: string; onClaimed: () => void }) {
  const [username, setUsername] = useState(input.initialUsername);
  const [state, setState] = useState<UsernameState>({ kind: "hint" });
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<"generic" | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const latest = useRef(username);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: existing function over the limit; split it in its own refactor
  const check = useCallback(async (value: string, revealErrors: boolean) => {
    abortRef.current?.abort();
    const plan = planUsernameCheck(value, revealErrors);
    if (plan.kind === "local") {
      setState(plan.state);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setState({ kind: "checking" });
    try {
      const result = await checkUsernameAvailabilityFn({
        data: { username: plan.username },
        signal: controller.signal,
      });
      if (controller.signal.aborted || latest.current !== value) return; // stale
      if (result.available) setState({ kind: "available", username: plan.username });
      else if (result.reason === "taken")
        setState({
          kind: "taken",
          username: plan.username,
          suggestions: result.suggestions ?? [],
        });
      else if (result.reason === "reserved")
        setState({
          kind: "reserved",
          username: plan.username,
          suggestions: result.suggestions ?? [],
        });
      else setState({ kind: "invalid", error: "invalid_chars" });
    } catch {
      if (controller.signal.aborted || latest.current !== value) return;
      setState({ kind: "checkFailed" });
    }
  }, []);

  // Debounced live check. The prefill is checked right away so a good suggestion shows as available.
  const isPrefill = username === input.initialUsername;
  useEffect(() => {
    latest.current = username;
    setSaveError(null);
    const reveal = showErrors || !isPrefill;
    const id = window.setTimeout(
      () => void check(username, reveal),
      isPrefill && !showErrors ? 0 : DEBOUNCE_MS,
    );
    return () => window.clearTimeout(id);
  }, [username, check, showErrors, isPrefill]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const change = useCallback((value: string) => setUsername(lowerUsernameInput(value)), []);

  const blur = useCallback(() => {
    if (username !== input.initialUsername) setShowErrors(true);
  }, [username, input.initialUsername]);

  const pickSuggestion = useCallback((value: string) => setUsername(value), []);

  /** Returns false when the view should focus the input. */
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: existing function over the limit; split it in its own refactor
  const submit = useCallback(async (): Promise<boolean> => {
    if (saving) return false;
    setShowErrors(true);
    const validation = validateUsername(username);
    if (!validation.ok) {
      if (validation.error === "reserved") {
        // Keep suggestions already shown; otherwise fetch them like a taken name.
        if (state.kind !== "reserved") void check(username, true);
      } else {
        setState({ kind: "invalid", error: validation.error });
      }
      return false;
    }
    if (state.kind === "taken" || state.kind === "reserved" || state.kind === "invalid")
      return false;

    setSaving(true);
    setSaveError(null);
    try {
      const result = await claimUsernameFn({ data: { username: validation.username } });
      if (result.ok || result.error === "already_claimed") {
        input.onClaimed();
        return true;
      }
      if (result.error === "taken") {
        setState({ kind: "taken", username: validation.username, suggestions: [] });
        void check(validation.username, true); // refresh suggestions
        return false;
      }
      if (result.error === "reserved") {
        setState({ kind: "reserved", username: validation.username, suggestions: [] });
        void check(validation.username, true); // fetch suggestions
        return false;
      }
      if (result.error === "unauthorized") {
        window.location.assign("/user/auth");
        return true;
      }
      if (
        result.error === "too_short" ||
        result.error === "too_long" ||
        result.error === "invalid_chars" ||
        result.error === "required"
      ) {
        setState({ kind: "invalid", error: result.error });
        return false;
      }
      setSaveError("generic");
      return false;
    } catch {
      setSaveError("generic");
      return false;
    } finally {
      setSaving(false);
    }
  }, [saving, username, state.kind, check, input]);

  return { username, state, saving, saveError, change, blur, pickSuggestion, submit };
}
