export interface ProblemRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
}

export interface ProblemRepository {
  findById(id: string): Promise<ProblemRecord | null>;
  findAll(): Promise<ProblemRecord[]>;
}
