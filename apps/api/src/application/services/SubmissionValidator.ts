import { SubmissionData } from "../../domain/entities/Submission";

export class SubmissionValidator {
  private readonly minimumLength = 20;
  private readonly minimumWords = 3;
  private readonly maximumCodeLength = 20_000;

  validate(data: SubmissionData): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    const requiredFields: Array<keyof SubmissionData> = [
      "requirementsAndAssumptions",
      "classesAndInterfaces",
      "responsibilities",
      "relationships",
      "rationale",
      "tradeoffs",
      "edgeCases",
    ];

    for (const field of requiredFields) {
      const value = data[field];

      if (typeof value !== "string" || value.trim().length === 0) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value.trim().length < this.minimumLength) {
        errors.push(
          `${field} must contain at least ${this.minimumLength} characters`,
        );
        continue;
      }

      const wordCount = value.trim().split(/\s+/).length;

      if (wordCount < this.minimumWords) {
        errors.push(
          `${field} must contain at least ${this.minimumWords} words`,
        );
      }
    }

    if (
      data.codeSnippet !== undefined &&
      data.codeSnippet !== null &&
      data.codeSnippet.length > this.maximumCodeLength
    ) {
      errors.push(
        `codeSnippet must not exceed ${this.maximumCodeLength} characters`,
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}