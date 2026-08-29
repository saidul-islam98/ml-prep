# Source-to-template mapping manifest

Status: **Complete (Task 6).** Reconciled to exactly **196 active hours** across
**109 template tasks**, **3 projects**, **15 milestones**, and **13 readiness
gate rows**. This manifest is the reviewable coverage manifest required by
`docs/WEBAPP_SPEC.md` §11; the Task 7 template v1 artifacts (frontend JSON and
database SQL) must match these stable keys and minutes exactly.

Sources (read together with this manifest):

- Narrative source: `/home/ivlr/Study/Job Search/cohere/COHERE_MTS_PREPARATION_PLAN.md`
  (authoritative for career content, dates, routines, projects, gates, workload, role alignment)
- Behavior source: `/home/ivlr/Study/Job Search/cohere/docs/WEBAPP_SPEC.md`
  (authoritative for application behavior, architecture, security, data semantics)
- Executable checklist: `tasks/todo.md` (repo-local synchronized copy)

Canonical window: **August 31 - December 6, 2026 (14 weeks), America/Toronto.**
Verified against the 2026 calendar: Aug 31 is a Monday; Dec 6 is a Sunday; every
week runs Monday-Sunday. Active budget: **196 hours** (14 weeks x 14 h =
11,760 minutes). Optional Post-Training track: **20 h (1,200 min)**, funded by
an explicitly mapped swap of 12 theory hours and 8 contingency hours (below);
enabling it never raises active scope above 196 h.

Stable key conventions: `w{NN}-{day}` for routine sessions (`mon..sun`),
`w{NN}-sun-review` for the weekly-review task, `pt-w{NN}-{slug}` for optional
Post-Training tasks, `p{1,2,3}-m{N}` for project milestones,
`{role}/{gate_key}` for readiness gates.

## 1. Workstreams

| Key       | Workstream                                   | Source budget (plan) | Mapped minutes | Mapped hours |
| --------- | -------------------------------------------- | -------------------: | -------------: | -----------: |
| project   | Required projects                            |                 64 h |          4,710 |       78.5 h |
| coding    | Timed coding and review                      |                 30 h |          1,200 |         20 h |
| study     | Evaluation, systems, and post-training study |                 42 h |          1,680 |         28 h |
| mock      | Mock interviews and corrections              |                 24 h |          2,070 |       34.5 h |
| app       | Resumes, applications, narratives, outreach  |                 20 h |          1,290 |       21.5 h |
| review    | Weekly review and contingency                |                 16 h |            810 |       13.5 h |
| **total** |                                              |            **196 h** |     **11,760** |    **196 h** |

Reconciliation note (documented, not silent): the source plan's six-way budget
is directional, and its own default weekly routine (which the plan fixes as
Mon 2 h coding, Tue 2 h theory, Wed 2 h systems, Thu 2 h project, Fri 1 h
applications, Sat 3.5 h project, Sun 1.5 h mock/review) cannot simultaneously
produce those six exact bucket totals - e.g. the routine alone yields 28 h of
coding versus the 30 h bucket and 77 h of project time versus 64 h. The
mapping preserves **every weekly bullet and every routine session** (no source
content omitted, nothing invented), assigns each generated task to the closest
workstream, and reconciles the total to exactly 196 h. Task-category choices
at bucket boundaries (e.g. "coding mock" counted as mock, "implement metrics"
counted as project) are recorded per task below. Category deltas versus the
source buckets are therefore expected and shown, not hidden.

## 2. Recurrence expansion rules

1. The default weekly routine expands into concrete dated tasks for all 14
   weeks (Monday-Sunday, America/Toronto).
2. Week-specific bullets from the plan's "Fourteen-week execution plan" are
   expressed as the concrete deliverables of the session they belong to; the
   seven routine slots stay at their canonical weekday, minute total, and
   category unless the weekly plan reassigns that slot's focus.
3. Sunday is split into two tasks: the session proper (`w{NN}-sun`, mock or
   application work) and the weekly review (`w{NN}-sun-review`, 30-90 min).
   Weeks 12-14 follow their loop-focused structure.
4. Fixed interview/application deadlines never shift: Data/Eval submission on
   Sep 6 (w01-sun), Agentic Environments submission on Sep 8 (w02-tue).
5. Exit checks are stored on `plan_weeks.exit_check` and enforced as the
   acceptance criteria of the week's review task (explicit task, not prose).
6. The Monday routine includes a 2-minute check of the official Cohere careers
   page for role closures (source: "Re-check ... every Monday"), inside the
   existing Monday session minutes.
7. The "minimum viable week" routine is contingency guidance for overloaded
   weeks and is NOT pre-seeded (it would inflate the 196-hour budget).
8. The "Immediate checklist (next 72 hours)" items map onto Week 1 tasks:
   calendar blocking -> Settings reminder flow; evidence sheets -> w01-wed;
   metrics recovery + intro recording + contacts -> w01-sat; resumes ->
   w01-fri/w01-sat; Python baseline -> w01-mon; architecture -> w01-thu;
   review arrangements -> w01-sat.

