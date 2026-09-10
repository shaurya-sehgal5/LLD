import { Submission } from "../entities/Submission";

export interface SubmissionRepository {
  findById(id: string): Promise<Submission | null>;
  findByAttemptId(attemptId: string): Promise<Submission | null>;
  save(submission: Submission): Promise<void>;
}
