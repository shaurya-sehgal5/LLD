# LLD Practice Platform — Research Note

## 1. Problem Understanding

Low-Level Design (LLD) practice is not primarily a problem of finding more questions. Learners already have access to common problems — Parking Lot, Elevator, Vending Machine, Library Management — through interview-preparation resources and practice platforms.

The harder problem is understanding **whether their own design is good, why it is weak, and what they should change in the next attempt**. This is particularly relevant for SDE interview prep, where design trade-offs, object responsibilities, extensibility, and the ability to explain design decisions matter alongside implementation skill. Hello Interview's own LLD prep material names this gap directly: existing material is either outdated UML-heavy content from decades past, or academic pattern-memorization drills — neither builds the judgment the interview actually tests.

The product hypothesis:

> **The opportunity is not another LLD content library; it is a feedback-first practice loop that helps learners improve their own designs through repeated attempts.**

## 2. Existing Approaches

Two comparable products were reviewed directly:

| Resource | What it does well | Opportunity for this MVP |
|---|---|---|
| **Hello Interview** | Guided LLD practice across real interview problems (Parking Lot, Elevator, File System, Rate Limiter, etc.), step-by-step interaction, personalized feedback | Broad interview-prep platform — LLD is one track among system design, behavioral, and DSA. This MVP can focus narrowly on submission → evaluation → improvement |
| **LLDCanvas** | Dedicated UML editor with real class/interface semantics, 23 pattern templates, timed practice mode, large problem library, code execution | Strong at *drawing* a design correctly; tooling-first rather than evaluation-first — feature-rich but heavier than a feedback-focused MVP needs |

A recurring pattern also shows up across open-source Java LLD repositories on GitHub: pairing an executable code submission with hidden tests and an AI-generated design grade. This validates "code + AI design commentary" as a viable combination, but these are largely unmaintained side projects rather than considered products, so they're treated here as a pattern worth noting — not a named competitor.

**Research conclusion.** The ecosystem already provides the major building blocks — problems, learning material, diagramming/coding tools, AI feedback — individually. None of the reviewed products makes *structured, evidence-backed, criterion-level feedback across repeated attempts* the center of the product. That gap is the opening for this MVP:

**Practice → Submit → Understand weaknesses → Improve → Retry**

## 3. Key Findings

**Finding 1 — Feedback is more valuable than another reference solution.** A reference implementation shows one possible answer; it doesn't explain why *this* design is weak. Useful feedback identifies specific evidence in the learner's own submission, explains the concern, and gives an actionable improvement. The platform should produce criterion-level feedback, not a single unexplained score.

**Finding 2 — LLD quality is multidimensional.** Evaluation should cover requirement understanding, responsibility/cohesion, encapsulation/abstraction, coupling, extensibility, and edge-case reasoning as distinct, separately-gradable properties — not whether the learner happened to reproduce a reference solution.

**Finding 3 — Evaluation should be hybrid.** Some properties are checkable deterministically: required submission sections, minimum valid submission, attempt state transitions, duplicate submission handling, evaluation failure states. Others require reasoning: whether responsibilities are well separated, whether abstractions are appropriate, whether coupling is unnecessarily high, whether the design supports reasonable changes, whether trade-offs are justified. The MVP combines deterministic validation with AI-assisted evaluation, using a fixed rubric and structured output — **Criterion → Score → Evidence → Concern → Suggestion → Confidence**. Because LLM responses are non-deterministic, the implementation validates the returned structure against a schema and retries invalid responses rather than storing malformed feedback, moving to a failed state after repeated failures.

**Finding 4 — The submission format should be deliberately small.** A full UML editor or online coding environment adds substantial complexity without being necessary to validate the core hypothesis. The MVP uses a structured design submission: requirements/assumptions, classes/interfaces, responsibilities, relationships, design rationale and trade-offs, edge cases, and optional supporting code. Optional code is **not compiled or executed** in the MVP — it's additional evidence for understanding the proposed domain model, not a separate coding-evaluation system.

## 4. Product Direction

Core loop: **Choose Problem → Start Attempt → Submit Design → Validate → Evaluate → Review Feedback → Retry.**

The initial problem set contains four problems, chosen to expose different LLD concerns rather than four variations on the same skill:

- **Vending Machine** — state-driven behavior and inventory
- **Parking Lot** — entity relationships, allocation, extensibility
- **Library Management** — relationships, policies, responsibility boundaries
- **Elevator System** — state, scheduling, more complex multi-object interaction

This gives a small progression from simpler state/behavior modeling toward more complex object interactions.

The most important product feature is **attempt history**, not the latest score. A learner should be able to see whether a previously named weakness — excessive coupling, unclear responsibilities — actually improved on the next attempt. That comparison is what makes this practice rather than one-shot grading.

> **Final product hypothesis:** if learners can repeatedly submit their own LLD designs and receive structured, evidence-backed feedback on responsibilities, coupling, abstraction, extensibility, and edge cases, the platform can turn LLD preparation from passive solution consumption into an iterative improvement process.

## 5. MVP Scope

**Build:** 4 LLD problems, structured design submission, attempt creation and history, deterministic submission validation, AI-assisted criterion-level evaluation, evidence-backed feedback, evaluation status/failure handling, retry/improvement flow, tests for domain and failure behavior.

**Defer:** full UML editor, authentication, community/social features, leaderboards, multi-language code execution, microservices, Kubernetes/distributed infrastructure, real-time collaboration.

The objective is a complete, reliable practice loop with strong domain design — not maximum feature count.
