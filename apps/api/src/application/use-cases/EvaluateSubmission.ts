import { DomainError } from "../../domain/errors/DomainError";
import { PracticeAttempt } from "../../domain/entities/PracticeAttempt";
import { AttemptRepository } from "../../domain/interfaces/AttemptRepository";
import {
  EvaluationResult,
  Evaluator,
} from "../../domain/interfaces/Evaluator";
import { EvaluationRepository } from "../../domain/interfaces/EvaluationRepository";
import { ProblemRepository } from "../../domain/interfaces/ProblemRepository";
import { SubmissionRepository } from "../../domain/interfaces/SubmissionRepository";

export interface EvaluateSubmissionResult {
  result: EvaluationResult;
  attempt: PracticeAttempt;
}

export class EvaluateSubmission {
  constructor(
    private readonly problemRepository: ProblemRepository,
    private readonly attemptRepository: AttemptRepository,
    private readonly submissionRepository: SubmissionRepository,
    private readonly evaluationRepository: EvaluationRepository,
    private readonly evaluator: Evaluator,
  ) {}

  async execute(
    submissionId: string,
  ): Promise<EvaluateSubmissionResult> {
    const submission =
      await this.submissionRepository.findById(submissionId);

    if (!submission) {
      throw new DomainError("Submission not found");
    }

    const attempt =
      await this.attemptRepository.findById(
        submission.attemptId,
      );

    if (!attempt) {
      throw new DomainError("Attempt not found");
    }

    const existingEvaluation =
      await this.evaluationRepository.findBySubmissionId(
        submissionId,
      );

    if (existingEvaluation) {
      return {
        result: existingEvaluation,
        attempt,
      };
    }

    const problem =
      await this.problemRepository.findById(
        attempt.problemId,
      );

    if (!problem) {
      throw new DomainError("Problem not found");
    }

    const previousEvaluations =
      await this.evaluationRepository.findPreviousByProblemId(
        attempt.problemId,
      );

    attempt.startEvaluation();
    await this.attemptRepository.save(attempt);

    try {
      const result = await this.evaluator.evaluate({
        problem,
        currentSubmission: submission,
        previousEvaluations,
      });

      await this.evaluationRepository.save(
        submissionId,
        result,
      );

      attempt.complete();
      await this.attemptRepository.save(attempt);

      return {
        result,
        attempt,
      };
    } catch (error) {
      attempt.fail();
      await this.attemptRepository.save(attempt);
      throw error;
    }
  }
}
