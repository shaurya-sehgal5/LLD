import request from "supertest";
import app from "../../src/app";

describe("API", () => {
    let problemId: string;
    let attemptId: string;
    let submissionId: string;

    const validSubmission = {
        requirementsAndAssumptions:
            "The vending machine must support product selection, payment validation, inventory tracking, dispensing, and change calculation. Assume one customer interacts with the machine at a time.",

        classesAndInterfaces:
            "VendingMachine coordinates the workflow. Inventory owns product stock. PaymentProcessor validates payment. ChangeCalculator calculates change. Product represents the selected product.",

        responsibilities:
            "VendingMachine coordinates the use case. Inventory manages stock. PaymentProcessor validates payment. ChangeCalculator calculates change. Each component has a separate responsibility.",

        relationships:
            "VendingMachine depends on Inventory, PaymentProcessor, and ChangeCalculator. Dependencies are represented through interfaces so implementations can be replaced.",

        rationale:
            "The design separates responsibilities so payment, inventory, and change calculation can evolve independently. The vending machine coordinates the workflow rather than owning every business rule.",

        tradeoffs:
            "The design introduces interfaces and multiple collaborators, which adds some complexity, but this improves separation of concerns and allows future payment methods.",

        edgeCases:
            "The system handles insufficient payment, invalid product selection, sold-out products, invalid coins, unavailable inventory, duplicate payment, and dispensing failure.",

        codeSnippet:
            "interface PaymentProcessor { validatePayment(amount: number): boolean; }",
    };

    it("GET /health should return API health", async () => {
        const response = await request(app)
            .get("/health")
            .expect(200);

        expect(response.body).toEqual({
            status: "ok",
            service: "lld-practice-api",
        });
    });

    it("GET /api/problems should return seeded problems", async () => {
        const response = await request(app)
            .get("/api/problems")
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThanOrEqual(4);

        problemId = response.body[0].id;

        expect(response.body[0]).toHaveProperty("title");
        expect(response.body[0]).toHaveProperty("slug");
        expect(response.body[0]).toHaveProperty("description");
    });

    it("GET /api/problems/:problemId should return one problem", async () => {
        const response = await request(app)
            .get(`/api/problems/${problemId}`)
            .expect(200);

        expect(response.body.id).toBe(problemId);
        expect(response.body).toHaveProperty("title");
        expect(response.body).toHaveProperty("description");
    });

    it("GET /api/problems/:problemId should return 404 for unknown problem", async () => {
        await request(app)
            .get("/api/problems/non-existent-problem")
            .expect(404);
    });

    it("POST /api/attempts should create a draft attempt", async () => {
        const response = await request(app)
            .post("/api/attempts")
            .send({ problemId })
            .expect(201);

        attemptId = response.body.id;

        expect(response.body.problemId).toBe(problemId);
        expect(response.body.status).toBe("DRAFT");
        expect(response.body.previousAttemptId).toBeNull();
    });

    it("POST /api/attempts should reject a missing problemId", async () => {
        const response = await request(app)
            .post("/api/attempts")
            .send({})
            .expect(400);

        expect(response.body.error).toBe("problemId is required");
    });

    it("GET /api/attempts/:attemptId should return the attempt", async () => {
        const response = await request(app)
            .get(`/api/attempts/${attemptId}`)
            .expect(200);

        expect(response.body.attempt.id).toBe(attemptId);
        expect(response.body.attempt.problemId).toBe(problemId);
        expect(response.body.submission).toBeNull();
    });

    it("POST /api/attempts/:attemptId/submissions should submit and evaluate", async () => {
        const response = await request(app)
            .post(`/api/attempts/${attemptId}/submissions`)
            .send(validSubmission)
            .expect(201);

        submissionId = response.body.submission.id;

        expect(response.body.attempt.id).toBe(attemptId);
        expect(response.body.attempt.status).toBe("COMPLETED");

        expect(response.body.submission.attemptId).toBe(attemptId);

        expect(response.body.evaluation).toBeDefined();
        expect(response.body.evaluation.criteria).toHaveLength(6);
        expect(response.body.evaluation.overallScore).toBeGreaterThanOrEqual(1);
        expect(response.body.evaluation.overallScore).toBeLessThanOrEqual(10);
    });

    it("GET /api/attempts/:attemptId should include the persisted submission", async () => {
        const response = await request(app)
            .get(`/api/attempts/${attemptId}`)
            .expect(200);

        expect(response.body.attempt.status).toBe("COMPLETED");
        expect(response.body.submission).not.toBeNull();
        expect(response.body.submission.id).toBe(submissionId);
    });

    it("GET /api/attempts/:attemptId/evaluation should return persisted evaluation", async () => {
        const response = await request(app)
            .get(`/api/attempts/${attemptId}/evaluation`)
            .expect(200);

        expect(response.body.attemptId).toBe(attemptId);
        expect(response.body.submissionId).toBe(submissionId);
        expect(response.body.evaluation.criteria).toHaveLength(6);
    });

    it("should prevent duplicate submission for the same attempt", async () => {
        const response = await request(app)
            .post(`/api/attempts/${attemptId}/submissions`)
            .send(validSubmission)
            .expect(400);

        expect(response.body.error).toBe(
            "Attempt already has a submission",
        );
    });

    it("GET /api/attempts/:attemptId/evaluation should return 404 for unknown attempt", async () => {
        await request(app)
            .get("/api/attempts/non-existent-attempt/evaluation")
            .expect(404);
    });

    it("POST /api/attempts/:attemptId/retry should create a new draft attempt", async () => {
        const response = await request(app)
            .post(`/api/attempts/${attemptId}/retry`)
            .expect(201);

        expect(response.body.id).not.toBe(attemptId);
        expect(response.body.problemId).toBe(problemId);
        expect(response.body.previousAttemptId).toBe(attemptId);
        expect(response.body.status).toBe("DRAFT");
    });

    it("GET /api/problems/:problemId/history should return attempt history", async () => {
        const response = await request(app)
            .get(`/api/problems/${problemId}/history`)
            .expect(200);

        expect(response.body.problem.id).toBe(problemId);
        expect(Array.isArray(response.body.attempts)).toBe(true);

        const completedAttempt = response.body.attempts.find(
            (item: any) => item.attempt.id === attemptId,
        );

        expect(completedAttempt).toBeDefined();
        expect(completedAttempt.attempt.status).toBe("COMPLETED");
        expect(completedAttempt.submission).not.toBeNull();
        expect(completedAttempt.evaluation).not.toBeNull();
    });

    it("GET /api/problems/:problemId/history should return 404 for unknown problem", async () => {
        await request(app)
            .get("/api/problems/non-existent-problem/history")
            .expect(404);
    });
});