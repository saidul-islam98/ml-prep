import {
  BENCHMARKS_TO_KNOW,
  STUDY_RESOURCES,
  WEEKLY_RESOURCE_GUIDES,
  resourcesForWeek,
  type StudyResource,
} from "../lib/studyResources";

const FEATURED_IDS = [
  "cs336",
  "berkeley-advanced-agents",
  "inspect",
  "evidently-eval",
  "trl",
  "ray-core",
];

function ResourceLink({
  resource,
  compact = false,
}: {
  resource: StudyResource;
  compact?: boolean;
}) {
  return (
    <li className={compact ? "study-resource study-resource--compact" : "study-resource"}>
      <div className="study-resource__topline">
        <a href={resource.url} target="_blank" rel="noopener noreferrer">
          {resource.title}
        </a>
        <span className={`study-priority study-priority--${resource.priority.toLowerCase()}`}>
          {resource.priority}
        </span>
      </div>
      {!compact ? <p>{resource.focus}</p> : null}
    </li>
  );
}

export function ComprehensiveStudyResources() {
  const featured = FEATURED_IDS.map((id) =>
    STUDY_RESOURCES.find((resource) => resource.id === id),
  ).filter((resource): resource is StudyResource => Boolean(resource));
  const categories = [...new Set(STUDY_RESOURCES.map((resource) => resource.category))];

  return (
    <section className="study-library" aria-labelledby="study-library-title">
      <header className="study-library__header">
        <div>
          <p className="curriculum-kicker">Supplemental 12-week guide</p>
          <h2 id="study-library-title">Comprehensive study resources</h2>
          <p>
            Use one primary explanation, official documentation while implementing, and one or two
            important papers. The dated 14-week plan remains your execution schedule.
          </p>
        </div>
        <span className="study-library__count">{STUDY_RESOURCES.length} references</span>
      </header>

      <ul className="study-resource-grid study-resource-grid--featured" aria-label="Core resources">
        {featured.map((resource) => (
          <ResourceLink key={resource.id} resource={resource} />
        ))}
      </ul>

      <details className="study-library__all">
        <summary>Browse all references by topic</summary>
        <div className="study-library__groups">
          {categories.map((category) => (
            <section key={category} aria-labelledby={`resource-${category.replaceAll(" ", "-")}`}>
              <h3 id={`resource-${category.replaceAll(" ", "-")}`}>{category}</h3>
              <ul className="study-resource-list">
                {STUDY_RESOURCES.filter((resource) => resource.category === category).map(
                  (resource) => (
                    <ResourceLink key={resource.id} resource={resource} compact />
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>

        <div className="benchmark-reference" aria-labelledby="benchmark-reference-title">
          <h3 id="benchmark-reference-title">Papers and benchmarks to know</h3>
          <p>
            <strong>MUST:</strong> {BENCHMARKS_TO_KNOW.must.join(" · ")}
          </p>
          <p>
            <strong>SHOULD:</strong> {BENCHMARKS_TO_KNOW.should.join(" · ")}
          </p>
          <p>
            For each one, be ready to explain its environment, state, actions, verifier, metric,
            exposed failure modes, and validity limits.
          </p>
        </div>
      </details>
    </section>
  );
}

export function WeeklyStudyResources({ weekNumber }: { weekNumber: number }) {
  const guide = WEEKLY_RESOURCE_GUIDES.find((candidate) => candidate.week === weekNumber);
  if (!guide) return null;
  const resources = resourcesForWeek(weekNumber);

  return (
    <aside className="week-resources" aria-labelledby={`week-resources-${weekNumber}`}>
      <div className="week-resources__heading">
        <div>
          <p className="curriculum-kicker">Comprehensive guide · Week {weekNumber}</p>
          <h3 id={`week-resources-${weekNumber}`}>{guide.title}</h3>
        </div>
        <span>{resources.length} references</span>
      </div>
      <p className="week-resources__goal">{guide.goal}</p>
      <ul className="study-resource-list study-resource-list--inline">
        {resources.map((resource) => (
          <ResourceLink key={resource.id} resource={resource} compact />
        ))}
      </ul>
      <p className="week-resources__deliverable">
        <strong>Artifact:</strong> {guide.deliverable}
      </p>
    </aside>
  );
}
