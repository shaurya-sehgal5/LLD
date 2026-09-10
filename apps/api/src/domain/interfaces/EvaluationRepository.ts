import {
  EvaluationResult,
  EvaluationSummary,
} from "./Evaluator";

export interface EvaluationRepository {
  existsForSubmission(submissionId: string): Promise<boolean>;

  save(
    submissionId: string,
    result: EvaluationResult,
  ): Promise<void>;

  findBySubmissionId(
    submissionId: string,
  ): Promise<EvaluationResult | null>;

  findPreviousByProblemId(
    problemId: string,
  ): Promise<EvaluationSummary[]>;
}
