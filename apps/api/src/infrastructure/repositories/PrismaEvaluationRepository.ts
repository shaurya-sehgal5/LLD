import {
  EvaluationResult,
  EvaluationSummary,
} from "../../domain/interfaces/Evaluator";
import { EvaluationRepository } from "../../domain/interfaces/EvaluationRepository";
import { prisma } from "../database/prisma";

export class PrismaEvaluationRepository
  implements EvaluationRepository
{
  async existsForSubmission(submissionId: string): Promise<boolean> {
    const evaluation = await prisma.evaluation.findUnique({
      where: { submissionId },
      select: { id: true },
    });

    return evaluation !== null;
  }

  async save(
    submissionId: string,
    result: EvaluationResult,
  ): Promise<void> {
    await prisma.evaluation.create({
      data: {
        submissionId,
        overallScore: result.overallScore,
        overallSummary: result.overallSummary,
        topImprovements: JSON.stringify(result.topImprovements),
        criteria: {
          create: result.criteria.map((criterion) => ({
            criterion: criterion.criterion,
            score: criterion.score,
            evidence: criterion.evidence,
            concern: criterion.concern,
            suggestion: criterion.suggestion,
            confidence: criterion.confidence,
          })),
        },
      },
    });
  }

  async findBySubmissionId(
    submissionId: string,
  ): Promise<EvaluationResult | null> {
    const evaluation = await prisma.evaluation.findUnique({
      where: { submissionId },
      include: {
        criteria: true,
      },
    });

    if (!evaluation) {
      return null;
    }

    return {
      criteria: evaluation.criteria.map((criterion) => ({
        criterion:
          criterion.criterion as EvaluationResult["criteria"][number]["criterion"],
        score: criterion.score,
        evidence: criterion.evidence,
        concern: criterion.concern,
        suggestion: criterion.suggestion,
        confidence: criterion.confidence,
      })),
      overallScore: evaluation.overallScore,
      overallSummary: evaluation.overallSummary,
      topImprovements: JSON.parse(evaluation.topImprovements) as string[],
    };
  }

  async findPreviousByProblemId(
    problemId: string,
  ): Promise<EvaluationSummary[]> {
    const evaluations = await prisma.evaluation.findMany({
      where: {
        submission: {
          attempt: {
            problemId,
          },
        },
      },
      select: {
        overallScore: true,
        topImprovements: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return evaluations.map((evaluation) => ({
      overallScore: evaluation.overallScore,
      topImprovements: JSON.parse(
        evaluation.topImprovements,
      ) as string[],
    }));
  }
}
