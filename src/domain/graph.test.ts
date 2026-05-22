import { afterEach, describe, expect, it, vi } from "vitest";
import { mockGraph } from "../data/mockGraph";
import { fetchGraph, normalizeGraphResponse } from "../api/graphClient";
import { getAvailablePrefillSources, getDirectDependencies, getTransitiveDependencies } from "./graph";
import { clearMappingForField, setMappingForField } from "./prefillMappings";
import { defaultSourceProviders } from "./sourceProviders";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("graph normalization", () => {
  it("normalizes common API response shapes", () => {
    const graph = normalizeGraphResponse({
      graph: {
        nodes: [
          {
            form_id: "form-x",
            form_name: "Form X",
            form_fields: [{ field_id: "email", field_name: "email_address", field_type: "email" }],
          },
        ],
        dependencies: [{ source_id: "form-a", target_id: "form-x" }],
      },
    });

    expect(graph.forms[0]).toEqual({
      id: "form-x",
      name: "Form X",
      fields: [{ id: "email", name: "email_address", type: "email" }],
    });
    expect(graph.edges).toEqual([{ source: "form-a", target: "form-x" }]);
  });

  it("normalizes the Avantos action blueprint graph shape", () => {
    const graph = normalizeGraphResponse({
      nodes: [
        {
          id: "form-a-component",
          type: "form",
          data: {
            component_id: "f_form_a",
            name: "Form A",
          },
        },
        {
          id: "form-b-component",
          type: "form",
          data: {
            component_id: "f_form_b",
            name: "Form B",
          },
        },
      ],
      edges: [{ source: "form-a-component", target: "form-b-component" }],
      forms: [
        {
          id: "f_form_a",
          name: "Reusable Form A",
          field_schema: {
            type: "object",
            properties: {
              email: {
                avantos_type: "short-text",
                format: "email",
                type: "string",
              },
              dynamic_checkbox_group: {
                avantos_type: "checkbox-group",
                type: "array",
              },
            },
          },
        },
        {
          id: "f_form_b",
          name: "Reusable Form B",
          field_schema: {
            type: "object",
            properties: {
              notes: {
                avantos_type: "multi-line-text",
                type: "string",
              },
            },
          },
        },
      ],
    });

    expect(graph.forms).toEqual([
      {
        id: "form-a-component",
        name: "Form A",
        fields: [
          { id: "email", name: "email", type: "short-text" },
          { id: "dynamic_checkbox_group", name: "dynamic_checkbox_group", type: "checkbox-group" },
        ],
      },
      {
        id: "form-b-component",
        name: "Form B",
        fields: [{ id: "notes", name: "notes", type: "multi-line-text" }],
      },
    ]);
    expect(graph.edges).toEqual([{ source: "form-a-component", target: "form-b-component" }]);
  });

  it("ignores non-form blueprint nodes and malformed form definitions", () => {
    const graph = normalizeGraphResponse({
      nodes: [
        null,
        { id: "branch-1", type: "branch", data: { name: "Branch" } },
        { type: "form", data: { component_key: "form-without-definition", name: "Loose Form" } },
      ],
      forms: [null],
    });

    expect(graph.forms).toEqual([
      {
        id: "form-without-definition",
        name: "Loose Form",
        fields: [],
      },
    ]);
    expect(graph.edges).toEqual([]);
  });

  it("normalizes forms when no edge collection is present", () => {
    const graph = normalizeGraphResponse({
      forms: [
        {
          id: "form-without-edges",
          field_schema: {
            properties: {
              email: { format: "email" },
            },
          },
        },
      ],
    });

    expect(graph).toEqual({
      forms: [
        {
          id: "form-without-edges",
          name: "form-without-edges",
          fields: [{ id: "email", name: "email", type: "email" }],
        },
      ],
      edges: [],
    });
  });

  it("normalizes array payloads, component fields, and ignores invalid edges", () => {
    const graph = normalizeGraphResponse([
      {
        id: "form-y",
        components: [{ label: "Company", type: "text" }],
      },
    ]);

    expect(graph.forms[0]).toEqual({
      id: "form-y",
      name: "form-y",
      fields: [{ id: "field-0", name: "Company", type: "text" }],
    });
    expect(graph.edges).toEqual([]);
  });

  it("throws when a response has no forms", () => {
    expect(() => normalizeGraphResponse({ edges: [{ source: "a", target: "b" }] })).toThrow(
      "Graph response did not include any forms.",
    );
  });
});

describe("graph endpoint resolution", () => {
  it("falls back to fixture data when no endpoint is configured", async () => {
    vi.stubEnv("VITE_GRAPH_ENDPOINT", "");

    await expect(fetchGraph()).resolves.toEqual(mockGraph);
  });

  it("fetches and normalizes graph data from the configured endpoint", async () => {
    vi.stubEnv("VITE_GRAPH_ENDPOINT", "https://example.test/graph");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          forms: [{ id: "form-z", fields: [{ id: "email", type: "email" }] }],
          edges: [],
        }),
      })),
    );

    await expect(fetchGraph()).resolves.toEqual({
      forms: [{ id: "form-z", name: "form-z", fields: [{ id: "email", name: "email", type: "email" }] }],
      edges: [],
    });
    expect(fetch).toHaveBeenCalledWith("https://example.test/graph");
  });

  it("falls back to fixture data when the graph request fails", async () => {
    vi.stubEnv("VITE_GRAPH_ENDPOINT", "https://example.test/graph");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 500,
      })),
    );
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await expect(fetchGraph()).resolves.toEqual(mockGraph);
  });
});

describe("DAG traversal", () => {
  it("returns direct dependencies for a form", () => {
    expect(getDirectDependencies(mockGraph, "form-d").map((form) => form.name)).toEqual(["Form B", "Form C"]);
  });

  it("returns transitive dependencies without duplicating direct dependencies", () => {
    expect(getTransitiveDependencies(mockGraph, "form-d").map((form) => form.name)).toEqual(["Form A"]);
  });
});

describe("source provider registry", () => {
  it("aggregates direct, transitive, and global source groups", () => {
    const groups = getAvailablePrefillSources(mockGraph, "form-d", defaultSourceProviders);

    expect(groups.map((group) => group.label)).toEqual(["Direct dependencies", "Earlier dependencies", "Global data"]);
    expect(groups[0].sources.some((source) => source.description === "Form B - work_email")).toBe(true);
    expect(groups[1].sources.some((source) => source.description === "Form A - email")).toBe(true);
    expect(groups[2].sources.some((source) => source.id === "global:organization-name")).toBe(true);
  });
});

describe("prefill mappings", () => {
  it("sets and clears a mapping for a target field", () => {
    const source = {
      id: "global:organization-name",
      kind: "global" as const,
      label: "organization.name",
      description: "Client organization name",
    };

    const mapped = setMappingForField([], "form-d", "d-object", source);
    expect(mapped).toHaveLength(1);
    expect(mapped[0].source.label).toBe("organization.name");
    expect(clearMappingForField(mapped, "form-d", "d-object")).toEqual([]);
  });
});
