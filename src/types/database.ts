export type PropertyDefinition = {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "bool" | "select" | "relation";
  options?: string[];
  relation_collection_id?: string | null;
};

/**
 * PropertyReference - Structure for referencing specific properties of other notes
 * 
 * Format: "node_id:uuid#property_id:uuid"
 * 
 * This type is designed to support future functionality where users can reference
 * not just entire notes, but specific properties within those notes. This enables
 * more granular linking and data relationships.
 * 
 * Example:
 *   "abc123-def456-ghi789#prop-001" would reference the property with ID "prop-001"
 *   within the note with ID "abc123-def456-ghi789"
 * 
 * @future This will be used for advanced property mentions and cross-note data references
 */
export type PropertyReference = {
  nodeId: string;
  propertyId: string;
};

/**
 * Helper function to parse a property reference string
 * @param refString - String in format "nodeId#propertyId"
 * @returns PropertyReference object or null if invalid
 */
export const parsePropertyReference = (refString: string): PropertyReference | null => {
  const parts = refString.split('#');
  if (parts.length !== 2) {
    return null;
  }
  return {
    nodeId: parts[0],
    propertyId: parts[1],
  };
};

/**
 * Helper function to create a property reference string
 * @param nodeId - The UUID of the note
 * @param propertyId - The UUID of the property
 * @returns String in format "nodeId#propertyId"
 */
export const createPropertyReference = (nodeId: string, propertyId: string): string => {
  return `${nodeId}#${propertyId}`;
};

export type Collection = {
  id: string;
  user_id?: string | null;
  name: string;
  icon?: string | null;
  description?: string | null;
  schema_json: PropertyDefinition[];
  created_at?: string;
};

export type Note = {
  id: string;
  user_id?: string | null;
  collection_id: string | null;
  parent_id?: string | null;
  title: string | null;
  icon?: string | null;
  content_jsonb?: Record<string, unknown> | null;
  properties_jsonb: Record<string, unknown> | unknown[] | null;
  is_archived?: boolean | null;
  created_at?: string;
};
