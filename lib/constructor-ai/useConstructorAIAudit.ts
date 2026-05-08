"use client";

import { useCallback, useState } from "react";
import { sendConstructorAIAuditEvent } from "./audit-client";
import type { ConstructorAISuggestion } from "./types";
import type { ConstructorAISuggestionAuditEvent } from "./audit-types";

type ConstructorAIAuditBaseInput = {
  step: ConstructorAISuggestionAuditEvent["step"];
  field?: string;
  screen: string;
  requestId?: string;
};

type SendSuggestionAuditInput = {
  suggestion: ConstructorAISuggestion;
  afterSummary?: string;
};

type UseConstructorAIAuditResult = {
  auditError: string | null;
  clearAuditError: () => void;
  sendAuditEvent: (event: ConstructorAISuggestionAuditEvent) => Promise<boolean>;
  auditSuggestionShown: (
    input: ConstructorAIAuditBaseInput & SendSuggestionAuditInput
  ) => Promise<boolean>;
  auditEmptyResult: (input: ConstructorAIAuditBaseInput) => Promise<boolean>;
  auditFailed: (
    input: ConstructorAIAuditBaseInput & { notes?: string }
  ) => Promise<boolean>;
  auditApplied: (input: ConstructorAIAuditBaseInput & SendSuggestionAuditInput) => void;
  auditDuplicate: (
    input: ConstructorAIAuditBaseInput & SendSuggestionAuditInput
  ) => void;
};

function buildMetadata(screen: string, notes?: string) {
  return {
    prototypeMode: true,
    screen,
    mock: true,
    ...(notes ? { notes } : {}),
  };
}

export function useConstructorAIAudit(): UseConstructorAIAuditResult {
  const [auditError, setAuditError] = useState<string | null>(null);

  const clearAuditError = useCallback(() => {
    setAuditError(null);
  }, []);

  const sendAuditEvent = useCallback(
    async (event: ConstructorAISuggestionAuditEvent) => {
      const response = await sendConstructorAIAuditEvent(event);

      if (!response.ok) {
        setAuditError(response.error ?? "No se pudo registrar auditoría IA mock.");
        return false;
      }

      setAuditError(null);
      return true;
    },
    []
  );

  const auditSuggestionShown = useCallback(
    async ({
      suggestion,
      step,
      field,
      screen,
      requestId = "mock-constructor-assist",
    }: ConstructorAIAuditBaseInput & SendSuggestionAuditInput) => {
      return sendAuditEvent({
        eventType: "suggestion_shown",
        suggestionId: suggestion.id,
        source: suggestion.source,
        step,
        field,
        targetStep: suggestion.targetStep,
        targetField: suggestion.targetField,
        suggestionType: suggestion.type,
        severity: suggestion.severity,
        confidence: suggestion.confidence,
        action: "shown",
        result: "success",
        requestId,
        metadata: buildMetadata(screen),
      });
    },
    [sendAuditEvent]
  );

  const auditEmptyResult = useCallback(
    async ({
      step,
      field,
      screen,
      requestId = "mock-constructor-assist",
    }: ConstructorAIAuditBaseInput) => {
      return sendAuditEvent({
        eventType: "suggestion_empty_result",
        source: "mock",
        step,
        field,
        action: "empty_result",
        result: "noop",
        requestId,
        metadata: buildMetadata(screen),
      });
    },
    [sendAuditEvent]
  );

  const auditFailed = useCallback(
    async ({
      step,
      field,
      screen,
      requestId = "mock-constructor-assist",
      notes,
    }: ConstructorAIAuditBaseInput & { notes?: string }) => {
      return sendAuditEvent({
        eventType: "suggestion_failed",
        source: "mock",
        step,
        field,
        action: "failed",
        result: "error",
        requestId,
        metadata: buildMetadata(screen, notes),
      });
    },
    [sendAuditEvent]
  );

  const auditApplied = useCallback(
    ({
      suggestion,
      step,
      field,
      screen,
      requestId = "mock-constructor-assist",
      afterSummary,
    }: ConstructorAIAuditBaseInput & SendSuggestionAuditInput) => {
      void sendAuditEvent({
        eventType: "suggestion_applied",
        suggestionId: suggestion.id,
        source: suggestion.source,
        step,
        field,
        targetStep: suggestion.targetStep,
        targetField: suggestion.targetField,
        suggestionType: suggestion.type,
        severity: suggestion.severity,
        confidence: suggestion.confidence,
        action: "applied",
        result: "success",
        requestId,
        afterSummary,
        metadata: buildMetadata(screen),
      });
    },
    [sendAuditEvent]
  );

  const auditDuplicate = useCallback(
    ({
      suggestion,
      step,
      field,
      screen,
      requestId = "mock-constructor-assist",
      afterSummary,
    }: ConstructorAIAuditBaseInput & SendSuggestionAuditInput) => {
      void sendAuditEvent({
        eventType: "suggestion_duplicate",
        suggestionId: suggestion.id,
        source: suggestion.source,
        step,
        field,
        targetStep: suggestion.targetStep,
        targetField: suggestion.targetField,
        suggestionType: suggestion.type,
        severity: suggestion.severity,
        confidence: suggestion.confidence,
        action: "duplicate",
        result: "noop",
        requestId,
        afterSummary,
        metadata: buildMetadata(screen),
      });
    },
    [sendAuditEvent]
  );

  return {
    auditError,
    clearAuditError,
    sendAuditEvent,
    auditSuggestionShown,
    auditEmptyResult,
    auditFailed,
    auditApplied,
    auditDuplicate,
  };
}
