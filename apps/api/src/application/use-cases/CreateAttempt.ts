import { randomUUID } from "crypto";
import { PracticeAttempt } from "../../domain/entities/PracticeAttempt";
import { AttemptRepository } from "../../domain/interfaces/AttemptRepository";
import { ProblemRepository } from "../../domain/interfaces/ProblemRepository";
import { DomainError } from "../../domain/errors/DomainError";

export interface CreateAttemptInput {
  problemId: string;
  previousAttemptId?: string | null;
}

export class CreateAttempt {
  constructor(
    private readonly problemRepository: ProblemRepository,
    private readonly attemptRepository: AttemptRepository,
  ) {}

  async execute(input: CreateAttemptInput): Promise<PracticeAttempt> {
    const problem = await this.problemRepository.findById(input.problemId);

    if (!problem) {
      throw new DomainError("Problem not found");
    }

    if (input.previousAttemptId) {
      const previousAttempt = await this.attemptRepository.findById(
        input.previousAttemptId,
      );

      if (!previousAttempt) {
        throw new DomainError("Previous attempt not found");
      }

      if (previousAttempt.problemId !== input.problemId) {
        throw new DomainError(
          "Retry attempt must belong to the same problem",
        );
      }
    }

    const attempt = PracticeAttempt.create({
      id: randomUUID(),
      problemId: input.problemId,
      previousAttemptId: input.previousAttemptId,
    });

    await this.attemptRepository.save(attempt);

    return attempt;
  }
}
