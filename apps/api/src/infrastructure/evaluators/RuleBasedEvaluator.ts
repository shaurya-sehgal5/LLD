import {
  EvaluationContext,
  EvaluationCriterion,
  EvaluationResult,
  Evaluator,
} from "../../domain/interfaces/Evaluator";

type SubmissionData =
  EvaluationContext["currentSubmission"]["data"];

interface CriterionAnalysis {
  score: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: number;
}

export class RuleBasedEvaluator implements Evaluator {
  async evaluate(
    context: EvaluationContext,
  ): Promise<EvaluationResult> {
    const submission =
      context.currentSubmission.data;

    const analyses: Record<
      EvaluationCriterion,
      CriterionAnalysis
    > = {
      REQUIREMENTS:
        this.evaluateRequirements(submission),

      RESPONSIBILITIES:
        this.evaluateResponsibilities(submission),

      ABSTRACTION:
        this.evaluateAbstraction(submission),

      COUPLING:
        this.evaluateCoupling(submission),

      EXTENSIBILITY:
        this.evaluateExtensibility(submission),

      EDGE_CASES:
        this.evaluateEdgeCases(submission),
    };

    const criteria: EvaluationCriterion[] = [
      "REQUIREMENTS",
      "RESPONSIBILITIES",
      "ABSTRACTION",
      "COUPLING",
      "EXTENSIBILITY",
      "EDGE_CASES",
    ];

    const results = criteria.map((criterion) => ({
      criterion,
      ...analyses[criterion],
    }));

    const overallScore =
      results.reduce(
        (sum, result) => sum + result.score,
        0,
      ) / results.length;

    const topImprovements = results
      .filter((result) => result.score < 8)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((result) => result.suggestion);

    return {
      criteria: results,
      overallScore: Number(
        overallScore.toFixed(1),
      ),
      overallSummary:
        this.buildSummary(overallScore),
      topImprovements,
    };
  }

  private evaluateRequirements(
    submission: SubmissionData,
  ): CriterionAnalysis {
    const text =
      submission.requirementsAndAssumptions;

    const signals = this.countSignals(text, [
      "requirement",
      "support",
      "allow",
      "should",
      "must",
      "assumption",
      "constraint",
      "scope",
      "user",
    ]);

    const score =
      signals >= 5
        ? 9
        : signals >= 3
          ? 7
          : signals >= 1
            ? 5
            : 3;

    return {
      score,
      evidence:
        signals >= 3
          ? "The submission identifies multiple functional requirements or design constraints."
          : "The requirements section contains limited explicit requirement or assumption signals.",
      concern:
        score < 7
          ? "Important requirements or assumptions may not be explicitly defined."
          : "The main requirements are reasonably identified, although some constraints may still be implicit.",
      suggestion:
        score < 7
          ? "Explicitly list the core use cases, assumptions, constraints, and out-of-scope behavior before designing classes."
          : "Make important constraints and scope boundaries explicit so design decisions can be evaluated against them.",
      confidence: 0.85,
    };
  }

