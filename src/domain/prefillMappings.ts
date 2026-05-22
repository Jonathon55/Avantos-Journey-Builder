import type { PrefillMapping, PrefillSource } from "./types";

export const getMappingForField = (
  mappings: PrefillMapping[],
  formId: string,
  fieldId: string,
): PrefillMapping | undefined =>
  mappings.find((mapping) => mapping.targetFormId === formId && mapping.targetFieldId === fieldId);

export const setMappingForField = (
  mappings: PrefillMapping[],
  formId: string,
  fieldId: string,
  source: PrefillSource,
): PrefillMapping[] => {
  const nextMapping = { targetFormId: formId, targetFieldId: fieldId, source };
  const existingIndex = mappings.findIndex(
    (mapping) => mapping.targetFormId === formId && mapping.targetFieldId === fieldId,
  );

  if (existingIndex === -1) {
    return [...mappings, nextMapping];
  }

  return mappings.map((mapping, index) => (index === existingIndex ? nextMapping : mapping));
};

export const clearMappingForField = (
  mappings: PrefillMapping[],
  formId: string,
  fieldId: string,
): PrefillMapping[] =>
  mappings.filter((mapping) => !(mapping.targetFormId === formId && mapping.targetFieldId === fieldId));
