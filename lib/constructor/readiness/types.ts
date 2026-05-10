export type QualityStatus = "good" | "warning" | "danger" | "neutral";

export type SectionQuality = {
  key: string;
  label: string;
  status: QualityStatus;
  detail: string;
};

export type FieldQualityHintValue = {
  status: QualityStatus;
  text: string;
};

export type BaseReadiness = {
  completionPercent: number;
  overallStatus: QualityStatus;
  overallLabel: string;
  nextAction: string;
  sections: SectionQuality[];
  fieldHints: Record<string, FieldQualityHintValue>;
};

export type ConstructorOverallProgress = {
  percent: number;
  completedSteps: number;
  totalSteps: number;
  label: string;
};

