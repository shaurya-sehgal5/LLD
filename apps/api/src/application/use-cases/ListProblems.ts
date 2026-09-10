import { ProblemRepository, ProblemRecord } from "../../domain/interfaces/ProblemRepository";

export class ListProblems {
  constructor(private readonly problemRepository: ProblemRepository) {}

  async execute(): Promise<ProblemRecord[]> {
    return this.problemRepository.findAll();
  }
}
