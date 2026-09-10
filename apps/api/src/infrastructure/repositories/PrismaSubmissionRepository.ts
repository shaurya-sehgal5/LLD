import { Submission } from "../../domain/entities/Submission";
import { SubmissionRepository } from "../../domain/interfaces/SubmissionRepository";
import { prisma } from "../database/prisma";

export class PrismaSubmissionRepository
  implements SubmissionRepository
{
  async findById(id: string): Promise<Submission | null> {
    const record = await prisma.submission.findUnique({
      where: { id },
    });

    if (!record) return null;

    return Submission.create({
      id: record.id,
      attemptId: record.attemptId,
      requirementsAndAssumptions:
        record.requirementsAndAssumptions,
      classesAndInterfaces: record.classesAndInterfaces,
      responsibilities: record.responsibilities,
      relationships: record.relationships,
      rationale: record.rationale,
      tradeoffs: record.tradeoffs,
      edgeCases: record.edgeCases,
      codeSnippet: record.codeSnippet,
    });
  }

  async findByAttemptId(
    attemptId: string,
  ): Promise<Submission | null> {
    const record = await prisma.submission.findUnique({
      where: { attemptId },
    });

    if (!record) return null;

    return Submission.create({
      id: record.id,
      attemptId: record.attemptId,
      requirementsAndAssumptions:
        record.requirementsAndAssumptions,
      classesAndInterfaces: record.classesAndInterfaces,
      responsibilities: record.responsibilities,
      relationships: record.relationships,
      rationale: record.rationale,
      tradeoffs: record.tradeoffs,
      edgeCases: record.edgeCases,
      codeSnippet: record.codeSnippet,
    });
  }

  async save(submission: Submission): Promise<void> {
    const data = submission.data;

    await prisma.submission.upsert({
      where: { attemptId: data.attemptId },
      create: {
        id: data.id,
        attemptId: data.attemptId,
        requirementsAndAssumptions:
          data.requirementsAndAssumptions,
        classesAndInterfaces: data.classesAndInterfaces,
        responsibilities: data.responsibilities,
        relationships: data.relationships,
        rationale: data.rationale,
        tradeoffs: data.tradeoffs,
        edgeCases: data.edgeCases,
        codeSnippet: data.codeSnippet,
        status: "SUBMITTED",
      },
      update: {
        requirementsAndAssumptions:
          data.requirementsAndAssumptions,
        classesAndInterfaces: data.classesAndInterfaces,
        responsibilities: data.responsibilities,
        relationships: data.relationships,
        rationale: data.rationale,
        tradeoffs: data.tradeoffs,
        edgeCases: data.edgeCases,
        codeSnippet: data.codeSnippet,
        status: "SUBMITTED",
      },
    });
  }
}
