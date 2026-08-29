/**
 * Template v1 unit tests (todo.md Task 7): schema validity, stable-key
 * uniqueness, manifest reconciliation (196 h, 109 required tasks, 840 min per
 * week, 1,200-minute Post-Training swap), and canonical window dates.
 */

import { describe, expect, it } from "vitest";
import {
  TEMPLATE_V1,
  TEMPLATE_TASK_KEYS,
  TEMPLATE_TOTAL_REQUIRED_MINUTES,
  POST_TRAINING_SWAP_KEYS,
  POST_TRAINING_TASK_KEYS,
  POST_TRAINING_TOTAL_MINUTES,
  taskDate,
  templateContentDigest,
} from "../../src/template/templateV1";

describe("template v1 schema", () => {
  it("parses with the correct top-level shape", () => {
    expect(TEMPLATE_V1.version).toBe(1);
    expect(TEMPLATE_V1.weeks).toHaveLength(14);
    expect(TEMPLATE_V1.projects).toHaveLength(3);
    expect(TEMPLATE_V1.gates).toHaveLength(13);
  });

  it("spans the canonical window August 31 - December 6, 2026", () => {
    expect(TEMPLATE_V1.weeks[0].start).toBe("2026-08-31");
    expect(TEMPLATE_V1.weeks[13].end).toBe("2026-12-06");
    for (const week of TEMPLATE_V1.weeks) {
      expect(new Date(`${week.start}T12:00:00Z`).getUTCDay()).toBe(1); // Monday
      expect(new Date(`${week.end}T12:00:00Z`).getUTCDay()).toBe(0); // Sunday
    }
  });

  it("has globally unique stable keys", () => {
    expect(new Set(TEMPLATE_TASK_KEYS).size).toBe(TEMPLATE_TASK_KEYS.length);
  });
});

describe("manifest reconciliation", () => {
  it("totals exactly 11,760 required minutes (196 h) across 109 required tasks", () => {
    const required = TEMPLATE_V1.tasks.filter((t) => !t.optionalTrack);
    expect(required).toHaveLength(109);
    expect(TEMPLATE_TOTAL_REQUIRED_MINUTES).toBe(11_760);
  });

  it("gives every week exactly 840 planned minutes", () => {
    for (let week = 1; week <= 14; week += 1) {
      const minutes = TEMPLATE_V1.tasks
        .filter((t) => t.week === week && !t.optionalTrack)
        .reduce((sum, t) => sum + t.minutes, 0);
      expect(minutes, `week ${week}`).toBe(840);
    }
  });

  it("schedules every task inside its week's date range", () => {
    for (const task of TEMPLATE_V1.tasks) {
      const week = TEMPLATE_V1.weeks.find((w) => w.week === task.week);
      const date = taskDate(task);
      expect(date >= week!.start && date <= week!.end, `${task.key}: ${date}`).toBe(true);
    }
  });

  it("fixes the two application deadlines", () => {
    const deadlines = TEMPLATE_V1.tasks.filter((t) => t.fixedDeadline);
    expect(deadlines.map((t) => [t.key, taskDate(t)])).toEqual([
      ["w01-sun", "2026-09-06"],
      ["w02-tue", "2026-09-08"],
    ]);
  });

  it("splits Sunday into a session and a review task for weeks 1-11", () => {
    for (let week = 1; week <= 11; week += 1) {
      const sundayTasks = TEMPLATE_V1.tasks.filter(
        (t) => t.week === week && t.day === "sun" && !t.optionalTrack,
      );
      expect(
        sundayTasks.map((t) => t.key),
        `week ${week}`,
      ).toEqual([
        `w${String(week).padStart(2, "0")}-sun`,
        `w${String(week).padStart(2, "0")}-sun-review`,
      ]);
    }
  });
});

describe("optional Post-Training track", () => {
  it("totals exactly 1,200 minutes across 9 optional tasks", () => {
    expect(POST_TRAINING_TASK_KEYS).toHaveLength(9);
    expect(POST_TRAINING_TOTAL_MINUTES).toBe(1_200);
  });

  it("marks all optional tasks with the post_training role and the optional project", () => {
    for (const task of TEMPLATE_V1.tasks.filter((t) => t.optionalTrack)) {
      expect(task.roles).toEqual(["post_training"]);
      expect(task.project).toBe("post_training_lab");
    }
  });

  it("maps the swap set to exactly 1,200 minutes across 12 tasks", () => {
    expect(POST_TRAINING_SWAP_KEYS).toHaveLength(12);
    const swapMinutes = TEMPLATE_V1.tasks
      .filter((t) => t.swapGroup === "post_training")
      .reduce((sum, t) => sum + t.minutes, 0);
    expect(swapMinutes).toBe(1_200);
    expect([...POST_TRAINING_SWAP_KEYS].sort()).toEqual(
      [
        "w09-tue",
        "w09-wed",
        "w10-wed",
        "w10-thu",
        "w13-tue",
        "w13-wed",
        "w09-sun-review",
        "w10-sun-review",
        "w11-sun-review",
        "w12-sun-review",
        "w13-sun-review",
        "w14-sat",
      ].sort(),
    );
  });
});

describe("projects and gates", () => {
  it("carries the three projects with their budget minutes", () => {
    const budgets = Object.fromEntries(TEMPLATE_V1.projects.map((p) => [p.key, p.budgetMinutes]));
    expect(budgets).toEqual({ evalops: 1950, rollout_lab: 1650, post_training_lab: 1200 });
  });

  it("marks exactly five completion-gate milestones", () => {
    const gates = TEMPLATE_V1.projects.flatMap((p) =>
      p.milestones.filter((m) => m.isCompletionGate).map((m) => m.key),
    );
    expect(gates).toEqual(["p1-m5", "p1-m7", "p2-m3", "p2-m4", "p3-m4"]);
  });

  it("seeds 13 readiness gate rows across the three roles", () => {
    const byRole: Record<string, number> = {};
    for (const gate of TEMPLATE_V1.gates) {
      byRole[gate.role] = (byRole[gate.role] ?? 0) + 1;
    }
    expect(byRole).toEqual({ data_eval: 6, agent_env: 5, post_training: 2 });
  });
});

describe("content digest", () => {
  it("is stable across calls", async () => {
    const a = await templateContentDigest();
    const b = await templateContentDigest();
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});
