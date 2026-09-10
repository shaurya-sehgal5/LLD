import { Router, Request, Response, NextFunction } from "express";
import { ListProblems } from "../application/use-cases/ListProblems";
import { GetProblem } from "../application/use-cases/GetProblem";
import { PrismaProblemRepository } from "../infrastructure/repositories/PrismaProblemRepository";
import { GetProblemHistory } from "../application/use-cases/GetProblemHistory";
import { PrismaAttemptRepository } from "../infrastructure/repositories/PrismaAttemptRepository";
import { PrismaSubmissionRepository } from "../infrastructure/repositories/PrismaSubmissionRepository";
import { PrismaEvaluationRepository } from "../infrastructure/repositories/PrismaEvaluationRepository";

const router = Router();

const problemRepository = new PrismaProblemRepository();
const listProblems = new ListProblems(problemRepository);
const getProblem = new GetProblem(problemRepository);
const attemptRepository = new PrismaAttemptRepository();
const submissionRepository =
  new PrismaSubmissionRepository();
const evaluationRepository =
  new PrismaEvaluationRepository();

const getProblemHistory = new GetProblemHistory(
  problemRepository,
  attemptRepository,
  submissionRepository,
  evaluationRepository,
);
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const problems = await listProblems.execute();
    res.json(problems);
  } catch (error) {
    next(error);
  }
});
router.get(
  "/:problemId/history",
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const problemId = String(req.params.problemId);

      const history =
        await getProblemHistory.execute(problemId);

      res.json(history);
    } catch (error) {
      next(error);
    }
  },
);
router.get(
  "/:problemId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const problemId = String(req.params.problemId);
      const problem = await getProblem.execute(problemId);
      res.json(problem);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
