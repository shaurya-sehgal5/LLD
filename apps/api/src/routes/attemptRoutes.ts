import { Router } from "express";

import { CreateAttempt } from "../application/use-cases/CreateAttempt";
import { SubmitAttempt } from "../application/use-cases/SubmitAttempt";
import { RetryAttempt } from "../application/use-cases/RetryAttempt";
import { EvaluateSubmission } from "../application/use-cases/EvaluateSubmission";

import { PrismaProblemRepository } from "../infrastructure/repositories/PrismaProblemRepository";
import { PrismaAttemptRepository } from "../infrastructure/repositories/PrismaAttemptRepository";
import { PrismaSubmissionRepository } from "../infrastructure/repositories/PrismaSubmissionRepository";
import { PrismaEvaluationRepository } from "../infrastructure/repositories/PrismaEvaluationRepository";
import { RuleBasedEvaluator } from "../infrastructure/evaluators/RuleBasedEvaluator";

import { DomainError } from "../domain/errors/DomainError";
import { SubmissionValidator } from "../application/services/SubmissionValidator";

const router = Router();

const problemRepository = new PrismaProblemRepository();
const attemptRepository = new PrismaAttemptRepository();
const submissionRepository =
  new PrismaSubmissionRepository();
const evaluationRepository =
  new PrismaEvaluationRepository();

const createAttempt = new CreateAttempt(
  problemRepository,
  attemptRepository,
);

const submitAttempt = new SubmitAttempt(
  attemptRepository,
  submissionRepository,
  new SubmissionValidator(),
);

const retryAttempt = new RetryAttempt(
  attemptRepository,
  createAttempt,
);

const evaluateSubmission = new EvaluateSubmission(
  problemRepository,
  attemptRepository,
  submissionRepository,
  evaluationRepository,
  new RuleBasedEvaluator(),
);

/*
 * POST /api/attempts
 *
 * Start a new practice attempt.
 */
router.post("/", async (req, res, next) => {
  try {
    const { problemId, previousAttemptId } = req.body;

    if (!problemId || typeof problemId !== "string") {
      throw new DomainError("problemId is required");
    }

    const attempt = await createAttempt.execute({
      problemId,
      previousAttemptId,
    });

    res.status(201).json(attempt.toJSON());
  } catch (error) {
    next(error);
  }
});

/*
 * GET /api/attempts/:attemptId
 *
 * Get an attempt and its submission.
 */
router.get("/:attemptId", async (req, res, next) => {
  try {
    const attemptId = String(req.params.attemptId);

    const attempt =
      await attemptRepository.findById(attemptId);

    if (!attempt) {
      throw new DomainError("Attempt not found");
    }

    const submission =
      await submissionRepository.findByAttemptId(attemptId);

    res.json({
      attempt: attempt.toJSON(),
      submission: submission?.data ?? null,
    });
  } catch (error) {
    next(error);
  }
});

/*
 * POST /api/attempts/:attemptId/submissions
 *
 * Submit and evaluate a design.
 */
router.post(
  "/:attemptId/submissions",
  async (req, res, next) => {
    try {
      const attemptId = String(req.params.attemptId);

      const result = await submitAttempt.execute({
        attemptId,
        requirementsAndAssumptions:
          req.body.requirementsAndAssumptions,
        classesAndInterfaces:
          req.body.classesAndInterfaces,
        responsibilities:
          req.body.responsibilities,
        relationships:
          req.body.relationships,
        rationale:
          req.body.rationale,
        tradeoffs:
          req.body.tradeoffs,
        edgeCases:
          req.body.edgeCases,
        codeSnippet:
          req.body.codeSnippet,
      });

      /*
       * The submission is now persisted.
       * Evaluate it immediately for the MVP.
       */
      const evaluation =
        await evaluateSubmission.execute(
          result.submission.id,
        );

      res.status(201).json({
        attempt: evaluation.attempt.toJSON(),
        submission: result.submission.data,
        evaluation: evaluation.result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/*
 * GET /api/attempts/:attemptId/evaluation
 *
 * Get evaluation feedback for an attempt.
 */
router.get(
  "/:attemptId/evaluation",
  async (req, res, next) => {
    try {
      const attemptId = String(req.params.attemptId);

      const attempt =
        await attemptRepository.findById(attemptId);

      if (!attempt) {
        throw new DomainError("Attempt not found");
      }

      const submission =
        await submissionRepository.findByAttemptId(attemptId);

      if (!submission) {
        throw new DomainError(
          "Attempt does not have a submission",
        );
      }

      const evaluation =
        await evaluationRepository.findBySubmissionId(
          submission.id,
        );

      if (!evaluation) {
        throw new DomainError(
          "Evaluation not found",
        );
      }

      res.json({
        attemptId,
        submissionId: submission.id,
        evaluation,
      });
    } catch (error) {
      next(error);
    }
  },
);

/*
 * POST /api/attempts/:attemptId/retry
 *
 * Create a new immutable attempt linked to the previous one.
 */
router.post(
  "/:attemptId/retry",
  async (req, res, next) => {
    try {
      const attemptId = String(req.params.attemptId);

      const attempt =
        await retryAttempt.execute(attemptId);

      res.status(201).json(attempt.toJSON());
    } catch (error) {
      next(error);
    }
  },
);

export default router;