## 3. Weekly mapping (all times in minutes; all dates 2026, America/Toronto)

### Week 1 - Aug 31 - Sep 6: positioning and baselines

| Key            | Date   | Day | Category | Min | Task (source bullet)                                                                                                                      |
| -------------- | ------ | --- | -------- | --: | ----------------------------------------------------------------------------------------------------------------------------------------- |
| w01-mon        | Aug 31 | Mon | coding   | 120 | Python coding baseline (45 min timed, no notes); set up mistake log (Week 1: baselines)                                                   |
| w01-tue        | Sep 1  | Tue | study    | 120 | Agent-eval design baseline (45 min, no notes); task/verifier concept prep                                                                 |
| w01-wed        | Sep 2  | Wed | app      | 120 | Requirement/evidence/gap row for every bullet in both priority descriptions                                                               |
| w01-thu        | Sep 3  | Thu | project  | 120 | Specify Projects 1-2 and non-goals; architecture + experiment plans before coding                                                         |
| w01-fri        | Sep 4  | Fri | app      |  60 | Draft Data/Evaluation resume with three-line focused summary                                                                              |
| w01-sat        | Sep 5  | Sat | app      | 180 | Recover exact metrics for six CV claims; record 90-second intro + two 5-min deep dives; identify 8-12 contacts; arrange focused review    |
| w01-sun        | Sep 6  | Sun | app      |  90 | **Fixed deadline:** focused review applied; submit Data Analysis and Evaluation application by Sep 6; archive submitted resume + answers  |
| w01-sun-review | Sep 6  | Sun | review   |  30 | Weekly scorecard; exit check: Data/Eval submitted, Agentic draft, evidence sheets, project design, coding baseline, no unsupported claims |

Week 1 total: 840 min.

### Week 2 - Sep 7 - 13: application sprint

| Key            | Date   | Day | Category | Min | Task                                                                                                              |
| -------------- | ------ | --- | -------- | --: | ----------------------------------------------------------------------------------------------------------------- |
| w02-mon        | Sep 7  | Mon | coding   | 120 | Two timed coding problems (hash maps/strings, intervals, graph traversal, heap/top-k), fully reviewed             |
| w02-tue        | Sep 8  | Tue | app      | 120 | **Fixed deadline:** second technical review of Agentic resume; submit Agentic Environments by Sep 8; archive copy |
| w02-wed        | Sep 9  | Wed | project  | 120 | Project 1: task schema, environment interface, trajectory schema, deterministic verifier skeleton                 |
| w02-thu        | Sep 10 | Thu | project  | 120 | Project 1: environment/trajectory implementation + tests                                                          |
| w02-fri        | Sep 11 | Fri | app      |  60 | Interview narratives 1-2: benchmark design; agent failure                                                         |
| w02-sat        | Sep 12 | Sat | project  | 210 | Deep block: finish Project 1 skeletons; end-to-end smoke task -> trajectory -> verifier                           |
| w02-sun        | Sep 13 | Sun | app      |  60 | Interview narratives 3-4: inference optimization; disagreement/failed experiment                                  |
| w02-sun-review | Sep 13 | Sun | review   |  30 | Weekly scorecard; exit check: both applications submitted, copy archived, recruiter screen ready                  |

Week 2 total: 840 min.

### Week 3 - Sep 14 - 20: evaluation statistics

| Key            | Date   | Day | Category | Min | Task                                                                                                                                                      |
| -------------- | ------ | --- | -------- | --: | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| w03-mon        | Sep 14 | Mon | coding   | 120 | Two timed coding problems + full review                                                                                                                   |
| w03-tue        | Sep 15 | Tue | project  | 120 | Project 1: implement task-level metrics, stratified slices, bootstrap CIs, paired comparison                                                              |
| w03-wed        | Sep 16 | Wed | study    | 120 | Study: sampling bias, leakage, multiple comparisons, power, calibration, Cohen's kappa/Krippendorff's alpha, bootstrap vs permutation, pass@k, judge bias |
| w03-thu        | Sep 17 | Thu | project  | 120 | Project 1: human-labeling guide with edge cases and adjudication; pilot instructions                                                                      |
| w03-fri        | Sep 18 | Fri | study    |  60 | Paper excerpt: judge bias; notes on how each metric can mislead                                                                                           |
| w03-sat        | Sep 19 | Sat | project  | 210 | Metrics tested on synthetic fixtures; provenance fields; slices run                                                                                       |
| w03-sun        | Sep 20 | Sun | mock     |  60 | Statistics mock                                                                                                                                           |
| w03-sun-review | Sep 20 | Sun | review   |  30 | Exit check: metrics tested on synthetic fixtures; explain why each metric can mislead                                                                     |

Week 3 total: 840 min.

