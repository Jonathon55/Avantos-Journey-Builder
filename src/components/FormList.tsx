import { CheckCircle2 } from "lucide-react";
import { getDirectDependencies, getDirectDependents } from "../domain/graph";
import type { ActionBlueprintGraph, PrefillMapping } from "../domain/types";

type FormListProps = {
  graph: ActionBlueprintGraph;
  selectedFormId: string | null;
  mappings: PrefillMapping[];
  onSelectForm: (formId: string) => void;
};

export function FormList({ graph, selectedFormId, mappings, onSelectForm }: FormListProps) {
  return (
    <aside className="form-list" aria-label="Forms">
      <div className="panel-title">
        <span>Forms</span>
        <span>{graph.edges.length} edges</span>
      </div>

      <div className="form-list-items">
        {graph.forms.map((form) => {
          const incoming = getDirectDependencies(graph, form.id).length;
          const outgoing = getDirectDependents(graph, form.id).length;
          const mappedFields = mappings.filter((mapping) => mapping.targetFormId === form.id).length;
          const isSelected = form.id === selectedFormId;

          return (
            <button
              className={`form-card ${isSelected ? "selected" : ""}`}
              type="button"
              key={form.id}
              onClick={() => onSelectForm(form.id)}
              aria-pressed={isSelected}
            >
              <span className="form-card-title">{form.name}</span>
              <span className="form-card-meta">
                {incoming} in / {outgoing} out / {form.fields.length} fields
              </span>
              {mappedFields > 0 ? (
                <span className="mapping-count">
                  <CheckCircle2 size={15} aria-hidden="true" />
                  {mappedFields} mapped
                </span>
              ) : (
                <span className="mapping-count muted">No mappings</span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
