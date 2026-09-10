import { PracticeAttempt } from "../entities/PracticeAttempt";

export interface AttemptRepository {
  findById(id: string): Promise<PracticeAttempt | null>;

  findByProblemId(
    problemId: string,
  ): Promise<PracticeAttempt[]>;

  save(attempt: PracticeAttempt): Promise<void>;
}