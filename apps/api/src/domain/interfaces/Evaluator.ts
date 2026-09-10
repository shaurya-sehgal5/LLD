import { ProblemRecord } from "./ProblemRepository";
import { Submission } from "../entities/Submission";

export interface EvaluationContext {
  problem: ProblemRecord;
  currentSubmission: Submission;
  previousEvaluations: EvaluationSummary[];
}

export interface EvaluationSummary {
  overallScore: number;
  topImprovements: string[];
}

export type EvaluationCriterion =
  | "REQUIREMENTS"
  | "RESPONSIBILITIES"
  | "ABSTRACTION"
  | "COUPLING"
  | "EXTENSIBILITY"
  | "EDGE_CASES";

export interface CriterionResult {
  criterion: EvaluationCriterion;
  score: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: number;
}

export interface EvaluationResult {
  criteria: CriterionResult[];
  overallScore: number;
  overallSummary: string;
  topImprovements: string[];
}

export interface Evaluator {
  evaluate(context: EvaluationContext): Promise<EvaluationResult>;
}
