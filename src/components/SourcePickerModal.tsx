import { useEffect, useMemo, useRef, useState } from "react";
import { Database, Search, X } from "lucide-react";
import type { FormField, FormNode, PrefillSource, PrefillSourceGroup } from "../domain/types";

type SourcePickerModalProps = {
  form: FormNode;
  field: FormField;
  groups: PrefillSourceGroup[];
  onClose: () => void;
  onSelectSource: (source: PrefillSource) => void;
};

export function SourcePickerModal({ form, field, groups, onClose, onSelectSource }: SourcePickerModalProps) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return groups;
    }

    return groups
      .map((group) => ({
        ...group,
        sources: group.sources.filter(
          (source) =>
            source.label.toLowerCase().includes(normalizedQuery) ||
            source.description.toLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter((group) => group.sources.length > 0);
  }, [groups, query]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-picker-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Configure {form.name}</p>
            <h2 id="source-picker-title">Select source for {field.name}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close source picker">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search sources"
          />
        </label>

        <div className="source-groups">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => (
              <section className="source-group" key={group.id} aria-labelledby={`${group.id}-heading`}>
                <h3 id={`${group.id}-heading`}>{group.label}</h3>
                <div className="source-list">
                  {group.sources.map((source) => (
                    <button
                      className="source-option"
                      type="button"
                      key={source.id}
                      onClick={() => onSelectSource(source)}
                    >
                      <Database size={18} aria-hidden="true" />
                      <span>
                        <strong>{source.label}</strong>
                        <small>{source.description}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="empty-state compact">
              <Search aria-hidden="true" />
              <p>No matching sources.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
