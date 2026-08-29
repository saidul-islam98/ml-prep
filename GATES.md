# Gates: release blocker repair

Scope: remove the reviewed security, correctness, deployment, and offline/PWA blockers without claiming deployment or physical-device verification

- [ ] G0: this ledger states outcome-oriented checks
      CHECK: node /home/ivlr/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
      EXPECT: LINT OK
      EVIDENCE: pending

- [ ] G1: static checks and production build pass
      CHECK: npm run lint && npm run typecheck && npm run format:check && npm run build && npm run verify:subpath
      EXPECT: Subpath verification passed
      EVIDENCE: pending

- [ ] G2: unit and integration regressions pass
      CHECK: npm test && npm run test:integration
      EXPECT: Test Files
      EVIDENCE: pending

- [ ] G3: generated template and repository safety artifacts are current
      CHECK: node scripts/generate-template-artifacts.mjs --check && node scripts/scan-repo.mjs && node scripts/scan-dist.mjs
      EXPECT: scan-dist passed
      EVIDENCE: pending

- [ ] G4: production deployment secrets are configured and a GitHub Pages deployment succeeds
      EVIDENCE: pending — requires repository variables and a GitHub Actions deployment outside this local repair

- [ ] G5: first-load offline behavior and the 17:00 Toronto reminder are verified on Linux and Android devices
      EVIDENCE: pending — requires physical-device testing after deployment
