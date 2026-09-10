import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000/api";

type Problem = {
  id: string;
  title: string;
  slug: string;
  description: string;
};

type Attempt = {
  id: string;
  problemId: string;
  previousAttemptId: string | null;
  status: "DRAFT" | "SUBMITTED" | "EVALUATING" | "COMPLETED" | "FAILED";
  startedAt: string;
  submittedAt: string | null;
  completedAt: string | null;
};

type Submission = {
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
  status: string;
};

type Criterion = {
  criterion: string;
  score: number;
  evidence: string;
  concern: string;
  suggestion: string;
  confidence: number;
};

type Evaluation = {
  criteria: Criterion[];
  overallScore: number;
  overallSummary: string;
  topImprovements: string[];
};

type HistoryItem = {
  attempt: Attempt;
  submission: Submission | null;
  evaluation: Evaluation | null;
};

type HistoryResponse = {
  problem: Problem;
  attempts: HistoryItem[];
};

type View =
  | "problems"
  | "details"
  | "practice"
  | "feedback"
  | "history";

const emptyForm = {
  requirementsAndAssumptions: "",
  classesAndInterfaces: "",
  responsibilities: "",
  relationships: "",
  rationale: "",
  tradeoffs: "",
  edgeCases: "",
  codeSnippet: "",
};

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Something went wrong");
  }

  return data;
}

