import { AttemptRepository } from "../../domain/interfaces/AttemptRepository";
import { CreateAttempt } from "./CreateAttempt";

export class RetryAttempt {
  constructor(
    private readonly attemptRepository: AttemptRepository,
    private readonly createAttempt: CreateAttempt,
  ) {}

  async execute(attemptId: string) {
    const previousAttempt = await this.attemptRepository.findById(attemptId);

    if (!previousAttempt) {
      throw new Error("Attempt not found");
    }

    return this.createAttempt.execute({
      problemId: previousAttempt.problemId,
      previousAttemptId: previousAttempt.id,
    });
  }
}
