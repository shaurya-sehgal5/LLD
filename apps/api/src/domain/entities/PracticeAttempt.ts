import { AttemptStatus } from "../enums/AttemptStatus";
import { InvalidAttemptStateError } from "../errors/InvalidAttemptStateError";

export interface PracticeAttemptProps {
  id: string;
  problemId: string;
  previousAttemptId?: string | null;
  status: AttemptStatus;
  startedAt: Date;
  submittedAt?: Date | null;
  completedAt?: Date | null;
}

export class PracticeAttempt {
  private constructor(private readonly props: PracticeAttemptProps) {}

  static create(props: {
    id: string;
    problemId: string;
    previousAttemptId?: string | null;
  }): PracticeAttempt {
    if (!props.problemId.trim()) {
      throw new Error("problemId is required");
    }

    return new PracticeAttempt({
      id: props.id,
      problemId: props.problemId,
      previousAttemptId: props.previousAttemptId ?? null,
      status: AttemptStatus.DRAFT,
      startedAt: new Date(),
      submittedAt: null,
      completedAt: null,
    });
  }

  static rehydrate(props: PracticeAttemptProps): PracticeAttempt {
    return new PracticeAttempt(props);
  }

  get id(): string {
    return this.props.id;
  }

  get problemId(): string {
    return this.props.problemId;
  }

  get previousAttemptId(): string | null {
    return this.props.previousAttemptId ?? null;
  }

  get status(): AttemptStatus {
    return this.props.status;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get submittedAt(): Date | null {
    return this.props.submittedAt ?? null;
  }

  get completedAt(): Date | null {
    return this.props.completedAt ?? null;
  }

  submit(): void {
    if (this.props.status !== AttemptStatus.DRAFT) {
      throw new InvalidAttemptStateError(
        `Attempt cannot be submitted from ${this.props.status} state`,
      );
    }

    this.props.status = AttemptStatus.SUBMITTED;
    this.props.submittedAt = new Date();
  }

  startEvaluation(): void {
    if (this.props.status !== AttemptStatus.SUBMITTED) {
      throw new InvalidAttemptStateError(
        `Evaluation cannot start from ${this.props.status} state`,
      );
    }

    this.props.status = AttemptStatus.EVALUATING;
  }

  complete(): void {
    if (this.props.status !== AttemptStatus.EVALUATING) {
      throw new InvalidAttemptStateError(
        `Attempt cannot be completed from ${this.props.status} state`,
      );
    }

    this.props.status = AttemptStatus.COMPLETED;
    this.props.completedAt = new Date();
  }

  fail(): void {
    if (this.props.status !== AttemptStatus.EVALUATING) {
      throw new InvalidAttemptStateError(
        `Attempt cannot fail from ${this.props.status} state`,
      );
    }

    this.props.status = AttemptStatus.FAILED;
  }

  toJSON(): PracticeAttemptProps {
    return {
      id: this.props.id,
      problemId: this.props.problemId,
      previousAttemptId: this.props.previousAttemptId ?? null,
      status: this.props.status,
      startedAt: this.props.startedAt,
      submittedAt: this.props.submittedAt ?? null,
      completedAt: this.props.completedAt ?? null,
    };
  }
}