### Week 4 - Sep 21 - 27: agent environments and optional-role decision

| Key            | Date   | Day | Category | Min | Task                                                                                                                               |
| -------------- | ------ | --- | -------- | --: | ---------------------------------------------------------------------------------------------------------------------------------- |
| w04-mon        | Sep 21 | Mon | coding   | 120 | Two timed coding problems + review                                                                                                 |
| w04-tue        | Sep 22 | Tue | project  | 120 | Project 1: implement two tool-use environments + trajectory logging                                                                |
| w04-wed        | Sep 23 | Wed | project  | 120 | Add failures: invalid arguments, irrelevant retrieval, timeout, stale state, partial completion                                    |
| w04-thu        | Sep 24 | Thu | project  | 120 | First baseline; manually inspect >= 20 trajectories; failure taxonomy log                                                          |
| w04-fri        | Sep 25 | Fri | app      |  60 | Post-Training evidence honesty check; confirm Canada option for Agentic in application form                                        |
| w04-sat        | Sep 26 | Sat | project  | 210 | Fix baseline issues; convert findings into task/verifier improvements; demo run                                                    |
| w04-sun        | Sep 27 | Sun | mock     |  60 | 45-minute "design an enterprise-agent eval" mock                                                                                   |
| w04-sun-review | Sep 27 | Sun | review   |  30 | **Record Post-Training go/no-go decision** with rationale; exit check: end-to-end run works; every failure category has an example |

Week 4 total: 840 min.

### Week 5 - Sep 28 - Oct 4: judge and annotation calibration

| Key            | Date   | Day | Category | Min | Task                                                                                                                  |
| -------------- | ------ | --- | -------- | --: | --------------------------------------------------------------------------------------------------------------------- |
| w05-mon        | Sep 28 | Mon | coding   | 120 | Two timed coding problems + review                                                                                    |
| w05-tue        | Sep 29 | Tue | project  | 120 | Pilot annotation instructions; run the three-annotator study                                                          |
| w05-wed        | Sep 30 | Wed | study    | 120 | Measure human-human and human-judge agreement; investigate disagreements; revise rubric once; report pre/post results |
| w05-thu        | Oct 1  | Thu | project  | 120 | Rubric/model-based verifier; data versioning, deterministic fixtures, provenance                                      |
| w05-fri        | Oct 2  | Fri | app      |  60 | 2-3 genuine professional conversations; thank-you note with one insight acted on                                      |
| w05-sat        | Oct 3  | Sat | project  | 210 | Begin Project 2: sequential/Ray runners, idempotent task IDs, checkpoint/resume design, DDP scaffolding               |
| w05-sun        | Oct 4  | Sun | mock     |  60 | Behavioral mock                                                                                                       |
| w05-sun-review | Oct 4  | Sun | review   |  30 | Exit check: judge reliability quantified rather than asserted                                                         |

Week 5 total: 840 min.

### Week 6 - Oct 5 - 11: production-quality release

| Key            | Date   | Day | Category | Min | Task                                                                                    |
| -------------- | ------ | --- | -------- | --: | --------------------------------------------------------------------------------------- |
| w06-mon        | Oct 5  | Mon | coding   | 120 | Two timed coding problems + review                                                      |
| w06-tue        | Oct 6  | Tue | project  | 120 | Project 1: unit/integration tests, typing, linting, CI                                  |
| w06-wed        | Oct 7  | Wed | project  | 120 | Structured logs, failure recovery, cost/latency reporting; credential-free smoke test   |
| w06-thu        | Oct 8  | Thu | project  | 120 | Two-page design doc + design tradeoffs + results chart                                  |
| w06-fri        | Oct 9  | Fri | app      |  60 | Ask 3 domain-relevant reviewers for technical criticism; track feedback issues publicly |
| w06-sat        | Oct 10 | Sat | project  | 210 | Publish Project 1 v0.1 + short demo; fix review-blocking issues; tag release            |
| w06-sun        | Oct 11 | Sun | mock     |  60 | Recorded Project 1 design deep-dive + rubric self-score                                 |
| w06-sun-review | Oct 11 | Sun | review   |  30 | Exit check + **Project 1 completion-gate self-check**: fresh clone runs smoke suite     |

Week 6 total: 840 min.

### Week 7 - Oct 12 - 18: LLM systems foundations

