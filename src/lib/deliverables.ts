/** Stable keys stored in the existing cross-device task-execution record. */
export const deliverableVerificationId = (deliverableId: string): string =>
  `deliverable:${deliverableId}`;

export const deliverableEvidenceKey = (deliverableId: string): string =>
  `deliverable-evidence:${deliverableId}`;

export function hasConcreteDeliverableEvidence(
  stepNotes: Record<string, string>,
  deliverableId: string,
): boolean {
  return (stepNotes[deliverableEvidenceKey(deliverableId)] ?? "").trim().length >= 8;
}
