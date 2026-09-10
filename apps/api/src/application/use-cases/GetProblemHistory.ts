import { AttemptRepository } from "../../domain/interfaces/AttemptRepository";
import { EvaluationRepository } from "../../domain/interfaces/EvaluationRepository";
import { ProblemRepository } from "../../domain/interfaces/ProblemRepository";
import { SubmissionRepository } from "../../domain/interfaces/SubmissionRepository";
import { DomainError } from "../../domain/errors/DomainError";

export class GetProblemHistory {
  constructor(
    private readonly problemRepository: ProblemRepository,
    private readonly attemptRepository: AttemptRepository,
    private readonly submissionRepository: SubmissionRepository,
    private readonly evaluationRepository: EvaluationRepository,
  ) {}

  async execute(problemId: string) {
    const problem =
      await this.problemRepository.findById(problemId);

    if (!problem) {
      throw new DomainError("Problem not found");
    }

    const attempts =
      await this.attemptRepository.findByProblemId(problemId);

    const history = await Promise.all(
      attempts.map(async (attempt) => {
        const submission =
          await this.submissionRepository.findByAttemptId(
            attempt.id,
          );

        const evaluation = submission
          ? await this.evaluationRepository.findBySubmissionId(
              submission.id,
            )
          : null;

        return {
          attempt: attempt.toJSON(),
          submission: submission?.data ?? null,
          evaluation,
        };
      }),
    );

    return {
      problem,
      attempts: history,
    };
  }
}