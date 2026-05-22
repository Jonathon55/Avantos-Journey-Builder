import { Plus, X } from "lucide-react";
import { getMappingForField } from "../domain/prefillMappings";
import type { FormField, FormNode, PrefillMapping } from "../domain/types";

type PrefillTableProps = {
  form: FormNode;
  mappings: PrefillMapping[];
  onEditField: (field: FormField) => void;
  onClearField: (fieldId: string) => void;
};

export function PrefillTable({ form, mappings, onEditField, onClearField }: PrefillTableProps) {
  return (
    <div className="table-shell">
      <div className="table-heading">
        <div>
          <h3>Prefill configuration</h3>
          <p>Choose where each field should pull its initial value from.</p>
        </div>
      </div>

      <table className="prefill-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Prefill source</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {form.fields.map((field) => {
            const mapping = getMappingForField(mappings, form.id, field.id);

            return (
              <tr key={field.id}>
                <td>
                  <button className="field-button" type="button" onClick={() => onEditField(field)}>
                    {field.name}
                  </button>
                </td>
                <td>
                  <span className="type-pill">{field.type}</span>
                </td>
                <td>
                  {mapping ? (
                    <button className="source-chip" type="button" onClick={() => onEditField(field)}>
                      <span>{mapping.source.label}</span>
                      <small>{mapping.source.description}</small>
                    </button>
                  ) : (
                    <button className="empty-source" type="button" onClick={() => onEditField(field)}>
                      <Plus size={16} aria-hidden="true" />
                      Add source
                    </button>
                  )}
                </td>
                <td className="actions-cell">
                  {mapping ? (
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => onClearField(field.id)}
                      aria-label={`Clear prefill mapping for ${field.name}`}
                      title="Clear mapping"
                    >
                      <X size={17} aria-hidden="true" />
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
