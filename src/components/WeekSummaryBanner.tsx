import React, { useState } from "react";
import type { CurriculumWeek } from "../curriculum/schemas";
import { Badge, Button } from "./ui";

interface WeekSummaryBannerProps {
  week: CurriculumWeek;
}

export const WeekSummaryBanner: React.FC<WeekSummaryBannerProps> = ({ week }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="deepml-week-summary-banner ui-card">
      <div className="deepml-week-summary-header">
        <div className="deepml-week-summary-title-group">
          <div className="deepml-week-badges">
            <Badge tone="accent">Week {week.week}</Badge>
            <Badge tone="neutral">{week.phase}</Badge>
          </div>
          <h3 className="deepml-week-banner-h3">{week.title}</h3>
          <p className="deepml-week-objective">
            <strong>Weekly Objective:</strong> {week.objective}
          </p>
        </div>

        <Button variant="ghost" onClick={() => setIsExpanded((e) => !e)} aria-expanded={isExpanded}>
          {isExpanded ? "Hide Details ▲" : "View Outcomes & Exit Check ▼"}
        </Button>
      </div>

      {isExpanded && (
        <div className="deepml-week-summary-expanded">
          <div className="deepml-week-summary-grid">
            <div className="deepml-week-summary-col">
              <h4 className="deepml-block-heading">🎯 Key Outcomes</h4>
              <ul className="deepml-task-list">
                {week.outcomes.map((outcome, idx) => (
                  <li key={idx}>✓ {outcome}</li>
                ))}
              </ul>
            </div>

            <div className="deepml-week-summary-col">
              <h4 className="deepml-block-heading">📦 Expected Deliverables</h4>
              <ul className="deepml-deliverable-list">
                {week.deliverables.map((deliverable) => (
                  <li key={deliverable.id}>
                    <strong>{deliverable.name}</strong>
                    <div className="deepml-resource-instruction">
                      <strong>Verify:</strong> {deliverable.verify}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="deepml-week-summary-col">
              <h4 className="deepml-block-heading">🚪 Week Exit Check</h4>
              <ul className="deepml-task-list">
                {week.exitCheck.map((check, idx) => (
                  <li key={idx}>◻ {check}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