  private evaluateResponsibilities(
    submission: SubmissionData,
  ): CriterionAnalysis {
    const text = submission.responsibilities;

    const separationSignals = this.countSignals(text, [
      "separate",
      "separation",
      "owns",
      "responsible",
      "responsibility",
      "coordinates",
      "manages",
      "validates",
      "calculates",
      "handles",
      "delegates",
      "isolates",
      "delegation",
    ]);

    const ownershipSignals = this.countSignals(text, [
      "owns",
      "manages",
      "responsible for",
      "coordinates",
      "validates",
      "calculates",
      "handles",
      "delegates",
    ]);

    const godObjectSignals = this.countSignals(text, [
      "everything",
      "all logic",
      "handles all",
      "does everything",
      "single class",
      "one class",
    ]);

    let score = 5;

    if (
      separationSignals >= 5 &&
      ownershipSignals >= 3
    ) {
      score = 9;
    } else if (
      separationSignals >= 4 &&
      ownershipSignals >= 2
    ) {
      score = 8;
    } else if (
      separationSignals >= 2 &&
      ownershipSignals >= 2
    ) {
      score = 7;
    } else if (
      separationSignals >= 2
    ) {
      score = 6;
    }

    if (godObjectSignals > 0) {
      score = Math.min(score, 4);
    }

    return {
      score,

      evidence:
        score >= 7
          ? "The submission identifies distinct responsibilities and assigns ownership of business behavior across multiple components."
          : "The submission provides limited evidence of clearly separated responsibilities and explicit ownership.",

      concern:
        godObjectSignals > 0
          ? "The design appears to concentrate too many responsibilities in one component."
          : score < 7
            ? "Some responsibility boundaries are not sufficiently explicit."
            : "Some responsibility boundaries could be described more precisely.",

      suggestion:
        godObjectSignals > 0
          ? "Split the overloaded component into cohesive collaborators with clear ownership of business rules."
          : score < 7
            ? "For each important class, explicitly state what it owns, what it does, and what responsibility belongs elsewhere."
            : "Strengthen the design by clearly stating ownership of each important business rule and avoiding overlapping responsibilities.",

      confidence: 0.88,
    };
  }

  private evaluateAbstraction(
    submission: SubmissionData,
  ): CriterionAnalysis {
    const text =
      submission.classesAndInterfaces;

    const abstractionSignals =
      this.countSignals(text, [
        "interface",
        "abstract",
        "strategy",
        "factory",
        "repository",
        "processor",
        "policy",
        "implementation",
        "contract",
      ]);

    const classSignals =
      this.countSignals(text, [
        "class",
        "entity",
        "service",
        "manager",
        "controller",
        "component",
      ]);

    const score =
      abstractionSignals >= 3 && classSignals >= 3
        ? 9
        : abstractionSignals >= 2 || classSignals >= 4
          ? 7
          : classSignals >= 2
            ? 6
            : 4;

    return {
      score,
      evidence:
        classSignals >= 3
          ? "The submission identifies several domain components rather than treating the problem as one monolithic class."
          : "The submission identifies relatively few explicit domain components.",
      concern:
        score < 7
          ? "The design could benefit from clearer domain abstractions and explicit contracts where variation is expected."
          : "Some abstractions may need clearer justification based on actual variation points.",
      suggestion:
        score < 7
          ? "Identify the core domain objects first, then introduce interfaces only around behavior that genuinely varies or needs isolation."
          : "Explain why each important interface exists and which future variation it protects against.",
      confidence: 0.82,
    };
  }

