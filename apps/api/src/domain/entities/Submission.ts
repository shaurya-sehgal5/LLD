import { SubmissionStatus } from "../enums/SubmissionStatus";

export interface SubmissionProps {
  id: string;
  attemptId: string;
  requirementsAndAssumptions: string;
  classesAndInterfaces: string;
  responsibilities: string;
  relationships: string;
  rationale: string;
  tradeoffs: string;
  edgeCases: string;
  codeSnippet?: string | null;
  status: SubmissionStatus;
}

export class Submission {
  private constructor(private readonly props: SubmissionProps) {}

  static create(props: Omit<SubmissionProps, "status">): Submission {
    const requiredFields = [
      ["requirementsAndAssumptions", props.requirementsAndAssumptions],
      ["classesAndInterfaces", props.classesAndInterfaces],
      ["responsibilities", props.responsibilities],
      ["relationships", props.relationships],
      ["rationale", props.rationale],
      ["tradeoffs", props.tradeoffs],
      ["edgeCases", props.edgeCases],
    ] as const;

    for (const [field, value] of requiredFields) {
      if (!value.trim()) {
        throw new Error(`${field} is required`);
      }
    }

    return new Submission({
      ...props,
      status: SubmissionStatus.SUBMITTED,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get attemptId(): string {
    return this.props.attemptId;
  }

  get status(): SubmissionStatus {
    return this.props.status;
  }

  get data(): Omit<SubmissionProps, "status"> {
    return {
      id: this.props.id,
      attemptId: this.props.attemptId,
      requirementsAndAssumptions: this.props.requirementsAndAssumptions,
      classesAndInterfaces: this.props.classesAndInterfaces,
      responsibilities: this.props.responsibilities,
      relationships: this.props.relationships,
      rationale: this.props.rationale,
      tradeoffs: this.props.tradeoffs,
      edgeCases: this.props.edgeCases,
      codeSnippet: this.props.codeSnippet ?? null,
    };
  }

  markValidated(): void {
    this.props.status = SubmissionStatus.VALIDATED;
  }

  markInvalid(): void {
    this.props.status = SubmissionStatus.INVALID;
  }
}
