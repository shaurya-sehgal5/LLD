import { randomUUID } from "crypto";
import { PracticeAttempt } from "../../domain/entities/PracticeAttempt";
import { Submission } from "../../domain/entities/Submission";
import { AttemptRepository } from "../../domain/interfaces/AttemptRepository";
import { SubmissionRepository } from "../../domain/interfaces/SubmissionRepository";
import { DomainError } from "../../domain/errors/DomainError";
import { SubmissionValidator } from "../services/SubmissionValidator";

export interface SubmitAttemptInput {
  attemptId: string;
  requirementsAndAssumptions: string;
  classesAndInterfaces: string;
  responsibilities: string;
  relationships: string;
  rationale: string;
  tradeoffs: string;
  edgeCases: string;
  codeSnippet?: string | null;
}

export class SubmitAttempt {
  constructor(
    private readonly attemptRepository: AttemptRepository,
    private readonly submissionRepository: SubmissionRepository,
    private readonly submissionValidator: SubmissionValidator,
  ) { }

  async execute(input: SubmitAttemptInput): Promise<{
    attempt: PracticeAttempt;
    submission: Submission;
  }> {
    const validation = this.submissionValidator.validate(input);

    if (!validation.valid) {
      throw new DomainError(
        `Submission validation failed: ${validation.errors.join("; ")}`,
      );
    }

    const attempt = await this.attemptRepository.findById(input.attemptId);

    if (!attempt) {
      throw new DomainError("Attempt not found");
    }

    const existingSubmission =
      await this.submissionRepository.findByAttemptId(input.attemptId);

    if (existingSubmission) {
      throw new DomainError("Attempt already has a submission");
    }
    const submission = Submission.create({
      id: randomUUID(),
      attemptId: input.attemptId,
      requirementsAndAssumptions: input.requirementsAndAssumptions,
      classesAndInterfaces: input.classesAndInterfaces,
      responsibilities: input.responsibilities,
      relationships: input.relationships,
      rationale: input.rationale,
      tradeoffs: input.tradeoffs,
      edgeCases: input.edgeCases,
      codeSnippet: input.codeSnippet,
    });

    attempt.submit();

    await this.submissionRepository.save(submission);
    await this.attemptRepository.save(attempt);

    return {
      attempt,
      submission,
    };
  }
}