| Key            | Date   | Day | Category | Min | Task                                                                                                                          |
| -------------- | ------ | --- | -------- | --: | ----------------------------------------------------------------------------------------------------------------------------- |
| w07-mon        | Oct 12 | Mon | coding   | 120 | Two timed coding problems + review                                                                                            |
| w07-tue        | Oct 13 | Tue | study    | 120 | Derive transformer attention, causal masking, cross-entropy, normalization, KV-cache memory/latency                           |
| w07-wed        | Oct 14 | Wed | study    | 120 | Tokenization, positional methods, batching, continuous batching, quantization, speculative decoding, memory vs compute bounds |
| w07-thu        | Oct 15 | Thu | project  | 120 | Project 2: load tests at three concurrency levels and two batching settings; structured metrics                               |
| w07-fri        | Oct 16 | Fri | study    |  60 | Connect to vLLM results: throughput/latency explanation from measurements                                                     |
| w07-sat        | Oct 17 | Sat | project  | 210 | Profile small inference/rollout workload (torch.profiler + memory); record bottleneck evidence                                |
| w07-sun        | Oct 18 | Sun | mock     |  60 | Inference-system design mock                                                                                                  |
| w07-sun-review | Oct 18 | Sun | review   |  30 | Exit check: core concepts on a whiteboard, connected to vLLM results                                                          |

Week 7 total: 840 min.

### Week 8 - Oct 19 - 25: distributed training

| Key            | Date   | Day | Category | Min | Task                                                                                                                                                            |
| -------------- | ------ | --- | -------- | --: | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| w08-mon        | Oct 19 | Mon | coding   | 120 | Two timed coding problems + review                                                                                                                              |
| w08-tue        | Oct 20 | Tue | study    | 120 | DDP, FSDP/ZeRO, tensor/pipeline parallelism, activation checkpointing, gradient accumulation, mixed precision, all-reduce, sharding, straggler/failure handling |
| w08-wed        | Oct 21 | Wed | study    | 120 | Profiling workflow: GPU utilization, data stalls, communication, memory fragmentation, OOM diagnosis, reproducibility                                           |
| w08-thu        | Oct 22 | Thu | project  | 120 | Project 2: single-process vs two-process DDP correctness; injected-failure resume without duplicated samples                                                    |
| w08-fri        | Oct 23 | Fri | project  |  60 | Container; distributed data partitioning tests                                                                                                                  |
| w08-sat        | Oct 24 | Sat | project  | 210 | Profiler analysis + benchmark report: tokens/s, peak memory, scaling efficiency with explicit assumptions; demo                                                 |
| w08-sun        | Oct 25 | Sun | mock     |  60 | Training-system design mock                                                                                                                                     |
| w08-sun-review | Oct 25 | Sun | review   |  30 | Exit check + **Project 2 completion-gate self-check**: interrupted run resumes without duplicate data                                                           |

Week 8 total: 840 min.

### Week 9 - Oct 26 - Nov 1: post-training depth

| Key            | Date   | Day | Category | Min | Task                                                                                                                | PT swap               |
| -------------- | ------ | --- | -------- | --: | ------------------------------------------------------------------------------------------------------------------- | --------------------- |
| w09-mon        | Oct 26 | Mon | coding   | 120 | Two timed coding problems + review                                                                                  |                       |
| w09-tue        | Oct 27 | Tue | study    | 120 | Re-derive SFT, reward modeling, DPO, PPO-style RLHF, GRPO, RLVR objectives                                          | deactivated on unlock |
| w09-wed        | Oct 28 | Wed | study    | 120 | Reward hacking, KL control, on/off-policy, credit assignment, verifier design, sampling, instability, contamination | deactivated on unlock |
| w09-thu        | Oct 29 | Thu | project  | 120 | Execute the Week-4 decision: Project 3 setup if enabled, else weak Agentic gate repair                              |                       |
| w09-fri        | Oct 30 | Fri | app      |  60 | Defend RL-Text2Vis reward/evaluation design; draft what you would change at scale                                   |                       |
| w09-sat        | Oct 31 | Sat | project  | 210 | Project 1 ablation-matrix prep, or first Project 3 experiment per decision                                          |                       |
| w09-sun        | Nov 1  | Sun | mock     |  60 | Post-training design mock                                                                                           |                       |
| w09-sun-review | Nov 1  | Sun | review   |  30 | Exit check: defend RL-Text2Vis design decisions                                                                     | deactivated on unlock |

Week 9 total: 840 min.

### Week 10 - Nov 2 - 8: product evaluation and agent reliability

| Key            | Date  | Day | Category | Min | Task                                                                                                                                   | PT swap               |
| -------------- | ----- | --- | -------- | --: | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| w10-mon        | Nov 2 | Mon | coding   | 120 | Two timed coding problems + review                                                                                                     |                       |
| w10-tue        | Nov 3 | Tue | project  | 120 | Convert three observed failures into regression cases; no new environments                                                             |                       |
| w10-wed        | Nov 4 | Wed | study    | 120 | Privacy-preserving telemetry, consent, PII minimization, retention, access control, auditability, prompt injection, tool authorization | deactivated on unlock |
| w10-thu        | Nov 5 | Thu | study    | 120 | Five ambiguous product complaints -> hypotheses, slices, tasks, rubrics, decision thresholds                                           | deactivated on unlock |
| w10-fri        | Nov 6 | Fri | app      |  60 | Update resumes/evidence sheets with Project 2 evidence; Ray/Kubernetes only after real evidence                                        |                       |
| w10-sat        | Nov 7 | Sat | project  | 210 | Regression suite wired into CI; verify thresholds; case write-up                                                                       |                       |
| w10-sun        | Nov 8 | Sun | mock     |  60 | 60-minute case: "How would you know a tool-using enterprise agent got better without hiding regressions?"                              |                       |
| w10-sun-review | Nov 8 | Sun | review   |  30 | Exit check: recommendations connect metrics to decisions                                                                               | deactivated on unlock |

