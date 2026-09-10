import { RuleBasedEvaluator } from "../../src/infrastructure/evaluators/RuleBasedEvaluator";
import { ProblemRecord } from "../../src/domain/interfaces/ProblemRepository";
import {
  Submission,
  SubmissionProps,
} from "../../src/domain/entities/Submission";

describe("RuleBasedEvaluator", () => {
  const evaluator = new RuleBasedEvaluator();

  const problem: ProblemRecord = {
    id: "problem-1",
    title: "Vending Machine",
    slug: "vending-machine",
    description:
      "Design a vending machine that manages inventory, payment, product selection, dispensing, and change.",
  };

  const createSubmission = (
    overrides: Partial<Omit<SubmissionProps, "status" | "id" | "attemptId">> = {},
  ) => {
    return Submission.create({
      id: "submission-1",
      attemptId: "attempt-1",

      requirementsAndAssumptions:
        "The machine must support product selection, payment, inventory, change, user cancellation, and clear constraints.",

      classesAndInterfaces:
        "VendingMachine class coordinates the workflow. Inventory manages stock. Product represents products. PaymentProcessor validates payment. ChangeCalculator calculates change. PaymentProcessor is an interface.",

      responsibilities:
        "VendingMachine coordinates the use case. Inventory owns stock. PaymentProcessor validates payment. ChangeCalculator calculates change. Each component has a separate responsibility.",

      relationships:
        "VendingMachine depends on Inventory and PaymentProcessor. Inventory manages Product objects. The payment dependency uses an interface and the machine delegates payment behavior.",

      rationale:
        "Separating responsibilities makes the design easier to test and allows future payment implementations to be introduced without changing the vending machine.",

      tradeoffs:
        "Additional services create more collaboration, but the separation improves extensibility and keeps business rules isolated.",

      edgeCases:
        "Handle invalid product selection, sold-out products, insufficient payment, invalid coins, exact payment, excess payment, cancellation, duplicate requests, and dispensing failure.",

      codeSnippet: null,

      ...overrides,
    });
  };

  it("should return all six rubric criteria", async () => {
    const submission = createSubmission();

    const result = await evaluator.evaluate({
      problem,
      currentSubmission: submission,
      previousEvaluations: [],
    });

    expect(result.criteria).toHaveLength(6);

    expect(
      result.criteria.map((criterion) => criterion.criterion),
    ).toEqual([
      "REQUIREMENTS",
      "RESPONSIBILITIES",
      "ABSTRACTION",
      "COUPLING",
      "EXTENSIBILITY",
      "EDGE_CASES",
    ]);
  });

  it("should reward a well-structured design", async () => {
    const submission = createSubmission();

    const result = await evaluator.evaluate({
      problem,
      currentSubmission: submission,
      previousEvaluations: [],
    });

    expect(result.overallScore).toBeGreaterThanOrEqual(7);

    expect(
      result.criteria.find(
        (criterion) =>
          criterion.criterion === "RESPONSIBILITIES",
      )?.score,
    ).toBeGreaterThanOrEqual(7);

    expect(
      result.criteria.find(
        (criterion) =>
          criterion.criterion === "EXTENSIBILITY",
      )?.score,
    ).toBeGreaterThanOrEqual(7);
  });

  it("should penalize a monolithic design", async () => {
    const submission = createSubmission({
      classesAndInterfaces:
        "VendingMachine is the single class that handles everything.",

      responsibilities:
        "VendingMachine handles everything and owns all logic including inventory, payment, dispensing, change, and validation.",

      relationships:
        "Everything depends directly on VendingMachine and it directly creates all objects.",

      rationale:
        "A single class is simpler because it handles all logic in one place.",

      tradeoffs:
        "The main tradeoff is that the class becomes large but the implementation remains simple.",
    });

    const result = await evaluator.evaluate({
      problem,
      currentSubmission: submission,
      previousEvaluations: [],
    });

    const responsibilities = result.criteria.find(
      (criterion) =>
        criterion.criterion === "RESPONSIBILITIES",
    );

    const coupling = result.criteria.find(
      (criterion) =>
        criterion.criterion === "COUPLING",
    );

    expect(responsibilities?.score).toBeLessThanOrEqual(4);
    expect(coupling?.score).toBeLessThanOrEqual(5);
  });

  it("should recognize strong edge-case coverage", async () => {
    const submission = createSubmission({
      edgeCases:
        "Handle invalid input, invalid coins, insufficient payment, sold-out products, unavailable products, cancellation, duplicate requests, retry, timeout, dispensing failure, payment failure, empty inventory, boundary conditions, concurrent requests, and refund failure.",
    });

    const result = await evaluator.evaluate({
      problem,
      currentSubmission: submission,
      previousEvaluations: [],
    });

    const edgeCases = result.criteria.find(
      (criterion) =>
        criterion.criterion === "EDGE_CASES",
    );

    expect(edgeCases?.score).toBeGreaterThanOrEqual(8);
  });

  it("should include actionable feedback for every criterion", async () => {
    const submission = createSubmission();

    const result = await evaluator.evaluate({
      problem,
      currentSubmission: submission,
      previousEvaluations: [],
    });

    for (const criterion of result.criteria) {
      expect(criterion.evidence.length).toBeGreaterThan(0);
      expect(criterion.concern.length).toBeGreaterThan(0);
      expect(criterion.suggestion.length).toBeGreaterThan(0);
      expect(criterion.confidence).toBeGreaterThanOrEqual(0);
      expect(criterion.confidence).toBeLessThanOrEqual(1);
      expect(criterion.score).toBeGreaterThanOrEqual(1);
      expect(criterion.score).toBeLessThanOrEqual(10);
    }
  });
});
