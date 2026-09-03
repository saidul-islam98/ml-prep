# Gates: preparation-plan-grounded execution fixes

OWNS: src/curriculum/**, src/components/**, src/hooks/**, src/lib/api.ts, supabase/migrations/**, tests/**, scripts/verify-repository-scope.mjs, GATES.md

Scope: align every executable week and task with the canonical preparation plan, persist execution progress across devices, enforce completion gates, and verify accessible UI behavior without regressions

- [x] G0: this ledger passes gate-lint
      CHECK: node /home/ivlr/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
      EXPECT: LINT OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=48630b7361dd44ee870917b12c3d19b9d7bdea738aaca16bb04d4cab83b772d2; output-bytes=8

- [x] G1: every curriculum week and task remains aligned with the canonical template and uses specific execution guidance
      CHECK: npm test -- tests/unit/curriculum.test.ts && echo "CURRICULUM GROUNDING OK"
      EXPECT: CURRICULUM GROUNDING OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=21f81bb6f78abe92c379901c80b51df9a0ba494073e81b7aff2489f6accf1e59; output-bytes=388

- [x] G2: task progress, focus timing, resources, and completion-gate state persist through the shared data layer
      CHECK: npm test -- tests/unit/taskExecution.test.tsx tests/unit/taskExecutionState.test.ts && echo "EXECUTION STATE OK"
      EXPECT: EXECUTION STATE OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=3f287407ca30b4cc3a08bead9888278042751fd69b31203957023aa3de6c6a74; output-bytes=627

- [x] G3: every curriculum completion route uses the gate and records actual time plus a separate override reason
      CHECK: npm test -- tests/unit/taskCardExecution.test.tsx && echo "COMPLETION ROUTES OK"
      EXPECT: COMPLETION ROUTES OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=72affdbbf5b8ee0260d2d90ba24aae1e33250dd7671998bb033031e538c7e236; output-bytes=655

- [x] G4: task execution dialogs support keyboard dismissal, focus containment, and focus restoration
      CHECK: npm test -- tests/unit/taskExecutionAccessibility.test.tsx && echo "DIALOG ACCESSIBILITY OK"
      EXPECT: DIALOG ACCESSIBILITY OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=a15bf28f6dc13996f95250eff811e3d920e15263da323fd860f5879f27e58ea8; output-bytes=560

- [x] G5: all unit and integration tests pass with no deterministic regression
      CHECK: npm test && npm run test:integration && echo "ALL TESTS OK"
      EXPECT: ALL TESTS OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=fd64bb87f40981832635c3e850b2c3a612c7a2540dd78dd9d6c5eb5846400a75; output-bytes=17906

- [x] G6: typecheck, lint, formatting, production build, and GitHub Pages subpath routing pass
      CHECK: npm run typecheck && npm run lint && npm run format:check && npm run build && npm run verify:subpath
      EXPECT: verify:subpath passed
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=1403c79ef5f8c7777476a858bbba84862bdb71d853b7f5a7deeab9a22b71ea9c; output-bytes=2348

- [x] G7: repository contains no unrelated vendored agent payload
      CHECK: node scripts/verify-repository-scope.mjs
      EXPECT: REPOSITORY SCOPE OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=f0f8e839b16606f131d45f473e35168a18a52adc80eb9d099b76abbfde7fa3f3; output-bytes=20

---

# Gates: verifiable deliverables and coding problem bank

Scope: make required task artifacts individually verifiable and make the complete bookmarked LeetCode set schedulable and trackable while preserving the canonical preparation plan.

- [x] G8: every required deliverable has an independently persisted verification control and required evidence cannot be removed from a completed task without an audited override
      CHECK: npm test -- --run tests/unit/completionGateEvidence.test.tsx tests/unit/taskCardExecution.test.tsx && echo "DELIVERABLE GATES OK"
      EXPECT: DELIVERABLE GATES OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=b36f341b69f8/23 entries; EXPECT=matched; output-sha256=3053a87e684c59223d86950a477052e87ae28d32c59a0bc6d0a6365209c9b04b; output-bytes=1180

- [x] G9: the application exposes all 60 unique bookmarked problems and the canonical schedule accounts for at least 30 timed reviewed attempts
      CHECK: npm test -- --run tests/unit/codingProblems.test.ts tests/unit/practiceView.test.tsx && echo "PROBLEM BANK OK"
      EXPECT: PROBLEM BANK OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=b36f341b69f8/23 entries; EXPECT=matched; output-sha256=5f9a435afbef03678e69956a3bf78a3db74851dd0bc881c01d9ce58e03926d72; output-bytes=1165

- [x] G10: coding attempts persist problem identity, duration, result, review, mistake category, and re-solve status through the existing cross-device data layer
      CHECK: npm test -- --run tests/unit/practice.test.ts tests/unit/practiceView.test.tsx && echo "PRACTICE TRACKING OK"
      EXPECT: PRACTICE TRACKING OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=b36f341b69f8/23 entries; EXPECT=matched; output-sha256=fdc2ca7dfc83ffc1547fbdb2618a8b3a1cb4a01608d5252e4c8084a71741c83a; output-bytes=1251

- [ ] G11: the complete application remains type-safe, lint-clean, formatted, regression-tested, and production-buildable
      CHECK: npm run typecheck && npm run lint && npm run format:check && npm test && npm run test:integration && npm run build && npm run verify:subpath && echo "FULL VERIFICATION OK"
      EXPECT: FULL VERIFICATION OK
      EVIDENCE: pending

- [x] G12: the resulting task and coding workflows remain grounded to the canonical 196-hour preparation plan without making Post-Training mandatory
      CHECK: npm test -- --run tests/unit/templateV1.test.ts tests/unit/curriculum.test.ts tests/unit/planView.test.tsx && echo "PLAN GROUNDING OK"
      EXPECT: PLAN GROUNDING OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=b36f341b69f8/23 entries; EXPECT=matched; output-sha256=6fa190f024330f3ebe50658dac721932bdac228f85fa75f2b47047ecc0a427d9; output-bytes=1002
