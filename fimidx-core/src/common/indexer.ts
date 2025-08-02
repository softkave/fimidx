import type { AnyObject } from "softkave-js-utils";

/**
 * - the indexer loops through every possible field in the input obj, and
 *   extracts leaf-primitive fields (e.g. a.b.c if it is a primitive, not a or
 *   a.b) and leaf-array-compressed primitive fields (e.g. a.arr.[*].b if it is
 *   a primitive, not a.arr or a.arr.[*], although if one of the elements is
 *   primitive then a.arr.[*] should also be extracted).
 * - it returns the data type of the primitive field (string, number, boolean,
 *   null, undefined), and for array-compressed primitives, a set of contained
 *   data types (e.g. from the example above, a separate set for a.arr.[*].b
 *   {string, number, ...} and another set for a.arr.[*] (when at least one
 *   element is primitive) {string, ...}).
 * - it handles nested objects and arrays.
 * - primitive leaf-granular fields include nested array elements (e.g. a.0 if
 *   a.0 is primitive), and object content (e.g. a.1.b if a.1.b is primitive).
 * - reiterating the examples above, leaf-array-compressed fields include the
 *   array itself if at least one element is primitive (e.g. a.arr.[*] if
 *   a.arr[1] or a.arr[2] is a primitive), and object content if at least one
 *   element is an object (e.g. a.arr.[*].b if a.arr[0] or a.arr[3] is an object
 *   and a.arr.[*].b is a primitive).
 */

export type FieldType = "string" | "number" | "boolean" | "null" | "undefined";

export interface IndexedField {
  path: string;
  type: FieldType; // Only primitive types
  arrayTypes?: Set<FieldType>; // For array-compressed fields
  isArrayCompressed: boolean;
}

export interface IndexedJson {
  [fieldPath: string]: IndexedField;
}

function getValueType(value: unknown): FieldType {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  throw new Error("getValueType should only be called on primitive values");
}

function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function indexObject(
  obj: AnyObject,
  currentPath: string = "",
  indexed: IndexedJson = {}
): IndexedJson {
  for (const key in obj) {
    const value = obj[key];
    const newPath = currentPath ? `${currentPath}.${key}` : key;

    if (isPrimitive(value)) {
      // Leaf-granular field
      indexed[newPath] = {
        path: newPath,
        type: getValueType(value),
        isArrayCompressed: false,
      };
    } else if (Array.isArray(value)) {
      // Handle arrays
      indexArray(value, newPath, indexed);
    } else if (typeof value === "object" && value !== null) {
      // Recursively index nested objects
      indexObject(value, newPath, indexed);
    }
  }

  return indexed;
}

function indexArray(
  arr: unknown[],
  currentPath: string,
  indexed: IndexedJson
): void {
  if (arr.length === 0) {
    // Don't create a field for empty arrays
    return;
  }

  // First, extract individual array elements as leaf-granular fields
  arr.forEach((item, index) => {
    const elementPath = `${currentPath}.${index}`;

    if (isPrimitive(item)) {
      // Leaf-granular field for individual array element
      indexed[elementPath] = {
        path: elementPath,
        type: getValueType(item),
        isArrayCompressed: false,
      };
    } else if (Array.isArray(item)) {
      // Recursively index nested arrays
      indexArray(item, elementPath, indexed);
    } else if (typeof item === "object" && item !== null) {
      // Recursively index nested objects
      indexObject(item, elementPath, indexed);
    }
  });

  // Then, create array-compressed fields for primitive values
  const primitiveItems = arr.filter(isPrimitive);
  if (primitiveItems.length > 0) {
    const types = new Set<FieldType>();
    primitiveItems.forEach((item) => types.add(getValueType(item)));
    indexed[`${currentPath}.[*]`] = {
      path: `${currentPath}.[*]`,
      type: types.size === 1 ? Array.from(types)[0] : "string", // Default to string for mixed types
      arrayTypes: types,
      isArrayCompressed: true,
    };
  }

  // Handle arrays of objects
  const objectItems = arr.filter(
    (item) => typeof item === "object" && item !== null && !Array.isArray(item)
  );
  if (objectItems.length > 0) {
    // For each key in the objects, create array-compressed fields for primitive values
    const objectKeys = new Set<string>();
    objectItems.forEach((item) => {
      Object.keys(item as AnyObject).forEach((k) => objectKeys.add(k));
    });

    objectKeys.forEach((key) => {
      const values = objectItems
        .map((item) => (item as AnyObject)[key])
        .filter((v) => v !== undefined);

      const primitiveValues = values.filter(isPrimitive);
      if (primitiveValues.length > 0) {
        const types = new Set<FieldType>();
        primitiveValues.forEach((v) => types.add(getValueType(v)));
        indexed[`${currentPath}.[*].${key}`] = {
          path: `${currentPath}.[*].${key}`,
          type: types.size === 1 ? Array.from(types)[0] : "string", // Default to string for mixed types
          arrayTypes: types,
          isArrayCompressed: true,
        };
      }
    });
  }
}

export function indexJson(json: AnyObject): IndexedJson {
  return indexObject(json);
}
