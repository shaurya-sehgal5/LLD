import { ProblemRepository, ProblemRecord } from "../../domain/interfaces/ProblemRepository";
import { DomainError } from "../../domain/errors/DomainError";

export class GetProblem {
  constructor(private readonly problemRepository: ProblemRepository) {}

  async execute(problemId: string): Promise<ProblemRecord> {
    const problem = await this.problemRepository.findById(problemId);

    if (!problem) {
      throw new DomainError("Problem not found");
    }

    return problem;
  }
}