  private evaluateCoupling(
    submission: SubmissionData,
  ): CriterionAnalysis {
    const text =
      submission.relationships;

    const positiveSignals =
      this.countSignals(text, [
        "depends on",
        "dependency",
        "interface",
        "inject",
        "composition",
        "delegates",
        "separate",
        "abstract",
      ]);

    const negativeSignals =
      this.countSignals(text, [
        "directly creates",
        "hardcoded",
        "global",
        "static",
        "everything depends",
        "tightly coupled",
      ]);

    let score =
      positiveSignals >= 4
        ? 9
        : positiveSignals >= 2
          ? 7
          : positiveSignals >= 1
            ? 6
            : 5;

    if (negativeSignals > 0) {
      score = Math.max(
        3,
        score - negativeSignals * 2,
      );
    }

    return {
      score,
      evidence:
        positiveSignals >= 2
          ? "The relationships section describes delegation, dependencies, or abstraction boundaries."
          : "The relationships section provides limited evidence about dependency direction and coupling.",
      concern:
        negativeSignals > 0
          ? "The submission contains signals of tight coupling or hard-coded dependencies."
          : score < 7
            ? "Dependency direction and collaboration boundaries are not sufficiently explicit."
            : "Some dependency relationships could be explained more precisely.",
      suggestion:
        score < 7
          ? "Explain which objects depend on which abstractions and prefer composition/delegation over hard-coded concrete dependencies."
          : "Document the key dependency directions and explain why the chosen relationships avoid unnecessary coupling.",
      confidence: 0.84,
    };
  }

private evaluateExtensibility(
  submission: SubmissionData,
): CriterionAnalysis {
  const text =
    `${submission.rationale} ` +
    `${submission.tradeoffs} ` +
    `${submission.classesAndInterfaces} ` +
    `${submission.relationships}`;

  const signals = this.countSignals(text, [
    "extend",
    "extension",
    "future",
    "new",
    "different",
    "multiple",
    "strategy",
    "interface",
    "abstract",
    "without changing",
    "evolve",
    "replace",
    "plug",
    "open for extension",
    "closed for modification",
    "separate",
    "composition",
    "delegation",
  ]);

  const score =
    signals >= 8 ? 9 :
    signals >= 5 ? 8 :
    signals >= 3 ? 7 :
    signals >= 1 ? 6 :
    4;

  return {
    score,
    evidence:
      signals >= 3
        ? "The design identifies variation points and provides mechanisms that can accommodate future changes."
        : "The submission provides limited explicit reasoning about how the design can evolve.",
    concern:
      score < 7
        ? "Likely future changes are not clearly mapped to extension points."
        : "Some extension points could be tied more directly to realistic future requirements.",
    suggestion:
      score < 7
        ? "Identify two or three realistic changes and explain which abstraction or responsibility would absorb each change."
        : "Connect extensibility decisions to concrete future requirements rather than adding abstractions speculatively.",
    confidence: 0.8,
  };
}

  private evaluateEdgeCases(
    submission: SubmissionData,
  ): CriterionAnalysis {
    const text =
      submission.edgeCases;

    const signals =
      this.countSignals(text, [
        "invalid",
        "error",
        "failure",
        "empty",
        "null",
        "duplicate",
        "timeout",
        "unavailable",
        "insufficient",
        "cancel",
        "retry",
        "boundary",
        "concurrent",
        "sold-out",
        "not found",
      ]);

    const score =
      signals >= 8
        ? 9
        : signals >= 5
          ? 8
          : signals >= 3
            ? 7
            : signals >= 1
              ? 5
              : 3;

    return {
      score,
      evidence:
        signals >= 3
          ? "The submission explicitly identifies several failure or boundary scenarios."
          : "Only a small number of explicit edge-case signals were identified.",
      concern:
        score < 7
          ? "Important failure or boundary scenarios may be missing."
          : "The edge cases are useful but their handling is not always tied to specific responsibilities or state transitions.",
      suggestion:
        score < 7
          ? "List failure, boundary, duplicate, invalid-input, and state-transition cases and explain which component handles each."
          : "For important edge cases, explain the expected state transition and the component responsible for handling the failure.",
      confidence: 0.87,
    };
  }

  private countSignals(
    text: string,
    signals: string[],
  ): number {
    const normalized =
      text.toLowerCase();

    return signals.filter((signal) =>
      normalized.includes(
        signal.toLowerCase(),
      ),
    ).length;
  }

  private buildSummary(
    score: number,
  ): string {
    if (score >= 8.5) {
      return "The design demonstrates strong coverage of requirements, responsibilities, abstractions, coupling, extensibility, and edge cases.";
    }

    if (score >= 7) {
      return "The design covers the main LLD concerns and has a reasonable structure, but several areas could use more explicit reasoning.";
    }

    if (score >= 5) {
      return "The design covers some important LLD concepts, but responsibilities, abstractions, relationships, or edge-case handling need further development.";
    }

    return "The design needs substantial improvement in its core responsibilities, abstractions, relationships, and handling of realistic edge cases.";
  }
}
