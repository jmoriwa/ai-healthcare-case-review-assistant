import { useState } from "react";
import { Button } from "@/components/common/Button";
import { Card, CardBody, CardHeader } from "@/components/common/Card";
import { Field, TextArea } from "@/components/common/Field";
import { EmptyState, InlineError } from "@/components/common/Feedback";
import { CASE_STATUS_LABELS } from "@/domain/labels";
import type { ReviewerNote } from "@/domain/models";
import { validateNoteBody } from "@/domain/validators";
import { formatDateTime } from "@/lib/dates";

export function NotesPanel({
  notes,
  canEdit,
  isSaving,
  onAddNote,
}: {
  notes: ReviewerNote[];
  canEdit: boolean;
  isSaving: boolean;
  onAddNote: (body: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateNoteBody(body);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    await onAddNote(body.trim());
    setBody("");
  }

  return (
    <Card>
      <CardHeader
        title="Reviewer notes"
        description="Notes are permanent and visible to all reviewers."
      />
      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Notes you add are recorded on the case activity log."
        />
      ) : (
        <ul className="divide-y divide-border">
          {notes.map((note) => (
            <li key={note.id} className="space-y-1 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-foreground">
                  {note.author.displayName}
                </span>
                <span className="text-meta">
                  {formatDateTime(note.createdAt)} · {CASE_STATUS_LABELS[note.caseStatusAtCreation]}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
            </li>
          ))}
        </ul>
      )}

      {canEdit ? (
        <CardBody className="border-t border-border">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Field label="Add a note" htmlFor="note-body">
              <TextArea
                id="note-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Document what you verified in the record."
              />
            </Field>
            {error ? <InlineError title="Cannot add note" message={error} /> : null}
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Adding…" : "Add note"}
            </Button>
          </form>
        </CardBody>
      ) : null}
    </Card>
  );
}
