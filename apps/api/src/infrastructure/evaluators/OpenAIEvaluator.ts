import OpenAI from "openai";

import {
  EvaluationContext,
  EvaluationResult,
  EvaluationCriterion,
  Evaluator,
} from "../../domain/interfaces/Evaluator";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const model =
  process.env.OPENAI_MODEL || "gpt-5.6-luna";

const criteria: EvaluationCriterion[] = [
  "REQUIREMENTS",
  "RESPONSIBILITIES",
  "ABSTRACTION",
  "COUPLING",
  "EXTENSIBILITY",
  "EDGE_CASES",
];

const evaluationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    criteria: {
      type: "array",
      minItems: 6,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          criterion: {
            type: "string",
            enum: criteria,
          },
          score: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          evidence: {
            type: "string",
          },
          concern: {
            type: "string",
          },
          suggestion: {
            type: "string",
          },
          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
          },
        },
        required: [
          "criterion",
          "score",
          "evidence",
          "concern",
          "suggestion",
          "confidence",
        ],
      },
    },
    overallScore: {
      type: "number",
      minimum: 1,
      maximum: 10,
    },
    overallSummary: {
      type: "string",
    },
    topImprovements: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "string",
      },
    },
  },
  required: [
    "criteria",
    "overallScore",
    "overallSummary",
    "topImprovements",
  ],
};

export class OpenAIEvaluator implements Evaluator {
  async evaluate(
    context: EvaluationContext,
  ): Promise<EvaluationResult> {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not configured",
      );
    }

    const submission =
      context.currentSubmission.data;

    const previousEvaluations =
      context.previousEvaluations.length > 0
        ? JSON.stringify(
            context.previousEvaluations,
            null,
            2,
          )
        : "No previous evaluations.";

    const input = `
You are an expert software engineer and LLD interviewer.

Evaluate a learner's object-oriented low-level design submission.

Your evaluation must be grounded ONLY in:
1. The supplied problem.
2. The learner's supplied submission.
3. Previous evaluation summaries, if present.

Do not reward verbosity by itself.
Do not score based on character count.
Evaluate the actual quality of the design reasoning.

PROBLEM
Title:
${context.problem.title}

Description:
${context.problem.description}

LEARNER SUBMISSION

Requirements and assumptions:
${submission.requirementsAndAssumptions}

Classes and interfaces:
${submission.classesAndInterfaces}

Responsibilities:
${submission.responsibilities}

Relationships:
${submission.relationships}

Rationale:
${submission.rationale}

Trade-offs:
${submission.tradeoffs}

Edge cases:
${submission.edgeCases}

Code snippet:
${submission.codeSnippet ?? "No code snippet provided."}

PREVIOUS EVALUATIONS
${previousEvaluations}

RUBRIC

REQUIREMENTS:
Does the learner identify the important functional requirements,
constraints, assumptions, and scope boundaries?

RESPONSIBILITIES:
Are responsibilities assigned clearly and cohesively?
Does each class have a meaningful responsibility?

ABSTRACTION:
Are classes, interfaces, and abstractions meaningful?
Avoid rewarding unnecessary interfaces or over-engineering.

COUPLING:
Are dependencies and relationships sensible?
Is the design unnecessarily tightly coupled?

EXTENSIBILITY:
Can likely changes be introduced without major redesign?
Consider realistic future variations of this problem.

EDGE_CASES:
Does the design consider important failure, boundary, and
state-transition scenarios?

SCORING

1-2 = fundamentally incorrect or missing
3-4 = weak and incomplete
5-6 = acceptable but significant gaps
7-8 = solid design with some weaknesses
9 = very strong design with minor issues
10 = exceptional design with strong reasoning and very few weaknesses

IMPORTANT

For every criterion:
- cite concrete evidence from the learner's submission
- identify a real concern when one exists
- provide an actionable improvement
- assign confidence from 0 to 1

Do not invent classes, requirements, or decisions that the learner did not provide.

Return only the requested structured evaluation.
`;

    const response = await client.responses.create({
      model,
      instructions:
        "Evaluate the LLD submission objectively and return only the requested structured output.",
      input,
      text: {
        format: {
          type: "json_schema",
          name: "lld_evaluation",
          strict: true,
          schema: evaluationSchema,
        },
      },
    });

    if (!response.output_text) {
      throw new Error(
        "AI evaluator returned empty output",
      );
    }

    const parsed = JSON.parse(
      response.output_text,
    ) as EvaluationResult;

    this.validateResult(parsed);

    return parsed;
  }

  private validateResult(
    result: EvaluationResult,
  ): void {
    if (result.criteria.length !== 6) {
      throw new Error(
        "AI evaluator must return exactly 6 criteria",
      );
    }

    for (const criterion of criteria) {
      const resultForCriterion =
        result.criteria.find(
          (item) =>
            item.criterion === criterion,
        );

      if (!resultForCriterion) {
        throw new Error(
          `AI evaluator missing criterion: ${criterion}`,
        );
      }
    }

    if (
      result.overallScore < 1 ||
      result.overallScore > 10
    ) {
      throw new Error(
        "AI evaluator returned invalid overall score",
      );
    }

    for (const item of result.criteria) {
      if (
        item.score < 1 ||
        item.score > 10
      ) {
        throw new Error(
          `Invalid score for ${item.criterion}`,
        );
      }

      if (
        item.confidence < 0 ||
        item.confidence > 1
      ) {
        throw new Error(
          `Invalid confidence for ${item.criterion}`,
        );
      }
    }
  }
}
