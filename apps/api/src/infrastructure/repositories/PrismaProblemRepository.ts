import { ProblemRepository, ProblemRecord } from "../../domain/interfaces/ProblemRepository";
import { prisma } from "../database/prisma";

export class PrismaProblemRepository implements ProblemRepository {
  async findById(id: string): Promise<ProblemRecord | null> {
    return prisma.problem.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
      },
    });
  }

  async findAll(): Promise<ProblemRecord[]> {
    return prisma.problem.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }
}
