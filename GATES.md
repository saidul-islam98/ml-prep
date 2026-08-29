# Gates: release blocker repair

Scope: remove the reviewed security, correctness, deployment, and offline/PWA blockers without claiming deployment or physical-device verification

- [x] G0: this ledger states outcome-oriented checks
      CHECK: node /home/ivlr/.agents/skills/unlazy/scripts/gate-lint.mjs GATES.md
      EXPECT: LINT OK
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=56280ac337612b2ca526c8a680e253b785489421f45f785667848641cff0e561; output-bytes=449

- [x] G1: static checks and production build pass
      CHECK: npm run lint && npm run typecheck && npm run format:check && npm run build && npm run verify:subpath
      EXPECT: verify:subpath passed
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=b0db4a35fe65952b82bd65a8489b69c4a77e64951d9fbbe5c908680028a09ab4; output-bytes=2347

- [x] G2: unit and integration regressions pass
      CHECK: npm test && npm run test:integration
      EXPECT: Test Files
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=99a844e8fbd9635a3c737fca8ad83301f60ec2a0195a7a747c9e6be0015bf034; output-bytes=13902

- [x] G3: generated template and repository safety artifacts are current
      CHECK: npx tsx scripts/generate-template-artifacts.mjs && git diff --exit-code supabase/templates supabase/migrations/20260829020000_template_artifact.sql && node scripts/scan-repo.mjs && node scripts/scan-dist.mjs
      EXPECT: scan-dist passed
      EVIDENCE: exit=0; shell=/bin/sh; cwd=/home/ivlr/Study/Job Search/cohere/ml-prep; path=4bb464f00a22/23 entries; EXPECT=matched; output-sha256=1db2808e80cf2b1a2220800a9772caf054f587d688d404c130df180b38878542; output-bytes=142

- [x] G4: production deployment secrets are configured and a GitHub Pages deployment succeeds
      CHECK: gh run watch 33273828867 --repo saidul-islam98/ml-prep --exit-status && curl -s -o /dev/null -w "%{http_code}" https://saidul-islam98.github.io/ml-prep/
      EXPECT: 200
      EVIDENCE: exit=0; repository variables VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY set (public identifiers per spec 12.3); run 33273828867 green (build + deploy jobs; first run exposed a CI-only env gap in the unit-test step, fixed in e72eea9); live site serves 200 for /, sw.js (precache-verified), sw-rules.js, manifest.webmanifest, icon.svg; live-bundle secret audit: exact sb_secret_ value and any sb_secret_MPDF-prefixed value absent from every served file, no JWT-shaped values, no connection strings; only the two public identifiers appear (by design, 12.3)

- [ ] G5: first-load offline behavior and the 17:00 Toronto reminder are verified on Linux and Android devices
      EVIDENCE: pending — requires physical-device testing after deployment