function App() {
  const [view, setView] = useState<View>("problems");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [, setSubmission] = useState<Submission | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProblems();
  }, []);

  async function loadProblems() {
    try {
      setLoading(true);
      setError("");

      const data = await request<Problem[]>("/problems");
      setProblems(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function openProblem(problem: Problem) {
    setSelectedProblem(problem);
    setError("");
    setView("details");
  }

  async function startPractice(problem = selectedProblem) {
    if (!problem) return;

    try {
      setLoading(true);
      setError("");

      const data = await request<Attempt>("/attempts", {
        method: "POST",
        body: JSON.stringify({
          problemId: problem.id,
        }),
      });

      setSelectedProblem(problem);
      setAttempt(data);
      setSubmission(null);
      setEvaluation(null);
      setForm(emptyForm);
      setView("practice");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: keyof typeof emptyForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submitPractice() {
    if (!attempt) return;

    try {
      setLoading(true);
      setError("");

      const data = await request<{
        attempt: Attempt;
        submission: Submission;
        evaluation?: Evaluation;
      }>(`/attempts/${attempt.id}/submissions`, {
        method: "POST",
        body: JSON.stringify(form),
      });

      setAttempt(data.attempt);
      setSubmission(data.submission);

      if (data.evaluation) {
        setEvaluation(data.evaluation);
        setView("feedback");
      } else {
        await loadEvaluation(attempt.id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadEvaluation(attemptId: string) {
    try {
      setLoading(true);
      setError("");

      const data = await request<{
        submission: Submission;
        evaluation: Evaluation;
        attempt: Attempt;
      }>(`/attempts/${attemptId}/evaluation`);

      setSubmission(data.submission);
      setEvaluation(data.evaluation);
      setAttempt(data.attempt);
      setView("feedback");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function retryPractice() {
    if (!attempt) return;

    try {
      setLoading(true);
      setError("");

      const data = await request<Attempt>(
        `/attempts/${attempt.id}/retry`,
        {
          method: "POST",
        },
      );

      setAttempt(data);
      setSubmission(null);
      setEvaluation(null);
      setForm(emptyForm);
      setView("practice");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(problem = selectedProblem) {
    if (!problem) return;

    try {
      setLoading(true);
      setError("");

      const data = await request<HistoryResponse>(
        `/problems/${problem.id}/history`,
      );

      setHistory(data.attempts);
      setSelectedProblem(data.problem);
      setView("history");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function openHistoryAttempt(item: HistoryItem) {
    setAttempt(item.attempt);

    if (item.submission) {
      setSubmission(item.submission);
    }

    if (item.evaluation) {
      setEvaluation(item.evaluation);
      setView("feedback");
      return;
    }

    if (item.attempt.status === "DRAFT") {
      setForm(emptyForm);
      setView("practice");
      return;
    }

    try {
      await loadEvaluation(item.attempt.id);
    } catch {
      setView("history");
    }
  }

  function goProblems() {
    setSelectedProblem(null);
    setAttempt(null);
    setSubmission(null);
    setEvaluation(null);
    setError("");
    setView("problems");
  }

  function scoreClass(score: number) {
    if (score >= 8) return "score-good";
    if (score >= 6) return "score-mid";
    return "score-low";
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={goProblems}>
          <span className="brand-mark">L</span>
          <span>
            <strong>LLD Practice</strong>
            <small>Design. Submit. Improve.</small>
          </span>
        </button>

        <nav>
          <button
            className={view === "problems" ? "nav-active" : ""}
            onClick={goProblems}
          >
            Problems
          </button>

          {selectedProblem && (
            <button
              className={view === "history" ? "nav-active" : ""}
              onClick={() => loadHistory()}
            >
              History
            </button>
          )}
        </nav>
      </header>

      <main>
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {loading && (
          <div className="loading-bar">
            <span />
          </div>
        )}

        {view === "problems" && (
          <ProblemsView
            problems={problems}
            loading={loading}
            onSelect={openProblem}
          />
        )}

        {view === "details" && selectedProblem && (
          <ProblemDetailsView
            problem={selectedProblem}
            onBack={goProblems}
            onStart={() => startPractice(selectedProblem)}
            onHistory={() => loadHistory(selectedProblem)}
          />
        )}

        {view === "practice" && selectedProblem && attempt && (
          <PracticeView
            problem={selectedProblem}
            attempt={attempt}
            form={form}
            loading={loading}
            onBack={() => setView("details")}
            onChange={updateField}
            onSubmit={submitPractice}
          />
        )}

        {view === "feedback" && selectedProblem && evaluation && (
          <FeedbackView
            problem={selectedProblem}
            evaluation={evaluation}
            attempt={attempt}
            onRetry={retryPractice}
            onHistory={() => loadHistory(selectedProblem)}
            onProblems={goProblems}
          />
        )}

        {view === "history" && selectedProblem && (
          <HistoryView
            problem={selectedProblem}
            history={history}
            onBack={() => setView("details")}
            onOpenAttempt={openHistoryAttempt}
            scoreClass={scoreClass}
          />
        )}
      </main>
    </div>
  );
}

function ProblemsView({
  problems,
  loading,
  onSelect,
}: {
  problems: Problem[];
  loading: boolean;
  onSelect: (problem: Problem) => void;
}) {
  return (
    <section className="page">
      <div className="hero">
        <div>
          <div className="eyebrow">LLD INTERVIEW PRACTICE</div>
          <h1>Practice the design,<br />not just the theory.</h1>
          <p>
            Work through realistic Low-Level Design problems, submit your
            thinking, and get structured feedback on your design decisions.
          </p>
        </div>

        <div className="hero-stat">
          <strong>{problems.length}</strong>
          <span>problems available</span>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <span className="eyebrow">PROBLEM SET</span>
          <h2>Choose a problem</h2>
        </div>
        <span className="muted">
          Focus on responsibilities, relationships & trade-offs.
        </span>
      </div>

      {loading && problems.length === 0 ? (
        <div className="empty-state">Loading problems...</div>
      ) : (
        <div className="problem-grid">
          {problems.map((problem, index) => (
            <button
              className="problem-card"
              key={problem.id}
              onClick={() => onSelect(problem)}
            >
              <div className="card-top">
                <span className="problem-number">
                  0{index + 1}
                </span>
                <span className="difficulty">LLD</span>
              </div>

              <h3>{problem.title}</h3>

              <p>{problem.description}</p>

              <div className="card-footer">
                <span>View problem</span>
                <span className="arrow">→</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ProblemDetailsView({
  problem,
  onBack,
  onStart,
  onHistory,
}: {
  problem: Problem;
  onBack: () => void;
  onStart: () => void;
  onHistory: () => void;
}) {
  return (
    <section className="page narrow">
      <button className="back-button" onClick={onBack}>
        ← All problems
      </button>

      <div className="detail-header">
        <div className="eyebrow">LLD PROBLEM</div>
        <h1>{problem.title}</h1>
        <p>{problem.description}</p>
      </div>

      <div className="detail-layout">
        <article className="content-card">
          <span className="eyebrow">PROBLEM CONTEXT</span>
          <h2>What you need to design</h2>

          <p className="detail-copy">
            Read the requirements carefully, identify the core domain
            objects, define their responsibilities, and explain how they
            collaborate.
          </p>

          <div className="principles">
            <div>
              <span>01</span>
              <strong>Requirements</strong>
              <p>Capture assumptions and important business rules.</p>
            </div>

            <div>
              <span>02</span>
              <strong>Domain model</strong>
              <p>Define classes, interfaces and clear responsibilities.</p>
            </div>

            <div>
              <span>03</span>
              <strong>Design reasoning</strong>
              <p>Explain relationships, trade-offs and future changes.</p>
            </div>

            <div>
              <span>04</span>
              <strong>Edge cases</strong>
              <p>Think about invalid states and unusual scenarios.</p>
            </div>
          </div>
        </article>

        <aside className="action-card">
          <span className="eyebrow">READY?</span>
          <h3>Start your attempt</h3>
          <p>
            You can submit your design when you're ready. Your attempt and
            feedback will be saved for later comparison.
          </p>

          <button className="primary-button" onClick={onStart}>
            Start Practice <span>→</span>
          </button>

          <button className="secondary-button" onClick={onHistory}>
            View Attempt History
          </button>
        </aside>
      </div>
    </section>
  );
}

function PracticeView({
  problem,
  attempt,
  form,
  loading,
  onBack,
  onChange,
  onSubmit,
}: {
  problem: Problem;
  attempt: Attempt;
  form: typeof emptyForm;
  loading: boolean;
  onBack: () => void;
  onChange: (field: keyof typeof emptyForm, value: string) => void;
  onSubmit: () => void;
}) {
  const fields: {
    key: keyof typeof emptyForm;
    title: string;
    description: string;
    placeholder: string;
  }[] = [
      {
        key: "requirementsAndAssumptions",
        title: "Requirements & assumptions",
        description: "What does the system need to support? What assumptions are you making?",
        placeholder:
          "Example: The vending machine supports multiple products, accepts predefined coin denominations...",
      },
      {
        key: "classesAndInterfaces",
        title: "Classes & interfaces",
        description: "List the core abstractions you would introduce.",
        placeholder:
          "Example: VendingMachine, Product, Inventory, PaymentProcessor, DispensingService...",
      },
      {
        key: "responsibilities",
        title: "Responsibilities",
        description: "Explain what each important class or interface is responsible for.",
        placeholder:
          "Example: Inventory manages stock levels. PaymentProcessor validates payment...",
      },
      {
        key: "relationships",
        title: "Relationships",
        description: "Explain how your objects collaborate.",
        placeholder:
          "Example: VendingMachine delegates payment validation to PaymentProcessor...",
      },
      {
        key: "rationale",
        title: "Design rationale",
        description: "Why did you choose this structure?",
        placeholder:
          "Explain the reasoning behind your abstractions and responsibility boundaries...",
      },
      {
        key: "tradeoffs",
        title: "Trade-offs & extensibility",
        description: "What did you optimize for? How could the design evolve?",
        placeholder:
          "Example: Strategy allows different payment methods without changing the machine...",
      },
      {
        key: "edgeCases",
        title: "Edge cases",
        description: "What failures, invalid states or unusual cases should the design handle?",
        placeholder:
          "Example: insufficient payment, product unavailable, invalid coin, concurrent purchase...",
      },
    ];

  return (
    <section className="page practice-page">
      <div className="practice-top">
        <button className="back-button" onClick={onBack}>
          ← Problem
        </button>

        <div className="attempt-indicator">
          <span>ATTEMPT</span>
          <strong>{attempt.id.slice(0, 8)}</strong>
        </div>
      </div>

      <div className="practice-heading">
        <div className="eyebrow">DESIGN SUBMISSION</div>
        <h1>{problem.title}</h1>
        <p>
          Write your design thinking clearly. The evaluator will look for
          evidence in your reasoning, not just keywords.
        </p>
      </div>

      <div className="form-layout">
        <div className="form-column">
          {fields.map((field, index) => (
            <div className="field-card" key={field.key}>
              <div className="field-heading">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{field.title}</h3>
                  <p>{field.description}</p>
                </div>
              </div>

              <textarea
                value={form[field.key]}
                onChange={(event) =>
                  onChange(field.key, event.target.value)
                }
                placeholder={field.placeholder}
                rows={5}
              />

              <div className="character-count">
                {form[field.key].length} characters
                {form[field.key].length > 0 &&
                  form[field.key].length < 20 &&
                  " · minimum 20"}
              </div>
            </div>
          ))}

          <div className="field-card optional">
            <div className="field-heading">
              <span>08</span>
              <div>
                <h3>Optional code / pseudocode</h3>
                <p>Include a small snippet only if it helps explain your design.</p>
              </div>
            </div>

            <textarea
              className="code-area"
              value={form.codeSnippet}
              onChange={(event) =>
                onChange("codeSnippet", event.target.value)
              }
              placeholder="// Optional pseudocode or class skeleton"
              rows={8}
            />
          </div>

          <div className="submit-panel">
            <div>
              <strong>Ready to submit?</strong>
              <p>
                Your submission will be evaluated and the result will be
                stored in your attempt history.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? "Evaluating..." : "Submit Design →"}
            </button>
          </div>
        </div>

        <aside className="practice-sidebar">
          <div className="sticky-card">
            <span className="eyebrow">DESIGN CHECKLIST</span>

            <div className="checklist">
              <div>
                <span>✓</span>
                <p>Clear domain responsibilities</p>
              </div>
              <div>
                <span>✓</span>
                <p>Interfaces where variation exists</p>
              </div>
              <div>
                <span>✓</span>
                <p>Low unnecessary coupling</p>
              </div>
              <div>
                <span>✓</span>
                <p>Realistic edge cases</p>
              </div>
              <div>
                <span>✓</span>
                <p>Concrete trade-offs</p>
              </div>
            </div>

            <div className="sidebar-note">
              <strong>Tip</strong>
              <p>
                Don't add patterns just to demonstrate them. Explain why an
                abstraction is useful for this particular problem.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function FeedbackView({
  problem,
  evaluation,
  attempt,
  onRetry,
  onHistory,
  onProblems,
}: {
  problem: Problem;
  evaluation: Evaluation;
  attempt: Attempt | null;
  onRetry: () => void;
  onHistory: () => void;
  onProblems: () => void;
}) {
  return (
    <section className="page">
      <div className="feedback-header">
        <div>
          <div className="eyebrow">EVALUATION COMPLETE</div>
          <h1>{problem.title}</h1>
          <p>{evaluation.overallSummary}</p>
        </div>

        <div className={`overall-score ${scoreClassName(evaluation.overallScore)}`}>
          <strong>{evaluation.overallScore.toFixed(1)}</strong>
          <span>/ 10</span>
        </div>
      </div>

      <div className="feedback-actions">
        <button className="primary-button" onClick={onRetry}>
          Retry Problem →
        </button>
        <button className="secondary-button" onClick={onHistory}>
          View History
        </button>
        <button className="text-button" onClick={onProblems}>
          All Problems
        </button>
      </div>

      <div className="feedback-grid">
        {evaluation.criteria.map((criterion) => (
          <article className="criterion-card" key={criterion.criterion}>
            <div className="criterion-top">
              <div>
                <span className="eyebrow">
                  {criterionLabel(criterion.criterion)}
                </span>
              </div>

              <div className={`criterion-score ${scoreClassName(criterion.score)}`}>
                {criterion.score}/10
              </div>
            </div>

            <div className="feedback-section">
              <span>Evidence</span>
              <p>{criterion.evidence}</p>
            </div>

            <div className="feedback-section concern">
              <span>Concern</span>
              <p>{criterion.concern}</p>
            </div>

            <div className="feedback-section suggestion">
              <span>Suggestion</span>
              <p>{criterion.suggestion}</p>
            </div>

            <div className="confidence">
              Confidence: {Math.round(criterion.confidence * 100)}%
            </div>
          </article>
        ))}
      </div>

      {evaluation.topImprovements.length > 0 && (
        <section className="improvement-card">
          <div>
            <span className="eyebrow">NEXT ITERATION</span>
            <h2>Top improvements</h2>
          </div>

          <ol>
            {evaluation.topImprovements.map((improvement, index) => (
              <li key={index}>{improvement}</li>
            ))}
          </ol>
        </section>
      )}

      {attempt && (
        <div className="completion-note">
          <span>✓</span>
          <div>
            <strong>Attempt completed</strong>
            <p>
              Your feedback has been stored. Retry this problem to compare
              how your design improves over time.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function HistoryView({
  problem,
  history,
  onBack,
  onOpenAttempt,
  scoreClass,
}: {
  problem: Problem;
  history: HistoryItem[];
  onBack: () => void;
  onOpenAttempt: (item: HistoryItem) => void;
  scoreClass: (score: number) => string;
}) {
  const completed = history.filter((item) => item.evaluation);
  const bestScore =
    completed.length > 0
      ? Math.max(
        ...completed.map((item) => item.evaluation!.overallScore),
      )
      : null;

  return (
    <section className="page narrow">
      <button className="back-button" onClick={onBack}>
        ← {problem.title}
      </button>

      <div className="history-header">
        <div>
          <div className="eyebrow">ATTEMPT HISTORY</div>
          <h1>Your progress</h1>
          <p>
            Review previous designs and see whether your feedback is turning
            into better decisions.
          </p>
        </div>

        <div className="history-stats">
          <div>
            <strong>{history.length}</strong>
            <span>attempts</span>
          </div>

          <div>
            <strong>{bestScore !== null ? bestScore.toFixed(1) : "—"}</strong>
            <span>best score</span>
          </div>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <strong>No attempts yet.</strong>
          <p>Start practicing this problem to build your history.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item, index) => (
            <button
              className="history-row"
              key={item.attempt.id}
              onClick={() => onOpenAttempt(item)}
            >
              <div className="history-number">
                {String(history.length - index).padStart(2, "0")}
              </div>

              <div className="history-main">
                <strong>
                  Attempt {history.length - index}
                </strong>
                <span>
                  {formatDate(item.attempt.startedAt)}
                </span>
              </div>

              <div className="history-status">
                <span className={`status-dot ${item.attempt.status.toLowerCase()}`} />
                {statusLabel(item.attempt.status)}
              </div>

              <div className="history-score">
                {item.evaluation ? (
                  <span className={scoreClass(item.evaluation.overallScore)}>
                    {item.evaluation.overallScore.toFixed(1)}
                  </span>
                ) : (
                  <span>—</span>
                )}
              </div>

              <span className="history-arrow">→</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function scoreClassName(score: number) {
  if (score >= 8) return "score-good";
  if (score >= 6) return "score-mid";
  return "score-low";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to complete the request.";
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function criterionLabel(criterion: string) {
  return criterion
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default App;