Week 10 total: 840 min.

### Week 11 - Nov 9 - 15: experiment report

| Key            | Date   | Day | Category | Min | Task                                                                                                              | PT swap               |
| -------------- | ------ | --- | -------- | --: | ----------------------------------------------------------------------------------------------------------------- | --------------------- |
| w11-mon        | Nov 9  | Mon | mock     | 120 | Coding mock 1 (timed, recorded) + rubric scoring                                                                  |                       |
| w11-tue        | Nov 10 | Tue | project  | 120 | Run Project 1 baseline/ablation matrix                                                                            |                       |
| w11-wed        | Nov 11 | Wed | mock     | 120 | Coding mock 2 + scoring                                                                                           |                       |
| w11-thu        | Nov 12 | Thu | project  | 120 | Finalize Project 2 profiling comparison; uncertainty, cost, latency, disagreement, slices, regressions, negatives |                       |
| w11-fri        | Nov 13 | Fri | project  |  60 | Technical report + executive summary (draft)                                                                      |                       |
| w11-sat        | Nov 14 | Sat | project  | 210 | Finish report; another ML engineer can audit claims from configs + artifacts                                      |                       |
| w11-sun        | Nov 15 | Sun | mock     |  60 | Research deep-dive mock                                                                                           |                       |
| w11-sun-review | Nov 15 | Sun | review   |  30 | Exit check: audit-ready claim from configs and result artifacts                                                   | deactivated on unlock |

Week 11 total: 840 min.

### Week 12 - Nov 16 - 22: full interview loop I

| Key            | Date   | Day | Category | Min | Task                                                                                                                      | PT swap               |
| -------------- | ------ | --- | -------- | --: | ------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| w12-mon        | Nov 16 | Mon | mock     | 120 | Live-coding mock + scoring                                                                                                |                       |
| w12-tue        | Nov 17 | Tue | mock     | 120 | ML fundamentals mock + scoring                                                                                            |                       |
| w12-wed        | Nov 18 | Wed | mock     | 120 | ML system-design mock + scoring                                                                                           |                       |
| w12-thu        | Nov 19 | Thu | mock     | 120 | Project/behavioral mock + scoring                                                                                         |                       |
| w12-fri        | Nov 20 | Fri | app      |  60 | Update both resumes + evidence sheets with the two public projects; Post-Training derivative only if Project 3 defensible |                       |
| w12-sat        | Nov 21 | Sat | project  | 210 | Four-hour take-home simulation: tests, README, assumptions, analysis, clean final commit                                  |                       |
| w12-sun-review | Nov 22 | Sun | review   |  90 | Score all recordings; top-five weakness list; weekly review; exit check: no mock dimension below 3/5                      | deactivated on unlock |

Week 12 total: 840 min.

### Week 13 - Nov 23 - 29: targeted repair

| Key            | Date   | Day | Category | Min | Task                                                                                                  | PT swap               |
| -------------- | ------ | --- | -------- | --: | ----------------------------------------------------------------------------------------------------- | --------------------- |
| w13-mon        | Nov 23 | Mon | mock     | 120 | Coding mock + scoring                                                                                 |                       |
| w13-tue        | Nov 24 | Tue | study    | 120 | Deliberate practice on the two lowest mock dimensions (1)                                             | deactivated on unlock |
| w13-wed        | Nov 25 | Wed | study    | 120 | Deliberate practice on the two lowest mock dimensions (2)                                             | deactivated on unlock |
| w13-thu        | Nov 26 | Thu | mock     | 120 | Role-specific system-design mock 1                                                                    |                       |
| w13-fri        | Nov 27 | Fri | app      |  60 | Follow up with contacts using a concrete artifact; re-check current roles                             |                       |
| w13-sat        | Nov 28 | Sat | mock     | 210 | Role-specific system-design mock 2 (120); re-answer missed questions from scratch after 48 hours (90) |                       |
| w13-sun-review | Nov 29 | Sun | review   |  90 | Exit check: two consecutive mocks meet all readiness thresholds                                       | deactivated on unlock |

Week 13 total: 840 min.

### Week 14 - Nov 30 - Dec 6: full interview loop II and maintenance mode

