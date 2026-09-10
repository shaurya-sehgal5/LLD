# AI Usage

## Overview

AI assistance was used during development as a design and implementation aid.

The goal was not to delegate the entire system design to an AI model. AI suggestions were reviewed, adapted, and tested against the assignment requirements.

The most important architectural decisions were made around keeping the MVP small, maintaining clear domain boundaries, separating deterministic validation from judgment-heavy evaluation, and keeping the evaluator replaceable.

---

## 1. Deterministic validation vs LLM evaluation

### Problem

A submission contains both objectively checkable properties and subjective design reasoning.

### AI suggestion

AI-assisted discussion suggested separating deterministic validation from judgment-heavy evaluation rather than asking an LLM to perform every check.

### Decision

Accepted.

The application separates:

```text
SubmissionValidator
        ↓
Evaluator
```

The validator handles predictable structural checks, while the evaluator handles design-quality feedback.

### Why

This makes validation:

- predictable
- testable
- easier to debug
- independent from model availability

It also prevents the LLM from being responsible for basic input validation.

---

## 2. Replaceable evaluator boundary

### Problem

The evaluator may change over time.

The current MVP needs a free deterministic evaluator, while an LLM evaluator may be used when an API with available quota is configured.

### AI suggestion

Use an Evaluator interface with separate implementations.

### Decision

Accepted.

The architecture uses:

```text
Evaluator
   ├── RuleBasedEvaluator
   └── OpenAIEvaluator
```

The practice flow depends on the interface rather than a concrete evaluator.

### Why

This allows the evaluator implementation to change without rewriting:

- attempt creation
- submission
- retry
- history
- feedback persistence

It also supports a future human evaluator or another evaluation strategy.

---

## 3. Structured evaluation result

### Problem

A single score is not sufficiently useful for learning.

### AI suggestion

Represent evaluation as structured criterion-level results containing a score, evidence, concern, suggestion, and confidence.

### Decision

Accepted.

The evaluation model stores:

- criterion
- score
- evidence
- concern
- suggestion
- confidence

The overall evaluation also stores:

- overall score
- summary
- top improvements

### Why

This turns evaluation into actionable feedback rather than simply ranking a submission.

It also makes the feedback easier to display in the frontend and persist in attempt history.

---

## 4. Explicit attempt state machine

### Problem

Submission and evaluation are separate workflow stages and may fail independently.

### AI suggestion

Represent the attempt lifecycle explicitly:

```text
DRAFT
  ↓
SUBMITTED
  ↓
EVALUATING
  ↓
COMPLETED
```

with:

```text
EVALUATING → FAILED
```

for evaluation failures.

### Decision

Accepted.

The `PracticeAttempt` domain entity owns these state transitions.

### Why

Keeping state transitions inside the domain prevents invalid workflow transitions from being scattered across routes.

It also makes future asynchronous evaluation possible without changing the core domain model.

---

## 5. Retry as a new attempt

### Problem

A learner should be able to improve a previous design without losing the original attempt.

### AI suggestion

Create a new attempt and link it to the previous attempt using `previousAttemptId`.

### Decision

Accepted.

Retry creates a new attempt instead of overwriting the previous one.

### Why

This preserves history and enables future progress comparisons.

It also keeps the practice flow independent of the specific evaluation implementation.

---

## Runtime AI limitation

The project includes an `OpenAIEvaluator` implementation, but the current development environment does not have available OpenAI API quota for runtime evaluation.

The working MVP therefore uses the deterministic `RuleBasedEvaluator`.

No fake AI-generated evaluation is presented to the user.

The evaluator boundary was intentionally kept so that an available LLM provider can be enabled later without changing the practice flow.

---

## What AI did not replace

AI assistance did not replace:

- running the application
- testing the API
- verifying database persistence
- validating state transitions
- checking frontend/backend integration
- reviewing test failures
- manually verifying the end-to-end practice flow

The implementation was iteratively tested and corrected during development.

---

## Summary

The main AI-assisted decisions were:

1. Separate deterministic validation from subjective evaluation.
2. Introduce a replaceable evaluator interface.
3. Store structured criterion-level feedback.
4. Model explicit attempt state transitions.
5. Preserve retries as linked attempts.

The final implementation intentionally favors a small, understandable monolith over unnecessary infrastructure complexity.