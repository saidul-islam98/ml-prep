# Gates: ML Prep UI and Curriculum Execution Upgrade

OWNS: src/curriculum/**, src/components/**, src/views/**, src/styles/**, src/template/**, tests/**, GATES.md

Scope: upgrade ml-prep into an atomic, execution-focused curriculum system with rich task schemas, progressive disclosure, completion gates, focus mode, and week-level objectives without breaking existing tests

- [x] G0: this ledger passes gate-lint
      CHECK: node /home/ivlr/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
      EXPECT: LINT OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=0b5aa7d3a930/22 entries; EXPECT=matched; output-sha256=48630b7361dd44ee870917b12c3d19b9d7bdea738aaca16bb04d4cab83b772d2; output-bytes=8

- [x] G1: curriculum data model and modules are created and typecheck cleanly
      CHECK: npx tsc --noEmit && echo "TYPECHECK OK"
      EXPECT: TYPECHECK OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=0b5aa7d3a930/22 entries; EXPECT=matched; output-sha256=94ea5507ba55d47c963dba08c13a671caadc1eadfff4d46924771892d3d5ef1a; output-bytes=13

- [x] G2: new curriculum and UI execution component tests pass
      CHECK: npx vitest run tests/unit/curriculum.test.ts tests/unit/taskExecution.test.tsx && echo "CURRICULUM TESTS OK"
      EXPECT: CURRICULUM TESTS OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=0b5aa7d3a930/22 entries; EXPECT=matched; output-sha256=525921f46ae4f2fe5888753101d7e4c7fe13c047a415acc66eff1be8aabbdfdc; output-bytes=512

- [x] G3: all unit test suites pass with zero regressions
      CHECK: npm test && echo "ALL TESTS OK"
      EXPECT: ALL TESTS OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=0b5aa7d3a930/22 entries; EXPECT=matched; output-sha256=8c6a4b79eaf000e704750d4a898f12950f9f75ad7d90c9f51875396cb2d1a2cf; output-bytes=7853

- [x] G4: static linting, formatting, production build, and subpath routing pass
      CHECK: npm run lint && npm run format:check && npm run build && npm run verify:subpath
      EXPECT: verify:subpath passed
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=0b5aa7d3a930/22 entries; EXPECT=matched; output-sha256=a6fb37bf2737b58d583def8a4f5c6b85def132799370b8a73f4f40c8bb14452d; output-bytes=2305