| Key     | Date   | Day | Category | Min | Task                                                                                                                          | PT swap               |
| ------- | ------ | --- | -------- | --: | ----------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| w14-mon | Nov 30 | Mon | mock     | 120 | Simulated loop day 1: live coding + ML fundamentals                                                                           |                       |
| w14-tue | Dec 1  | Tue | mock     | 120 | Simulated loop day 1: ML system design                                                                                        |                       |
| w14-wed | Dec 2  | Wed | mock     | 120 | Simulated loop day 2: project deep-dive + behavioral                                                                          |                       |
| w14-thu | Dec 3  | Thu | app      | 120 | Finalize concise notes: project metrics, equations, systems estimates, Cohere/product reasons, questions per interviewer type |                       |
| w14-fri | Dec 4  | Fri | app      |  60 | Review applications; decide follow-ups or new applications; maintenance cadence (2 coding, 1 design, 1 review, 1 mock weekly) |                       |
| w14-sat | Dec 5  | Sat | review   | 210 | Final readiness-gate review: every gate passes or has a written mitigation                                                    | deactivated on unlock |
| w14-sun | Dec 6  | Sun | review   |  90 | Complete readiness matrix; confirm maintenance plan; exit check: all gates pass or mitigation written                         |                       |

Week 14 total: 840 min.

**Task count: 109. Total: 14 x 840 = 11,760 minutes = 196 hours.**

## 4. Reconciliation by week and workstream (minutes)

| Week    |    coding |     study |   project |       app |      mock |  review |      Total |
| ------- | --------: | --------: | --------: | --------: | --------: | ------: | ---------: |
| 1       |       120 |       120 |       120 |       450 |         0 |      30 |        840 |
| 2       |       120 |         0 |       450 |       240 |         0 |      30 |        840 |
| 3       |       120 |       180 |       450 |         0 |        60 |      30 |        840 |
| 4       |       120 |         0 |       570 |        60 |        60 |      30 |        840 |
| 5       |       120 |       120 |       450 |        60 |        60 |      30 |        840 |
| 6       |       120 |         0 |       570 |        60 |        60 |      30 |        840 |
| 7       |       120 |       300 |       330 |         0 |        60 |      30 |        840 |
| 8       |       120 |       240 |       390 |         0 |        60 |      30 |        840 |
| 9       |       120 |       240 |       330 |        60 |        60 |      30 |        840 |
| 10      |       120 |       240 |       330 |        60 |        60 |      30 |        840 |
| 11      |         0 |         0 |       510 |         0 |       300 |      30 |        840 |
| 12      |         0 |         0 |       210 |        60 |       480 |      90 |        840 |
| 13      |         0 |       240 |         0 |        60 |       450 |      90 |        840 |
| 14      |         0 |         0 |         0 |       180 |       360 |     300 |        840 |
| **sum** | **1,200** | **1,680** | **4,710** | **1,290** | **2,070** | **810** | **11,760** |

## 5. Optional Post-Training track (preseeded disabled)

Project 3 "Verifier-guided post-training mini-lab" (`project_key: post_training_lab`)
is 18-22 h in the plan; the mapped budget is exactly **1,200 minutes (20 h)**.
Its tasks are preseeded with `role_tags = {post_training}` and are excluded
from Today, Plan active lists, and all metrics until
`profiles.post_training_enabled = true`. The `unlock_post_training()` RPC
performs the swap atomically: validates Project 1 and Project 2 completion
gates with qualifying evidence, requires explicit opt-in, activates Project 3,
and skips the mapped deactivation set (open tasks only) with an audit event
recording the affected keys.

### 5.1 Post-Training activation tasks (1,200 min)

| Key                   | Week | Date   | Min | Task (source: Project 3 bullets)                                                                                                 |
| --------------------- | ---- | ------ | --: | -------------------------------------------------------------------------------------------------------------------------------- |
| pt-w9-scope           | 9    | Oct 29 | 150 | Select one narrow verifiable task from Project 1 and a genuinely small open model; write reproducible experiment config          |
| pt-w9-sft             | 9    | Oct 31 | 120 | Build a clean SFT baseline                                                                                                       |
| pt-w10-preference     | 10   | Nov 5  | 150 | Run one preference or verifiable-reward method feasible on available hardware (DPO or small GRPO)                                |
| pt-w10-rewards        | 10   | Nov 7  | 120 | Reuse deterministic verifiers as rewards; log reward components, KL/entropy, training stability                                  |
| pt-w11-ablation-setup | 11   | Nov 15 |  30 | Set up the reward-design ablation                                                                                                |
| pt-w12-ablation       | 12   | Nov 21 |  90 | Complete the reward-design ablation; inspect reward hacking/generalization failures                                              |
| pt-w13-eval           | 13   | Nov 26 | 210 | Held-out evaluation vs prompting/SFT under the same harness with confidence intervals and compute/cost disclosure                |
| pt-w13-docs           | 13   | Nov 27 | 120 | Failure analysis + model card                                                                                                    |
| pt-w14-final          | 14   | Dec 5  | 210 | Reproducibility check; "what would change at Cohere scale?" section; final write-up with training/eval curves and ablation table |

### 5.2 Deactivation swap (exactly 1,200 min; 12 h study + 8 h review)

