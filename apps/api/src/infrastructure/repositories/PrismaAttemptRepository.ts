import { AttemptStatus } from "../../domain/enums/AttemptStatus";
import { PracticeAttempt } from "../../domain/entities/PracticeAttempt";
import { AttemptRepository } from "../../domain/interfaces/AttemptRepository";
import { prisma } from "../database/prisma";

export class PrismaAttemptRepository implements AttemptRepository {
  async findById(id: string): Promise<PracticeAttempt | null> {
    const record = await prisma.practiceAttempt.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return PracticeAttempt.rehydrate({
      id: record.id,
      problemId: record.problemId,
      previousAttemptId: record.previousAttemptId,
      status: record.status as AttemptStatus,
      startedAt: record.startedAt,
      submittedAt: record.submittedAt,
      completedAt: record.completedAt,
    });
  }
  async findByProblemId(
    problemId: string,
  ): Promise<PracticeAttempt[]> {
    const attempts = await prisma.practiceAttempt.findMany({
      where: {
        problemId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return attempts.map((attempt) =>
      PracticeAttempt.rehydrate({
        id: attempt.id,
        problemId: attempt.problemId,
        previousAttemptId: attempt.previousAttemptId,
        status: attempt.status as AttemptStatus,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        completedAt: attempt.completedAt,
      }),
    );
  }
  async save(attempt: PracticeAttempt): Promise<void> {
    const data = attempt.toJSON();

    await prisma.practiceAttempt.upsert({
      where: {
        id: data.id,
      },
      create: {
        id: data.id,
        problemId: data.problemId,
        previousAttemptId: data.previousAttemptId,
        status: data.status,
        startedAt: data.startedAt,
        submittedAt: data.submittedAt,
        completedAt: data.completedAt,
      },
      update: {
        status: data.status,
        submittedAt: data.submittedAt,
        completedAt: data.completedAt,
      },
    });
  }
}
