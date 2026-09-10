import { AttemptStatus } from "../../src/domain/enums/AttemptStatus";
import { CreateAttempt } from "../../src/application/use-cases/CreateAttempt";
import { EvaluateSubmission } from "../../src/application/use-cases/EvaluateSubmission";
import { RetryAttempt } from "../../src/application/use-cases/RetryAttempt";
import { SubmitAttempt } from "../../src/application/use-cases/SubmitAttempt";
import { SubmissionValidator } from "../../src/application/services/SubmissionValidator";
import { RuleBasedEvaluator } from "../../src/infrastructure/evaluators/RuleBasedEvaluator";
import { PrismaProblemRepository } from "../../src/infrastructure/repositories/PrismaProblemRepository";
import { PrismaAttemptRepository } from "../../src/infrastructure/repositories/PrismaAttemptRepository";
import { PrismaSubmissionRepository } from "../../src/infrastructure/repositories/PrismaSubmissionRepository";
import { PrismaEvaluationRepository } from "../../src/infrastructure/repositories/PrismaEvaluationRepository";
import { prisma } from "../../src/infrastructure/database/prisma";

describe("Attempt evaluation flow", () => {
    const problemRepository = new PrismaProblemRepository();
    const attemptRepository = new PrismaAttemptRepository();
    const submissionRepository = new PrismaSubmissionRepository();
    const evaluationRepository = new PrismaEvaluationRepository();

    const createAttempt = new CreateAttempt(
        problemRepository,
        attemptRepository,
    );

    const submitAttempt = new SubmitAttempt(
        attemptRepository,
        submissionRepository,
        new SubmissionValidator(),
    );

    const evaluateSubmission = new EvaluateSubmission(
        problemRepository,
        attemptRepository,
        submissionRepository,
        evaluationRepository,
        new RuleBasedEvaluator(),
    );

    const retryAttempt = new RetryAttempt(
        attemptRepository,
        createAttempt,
    );

    let problemId: string;

    beforeAll(async () => {
        const problems = await problemRepository.findAll();

        expect(problems.length).toBeGreaterThan(0);

        problemId = problems[0].id;
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it("should create a draft attempt", async () => {
        const attempt = await createAttempt.execute({
            problemId,
        });

        expect(attempt.status).toBe(AttemptStatus.DRAFT);
        expect(attempt.problemId).toBe(problemId);
    });

    it("should submit and evaluate an attempt", async () => {
        const attempt = await createAttempt.execute({
            problemId,
        });

        const submission = await submitAttempt.execute({
            attemptId: attempt.id,
            requirementsAndAssumptions:
                "The system must support product selection, payment validation, inventory tracking, dispensing, and change calculation. Assume one customer interacts with the machine at a time.",
            classesAndInterfaces:
                "VendingMachine coordinates the use case. Inventory owns stock. PaymentProcessor validates payments. ChangeCalculator calculates change. Product represents the selected item.",
            responsibilities:
                "VendingMachine coordinates the workflow. Inventory manages stock. PaymentProcessor validates payment. ChangeCalculator calculates change. Each class owns a separate responsibility.",
            relationships:
                "VendingMachine depends on PaymentProcessor, Inventory, and ChangeCalculator. Dependencies are injected through interfaces so implementations can be replaced.",
            rationale:
                "The design separates business responsibilities and keeps payment and change calculation replaceable. New payment methods can be introduced without changing the vending machine workflow.",
            tradeoffs:
                "The design introduces several interfaces which adds some complexity, but this allows payment and inventory behavior to evolve independently.",
            edgeCases:
                "The system handles insufficient payment, invalid product selection, sold-out products, invalid coins, duplicate payment, unavailable inventory, and failure during dispensing.",
            codeSnippet:
                "interface PaymentProcessor { validatePayment(amount: number): boolean; }",
        });

        expect(submission.attempt.status).toBe(AttemptStatus.SUBMITTED);

        const evaluation = await evaluateSubmission.execute(
            submission.submission.id,
        );

        expect(evaluation.attempt.status).toBe(AttemptStatus.COMPLETED);
        expect(evaluation.result.criteria).toHaveLength(6);
        expect(evaluation.result.overallScore).toBeGreaterThan(0);
        expect(evaluation.result.overallScore).toBeLessThanOrEqual(10);
        expect(evaluation.result.overallSummary).toBeTruthy();
        expect(evaluation.result.topImprovements).toBeInstanceOf(Array);
    });
    it("rejects long random single-token input", async () => {
        const attempt = await createAttempt.execute({
            problemId: problem.id,
        });

        const randomInput = "asdfghjklqwertyuiopzxcvbnmasdfghjkl";

        await expect(
            submitAttempt.execute({
                attemptId: attempt.id,
                requirementsAndAssumptions: randomInput,
                classesAndInterfaces: randomInput,
                responsibilities: randomInput,
                relationships: randomInput,
                rationale: randomInput,
                tradeoffs: randomInput,
                edgeCases: randomInput,
                codeSnippet: "",
            }),
        ).rejects.toThrow("must contain at least 3 words");
    });
    it("accepts concise multi-word design responses", async () => {
        const attempt = await createAttempt.execute({
            problemId: problem.id,
        });

        const validInput =
            "The system supports multiple products and customer purchases.";

        const result = await submitAttempt.execute({
            attemptId: attempt.id,
            requirementsAndAssumptions: validInput,
            classesAndInterfaces: validInput,
            responsibilities: validInput,
            relationships: validInput,
            rationale: validInput,
            tradeoffs: validInput,
            edgeCases: validInput,
            codeSnippet: "",
        });

        expect(result.submission).toBeDefined();
    });
    it("should return the same evaluation when evaluation is requested twice", async () => {
        const attempt = await createAttempt.execute({
            problemId,
        });

        const submission = await submitAttempt.execute({
            attemptId: attempt.id,
            requirementsAndAssumptions:
                "The system must support book borrowing, returning, member registration, book availability, and overdue handling. Assume each book has a unique identifier.",
            classesAndInterfaces:
                "Library manages books and members. Book represents a library book. Member represents a borrower. BorrowingService coordinates borrowing and returning operations.",
            responsibilities:
                "Library manages book inventory. Member owns borrowing information. BorrowingService validates borrowing rules and coordinates the workflow.",
            relationships:
                "BorrowingService depends on Library and Member abstractions. Domain objects are composed instead of placing all behavior inside one class.",
            rationale:
                "Responsibilities are separated so borrowing rules can change without modifying book and member representations.",
            tradeoffs:
                "The design has more classes than a simple implementation, but the separation makes future changes easier to isolate.",
            edgeCases:
                "The system handles unavailable books, unknown members, duplicate returns, overdue books, invalid book identifiers, and borrowing limits.",
        });

        const firstEvaluation = await evaluateSubmission.execute(
            submission.submission.id,
        );

        const secondEvaluation = await evaluateSubmission.execute(
            submission.submission.id,
        );

        expect(secondEvaluation.result).toEqual(firstEvaluation.result);
        expect(secondEvaluation.attempt.status).toBe(AttemptStatus.COMPLETED);
    });

    it("should create a new attempt when retrying", async () => {
        const firstAttempt = await createAttempt.execute({
            problemId,
        });

        const retry = await retryAttempt.execute(firstAttempt.id);

        expect(retry.id).not.toBe(firstAttempt.id);
        expect(retry.problemId).toBe(problemId);
        expect(retry.previousAttemptId).toBe(firstAttempt.id);
        expect(retry.status).toBe(AttemptStatus.DRAFT);
    });
});