| Key            | Category | Min | Replaced content                                                                         |
| -------------- | -------- | --: | ---------------------------------------------------------------------------------------- |
| w09-tue        | study    | 120 | SFT/RM/DPO/PPO/GRPO/RLVR derivation session (covered by Project 3 hands-on work)         |
| w09-wed        | study    | 120 | Reward hacking/KL session (covered by pt-w10-rewards logging + ablation)                 |
| w10-wed        | study    | 120 | Privacy/telemetry study                                                                  |
| w10-thu        | study    | 120 | Product-complaint drill                                                                  |
| w13-tue        | study    | 120 | Targeted repair 1                                                                        |
| w13-wed        | study    | 120 | Targeted repair 2                                                                        |
| w09-sun-review | review   |  30 | Weekly review                                                                            |
| w10-sun-review | review   |  30 | Weekly review                                                                            |
| w11-sun-review | review   |  30 | Weekly review                                                                            |
| w12-sun-review | review   |  90 | Recording-scoring review                                                                 |
| w13-sun-review | review   |  90 | Threshold-check review                                                                   |
| w14-sat        | review   | 210 | Final gate review (moved into w14-sun 90 + PT pt-w14-final 210 covers the final PT gate) |

Sum: study 720 (12 h) + review 480 (8 h) = 1,200 (20 h). Active plan remains
exactly 196 h after the swap. Deactivation applies to mapped tasks that are
still open at unlock time; tasks already resolved keep their historical
cohort (spec §8.2).

## 6. Projects and milestones

### Project 1 - EvalOps for tool-using enterprise agents (`evalops`, budget 1,950 min = 32.5 h, roles: data_eval, agent_env)

| Key   | Milestone               | Target date | Completion gate | Acceptance criteria                                                                                                                                |
| ----- | ----------------------- | ----------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| p1-m1 | Skeleton                | Sep 13      | no              | Task schema, environment interface, trajectory schema, deterministic verifier skeleton committed with tests                                        |
| p1-m2 | Environments + failures | Sep 27      | no              | Two environments, failure injection, first baseline, >= 20 trajectories manually inspected                                                         |
| p1-m3 | Metrics + statistics    | Sep 20      | no              | Task-level metrics, stratified slices, bootstrap CIs, paired comparison tested on synthetic fixtures                                               |
| p1-m4 | Annotation calibration  | Oct 4       | no              | Pilot instructions, three-annotator study, agreement measured, rubric revised once, pre/post reported                                              |
| p1-m5 | Release v0.1            | Oct 11      | **yes**         | Tests/CI/typing/lint pass; credential-free smoke; design doc + demo published; 3 reviewer criticisms tracked; fresh clone runs the smoke suite     |
| p1-m6 | Regression gates        | Nov 8       | no              | Three observed failures converted into regression tasks; thresholds enforced in CI                                                                 |
| p1-m7 | Technical report        | Nov 15      | no              | Baseline/ablation matrix run; report includes baselines, ablations, uncertainty, failure taxonomy, limitations; auditable from configs + artifacts |

### Project 2 - Distributed training and rollout reliability lab (`rollout_lab`, budget 1,650 min = 27.5 h, roles: agent_env, data_eval)

| Key   | Milestone            | Target date | Completion gate | Acceptance criteria                                                                                                                                                                      |
| ----- | -------------------- | ----------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| p2-m1 | Runners + DDP design | Oct 4       | no              | Sequential + Ray runners, bounded concurrency, retries with jitter, idempotent task IDs, checkpoint/resume design                                                                        |
| p2-m2 | Load + profile       | Oct 18      | no              | Rollout load test at >= 3 concurrency levels and 2 batching settings; torch.profiler evidence; throughput/latency explained from measurements                                            |
| p2-m3 | DDP + recovery       | Oct 25      | **yes**         | Single vs two-process DDP correctness; interrupted run resumes without duplicated samples; container + benchmark report + demo; profiling quantifies a real bottleneck with before/after |
| p2-m4 | Comparison + post    | Nov 15      | no              | Finalized profiling comparison; engineering post titled around a measured bottleneck                                                                                                     |

### Project 3 - Verifier-guided post-training mini-lab (`post_training_lab`, budget 1,200 min = 20 h, roles: post_training, state: locked)

| Key   | Milestone        | Target date | Completion gate | Acceptance criteria                                                                                                                                                              |
| ----- | ---------------- | ----------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| p3-m1 | SFT baseline     | Nov 1       | no              | Narrow verifiable task + small model selected; clean SFT baseline built                                                                                                          |
| p3-m2 | Method + rewards | Nov 8       | no              | One preference/verifiable-reward method run; deterministic verifiers as rewards; reward components + KL/entropy logged                                                           |
| p3-m3 | Ablation         | Nov 22      | no              | Reward-design ablation complete; reward hacking/generalization failures inspected                                                                                                |
| p3-m4 | Report           | Dec 6       | **yes**         | Reproducible configs, training/eval curves, ablation table, held-out evaluation with CIs, model card, "what would change at Cohere scale?" section; positive result not required |

