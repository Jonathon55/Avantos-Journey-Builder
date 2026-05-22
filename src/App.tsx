import { useEffect, useMemo, useState } from "react";
import { AlertCircle, GitBranch, Loader2, Search } from "lucide-react";
import { fetchGraph } from "./api/graphClient";
import { initialMappings } from "./data/mockGraph";
import { getAvailablePrefillSources, getDirectDependencies, getDirectDependents, getFormById } from "./domain/graph";
import { clearMappingForField, setMappingForField } from "./domain/prefillMappings";
import { defaultSourceProviders } from "./domain/sourceProviders";
import type { ActionBlueprintGraph, FormField, PrefillMapping, PrefillSource } from "./domain/types";
import { FormList } from "./components/FormList";
import { PrefillTable } from "./components/PrefillTable";
import { SourcePickerModal } from "./components/SourcePickerModal";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; graph: ActionBlueprintGraph };

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [mappings, setMappings] = useState<PrefillMapping[]>(initialMappings);
  const [editingField, setEditingField] = useState<FormField | null>(null);

  useEffect(() => {
    let ignore = false;

    fetchGraph()
      .then((graph) => {
        if (ignore) {
          return;
        }
        setLoadState({ status: "ready", graph });
        setSelectedFormId((current) => current ?? graph.forms[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (!ignore) {
          setLoadState({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to load the journey graph.",
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const selectedForm =
    loadState.status === "ready" && selectedFormId ? getFormById(loadState.graph, selectedFormId) : undefined;

  const directDependencies = useMemo(
    () =>
      loadState.status === "ready" && selectedFormId
        ? getDirectDependencies(loadState.graph, selectedFormId)
        : [],
    [loadState, selectedFormId],
  );

  const directDependents = useMemo(
    () =>
      loadState.status === "ready" && selectedFormId ? getDirectDependents(loadState.graph, selectedFormId) : [],
    [loadState, selectedFormId],
  );

  const sourceGroups = useMemo(
    () =>
      loadState.status === "ready" && selectedFormId
        ? getAvailablePrefillSources(loadState.graph, selectedFormId, defaultSourceProviders)
        : [],
    [loadState, selectedFormId],
  );

  const handleSelectSource = (source: PrefillSource) => {
    if (!selectedForm || !editingField) {
      return;
    }

    setMappings((current) => setMappingForField(current, selectedForm.id, editingField.id, source));
    setEditingField(null);
  };

  if (loadState.status === "loading") {
    return (
      <main className="screen centered">
        <Loader2 className="spin" aria-hidden="true" />
        <p>Loading journey graph...</p>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main className="screen centered">
        <AlertCircle aria-hidden="true" />
        <p>{loadState.message}</p>
      </main>
    );
  }

  return (
    <main className="screen">
      <header className="app-header">
        <div>
          <p className="eyebrow">Avantos Journey Builder</p>
          <h1>Prefill mappings</h1>
        </div>
        <div className="header-stat" aria-label={`${loadState.graph.forms.length} forms in graph`}>
          <GitBranch size={18} aria-hidden="true" />
          <span>{loadState.graph.forms.length} forms</span>
        </div>
      </header>

      <section className="workspace" aria-label="Journey builder workspace">
        <FormList
          graph={loadState.graph}
          selectedFormId={selectedFormId}
          onSelectForm={setSelectedFormId}
          mappings={mappings}
        />

        <section className="detail-panel" aria-live="polite">
          {selectedForm ? (
            <>
              <div className="detail-header">
                <div>
                  <p className="eyebrow">Selected form</p>
                  <h2>{selectedForm.name}</h2>
                </div>
                <div className="dependency-summary">
                  <span>{directDependencies.length} upstream</span>
                  <span>{directDependents.length} downstream</span>
                </div>
              </div>

              <div className="dependency-row" aria-label="Dependency context">
                <div>
                  <span className="meta-label">Depends on</span>
                  <strong>{directDependencies.map((form) => form.name).join(", ") || "No upstream forms"}</strong>
                </div>
                <div>
                  <span className="meta-label">Feeds</span>
                  <strong>{directDependents.map((form) => form.name).join(", ") || "No downstream forms"}</strong>
                </div>
              </div>

              <PrefillTable
                form={selectedForm}
                mappings={mappings}
                onEditField={setEditingField}
                onClearField={(fieldId) =>
                  setMappings((current) => clearMappingForField(current, selectedForm.id, fieldId))
                }
              />
            </>
          ) : (
            <div className="empty-state">
              <Search aria-hidden="true" />
              <p>Select a form to inspect its prefill configuration.</p>
            </div>
          )}
        </section>
      </section>

      {editingField && selectedForm ? (
        <SourcePickerModal
          field={editingField}
          form={selectedForm}
          groups={sourceGroups}
          onClose={() => setEditingField(null)}
          onSelectSource={handleSelectSource}
        />
      ) : null}
    </main>
  );
}
