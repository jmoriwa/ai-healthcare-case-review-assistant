import { CASE_STATUSES, PROCEDURE_TYPES } from "@/domain/enums";
import { CASE_STATUS_LABELS, PROCEDURE_LABELS } from "@/domain/labels";
import type { CaseFilters } from "@/domain/models";
import { Field, SelectInput, TextInput } from "@/components/common/Field";

export function CaseFilterBar({
  filters,
  onChange,
}: {
  filters: Required<CaseFilters>;
  onChange: (next: Required<CaseFilters>) => void;
}) {
  return (
    <div className="grid gap-3 border-b border-border px-4 py-3 sm:grid-cols-3">
      <Field label="Search" htmlFor="case-search" hint="Case number or patient name">
        <TextInput
          id="case-search"
          type="search"
          value={filters.search}
          placeholder="e.g. CASE-1042"
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </Field>
      <Field label="Procedure type" htmlFor="case-procedure">
        <SelectInput
          id="case-procedure"
          value={filters.procedureType}
          onChange={(event) =>
            onChange({ ...filters, procedureType: event.target.value as Required<CaseFilters>["procedureType"] })
          }
        >
          <option value="ALL">All procedures</option>
          {PROCEDURE_TYPES.map((type) => (
            <option key={type} value={type}>
              {PROCEDURE_LABELS[type]}
            </option>
          ))}
        </SelectInput>
      </Field>
      <Field label="Status" htmlFor="case-status">
        <SelectInput
          id="case-status"
          value={filters.status}
          onChange={(event) =>
            onChange({ ...filters, status: event.target.value as Required<CaseFilters>["status"] })
          }
        >
          <option value="ALL">All statuses</option>
          {CASE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CASE_STATUS_LABELS[status]}
            </option>
          ))}
        </SelectInput>
      </Field>
    </div>
  );
}

export const DEFAULT_CASE_FILTERS: Required<CaseFilters> = {
  search: "",
  procedureType: "ALL",
  status: "ALL",
};