## 7. Readiness gates (13 rows, evidence-based)

| Role          | Gate key     | Gate                             | Source definition                                                                                                                     |
| ------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| data_eval     | resume       | Resume gate                      | Reviewer can point to evidence for >= 80% of core requirements; every metric defensible                                               |
| data_eval     | recruiter    | Recruiter gate                   | 90-second intro, role motivation, location/authorization facts, six project summaries                                                 |
| data_eval     | evaluation   | Evaluation gate                  | Design an eval from an ambiguous complaint in 45 min (sampling, metrics, human process, uncertainty, failure analysis, decision rule) |
| data_eval     | research     | Research gate                    | Explain three papers/projects hypothesis-through-limitations; withstand three levels of "why?"                                        |
| data_eval     | project_1    | Project 1 gate                   | p1-m5 and p1-m7 complete with evidence                                                                                                |
| data_eval     | behavioral   | Behavioral gate                  | Six stories with decisions + measurable effects; two mocks >= 4/5                                                                     |
| agent_env     | coding       | Coding gate                      | Solve 8 of the latest 10 medium/practical Python tasks in 40 min with tests and correct complexity                                    |
| agent_env     | recruiter    | Recruiter gate                   | Same definition as data_eval recruiter gate                                                                                           |
| agent_env     | systems      | Systems gate                     | Two consecutive 45-min LLM system designs >= 4/5 on framing, scale estimates, bottlenecks, reliability, tradeoffs                     |
| agent_env     | project_2    | Project 2 gate                   | p2-m3 and p2-m4 complete with evidence                                                                                                |
| agent_env     | behavioral   | Behavioral gate                  | Same definition as data_eval behavioral gate                                                                                          |
| post_training | pt_ownership | Ownership evidence gate          | Documented ownership of >= 1 training loop, reward/data design, ablation, debugging episode, measured outcome                         |
| post_training | pt_project3  | Project 3 held-out evidence gate | p3-m4 complete; held-out evidence; an SFT notebook alone is insufficient                                                              |

Role interview-ready interpretation (spec view wiring): Data/Eval = resume,
evaluation, research, project_1, behavioral; Agentic Environments = coding,
systems, project_2, behavioral; Post-Training go/no-go = pt_ownership +
pt_project3. The recruiter gate appears on both primary role cards as
supporting evidence. Readiness statuses are explicit user assessments with
note or HTTPS evidence - never an inferred composite score.

## 8. Practice targets encoded in tasks

- Weekly coding target: two reviewed problems per Monday session (w01-w10),
  then mocks (w11-w14). The 30-problem career outcome is tracked through
  practice-session records and surfaced in Progress; the readiness "coding
  gate" uses the latest-ten qualifying predicate (spec §17).
- Mock target: 1 per week from Week 3; 2+ per week from Week 11 (scorecard).
- Practice sessions are records (`practice_sessions`) linked to the tasks
  above; correction tasks can be created from low mock scores (Task 12).

## 9. Coverage checklist (every source section accounted for)

- [x] Strategy/two-track applications: w01-sun, w02-tue fixed deadlines
- [x] Roles/fit scores: role_tags on all tasks; readiness role cards
- [x] Capacity check (196 h): reconciled tables above
- [x] CV gaps/evidence: w01-wed, w01-sat, w12-fri
- [x] Highest-leverage at-work evidence: folded into w01-wed evidence rows and project evidence fields (user-specific, not scheduled separately)
- [x] Outcomes required by Dec 6: distributed across tasks; verified by w14 gates
- [x] Projects 1-3: sections 5-6 above
- [x] Fourteen-week execution plan: weeks 1-14 tables above
- [x] Default weekly routine: expansion rules section 2
- [x] Minimum viable week: NOT seeded (rule 7) - documented contingency
- [x] Session protocol: encoded in task acceptance notes (artifact per session)
- [x] Interview curriculum: coding (Monday tasks), evaluation/statistics (w03), LLM/post-training fundamentals (w07-w09), system-design prompts (mock tasks w04/w07/w08/w09)
- [x] Six core stories: w01-sat, w02-fri, w02-sun, w09-fri
- [x] Application package: w01-fri, w02-tue, w10-fri, w12-fri, w14-thu
- [x] Evidence sheet: w01-wed, updated w10-fri, w12-fri
- [x] Outreach approach: w01-sat, w05-fri, w13-fri
- [x] "Why Cohere?": w14-thu notes
- [x] Mock rubric: eight dimensions in mock_scores (Task 12)
- [x] Readiness gates: section 7
- [x] Weekly scorecard: every wNN-sun-review
- [x] What not to do: guardrails in app copy (not tasks)
- [x] Immediate checklist: mapped per rule 8
- [x] Careers-page Monday re-check: rule 6
