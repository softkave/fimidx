import { describe, expect, it } from "vitest";
import { indexJson } from "./indexer.js";

describe("indexJson", () => {
  it("should extract leaf-granular fields from simple objects", () => {
    const input = {
      a: 1,
      b: "hello",
      c: true,
      d: null,
      e: undefined,
    };

    const result = indexJson(input);

    expect(result).toEqual({
      a: { path: "a", type: "number", isArrayCompressed: false },
      b: { path: "b", type: "string", isArrayCompressed: false },
      c: { path: "c", type: "boolean", isArrayCompressed: false },
      d: { path: "d", type: "null", isArrayCompressed: false },
      e: { path: "e", type: "undefined", isArrayCompressed: false },
    });
  });

  it("should extract leaf-granular fields from nested objects", () => {
    const input = {
      user: {
        profile: {
          name: "John",
          age: 30,
        },
        settings: {
          theme: "dark",
        },
      },
    };

    const result = indexJson(input);

    expect(result).toEqual({
      "user.profile.name": {
        path: "user.profile.name",
        type: "string",
        isArrayCompressed: false,
      },
      "user.profile.age": {
        path: "user.profile.age",
        type: "number",
        isArrayCompressed: false,
      },
      "user.settings.theme": {
        path: "user.settings.theme",
        type: "string",
        isArrayCompressed: false,
      },
    });
  });

  it("should create array-compressed fields for primitive arrays", () => {
    const input = {
      numbers: [1, 2, 3, 4],
      strings: ["a", "b", "c"],
      mixed: [1, "hello", true],
    };

    const result = indexJson(input);

    expect(result).toEqual({
      // Individual array elements as leaf-granular fields
      "numbers.0": {
        path: "numbers.0",
        type: "number",
        isArrayCompressed: false,
      },
      "numbers.1": {
        path: "numbers.1",
        type: "number",
        isArrayCompressed: false,
      },
      "numbers.2": {
        path: "numbers.2",
        type: "number",
        isArrayCompressed: false,
      },
      "numbers.3": {
        path: "numbers.3",
        type: "number",
        isArrayCompressed: false,
      },
      "strings.0": {
        path: "strings.0",
        type: "string",
        isArrayCompressed: false,
      },
      "strings.1": {
        path: "strings.1",
        type: "string",
        isArrayCompressed: false,
      },
      "strings.2": {
        path: "strings.2",
        type: "string",
        isArrayCompressed: false,
      },
      "mixed.0": { path: "mixed.0", type: "number", isArrayCompressed: false },
      "mixed.1": { path: "mixed.1", type: "string", isArrayCompressed: false },
      "mixed.2": { path: "mixed.2", type: "boolean", isArrayCompressed: false },
      // Array-compressed fields
      "numbers.[*]": {
        path: "numbers.[*]",
        type: "number",
        arrayTypes: new Set(["number"]),
        isArrayCompressed: true,
      },
      "strings.[*]": {
        path: "strings.[*]",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
      "mixed.[*]": {
        path: "mixed.[*]",
        type: "string", // Default type for mixed primitive types
        arrayTypes: new Set(["number", "string", "boolean"]),
        isArrayCompressed: true,
      },
    });
  });

  it("should create array-compressed fields for arrays of objects", () => {
    const input = {
      users: [
        { name: "John", age: 30 },
        { name: "Jane", age: 25 },
        { name: "Bob", age: 35 },
      ],
    };

    const result = indexJson(input);

    expect(result).toEqual({
      // Individual array elements with their nested fields
      "users.0.name": {
        path: "users.0.name",
        type: "string",
        isArrayCompressed: false,
      },
      "users.0.age": {
        path: "users.0.age",
        type: "number",
        isArrayCompressed: false,
      },
      "users.1.name": {
        path: "users.1.name",
        type: "string",
        isArrayCompressed: false,
      },
      "users.1.age": {
        path: "users.1.age",
        type: "number",
        isArrayCompressed: false,
      },
      "users.2.name": {
        path: "users.2.name",
        type: "string",
        isArrayCompressed: false,
      },
      "users.2.age": {
        path: "users.2.age",
        type: "number",
        isArrayCompressed: false,
      },
      // Array-compressed fields
      "users.[*].name": {
        path: "users.[*].name",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
      "users.[*].age": {
        path: "users.[*].age",
        type: "number",
        arrayTypes: new Set(["number"]),
        isArrayCompressed: true,
      },
    });
  });

  it("should handle mixed object structures in arrays", () => {
    const input = {
      items: [
        { name: "item1", value: 100 },
        { name: "item2", value: "text" },
        { name: "item3", value: true },
      ],
    };

    const result = indexJson(input);

    expect(result).toEqual({
      // Individual array elements with their nested fields
      "items.0.name": {
        path: "items.0.name",
        type: "string",
        isArrayCompressed: false,
      },
      "items.0.value": {
        path: "items.0.value",
        type: "number",
        isArrayCompressed: false,
      },
      "items.1.name": {
        path: "items.1.name",
        type: "string",
        isArrayCompressed: false,
      },
      "items.1.value": {
        path: "items.1.value",
        type: "string",
        isArrayCompressed: false,
      },
      "items.2.name": {
        path: "items.2.name",
        type: "string",
        isArrayCompressed: false,
      },
      "items.2.value": {
        path: "items.2.value",
        type: "boolean",
        isArrayCompressed: false,
      },
      // Array-compressed fields
      "items.[*].name": {
        path: "items.[*].name",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
      "items.[*].value": {
        path: "items.[*].value",
        type: "string", // Default type for mixed primitive types
        arrayTypes: new Set(["number", "string", "boolean"]),
        isArrayCompressed: true,
      },
    });
  });

  it("should handle nested arrays", () => {
    const input = {
      matrix: [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
    };

    const result = indexJson(input);

    expect(result).toEqual({
      // Individual array elements (nested arrays)
      "matrix.0.0": {
        path: "matrix.0.0",
        type: "number",
        isArrayCompressed: false,
      },
      "matrix.0.1": {
        path: "matrix.0.1",
        type: "number",
        isArrayCompressed: false,
      },
      "matrix.0.2": {
        path: "matrix.0.2",
        type: "number",
        isArrayCompressed: false,
      },
      "matrix.1.0": {
        path: "matrix.1.0",
        type: "number",
        isArrayCompressed: false,
      },
      "matrix.1.1": {
        path: "matrix.1.1",
        type: "number",
        isArrayCompressed: false,
      },
      "matrix.1.2": {
        path: "matrix.1.2",
        type: "number",
        isArrayCompressed: false,
      },
      "matrix.2.0": {
        path: "matrix.2.0",
        type: "number",
        isArrayCompressed: false,
      },
      "matrix.2.1": {
        path: "matrix.2.1",
        type: "number",
        isArrayCompressed: false,
      },
      "matrix.2.2": {
        path: "matrix.2.2",
        type: "number",
        isArrayCompressed: false,
      },
      // Array-compressed fields for primitive values
      "matrix.0.[*]": {
        path: "matrix.0.[*]",
        type: "number",
        arrayTypes: new Set(["number"]),
        isArrayCompressed: true,
      },
      "matrix.1.[*]": {
        path: "matrix.1.[*]",
        type: "number",
        arrayTypes: new Set(["number"]),
        isArrayCompressed: true,
      },
      "matrix.2.[*]": {
        path: "matrix.2.[*]",
        type: "number",
        arrayTypes: new Set(["number"]),
        isArrayCompressed: true,
      },
    });
  });

  it("should handle empty arrays", () => {
    const input = {
      empty: [],
    };

    const result = indexJson(input);

    expect(result).toEqual({});
  });

  it("should handle complex nested structures", () => {
    const input = {
      company: {
        departments: [
          {
            name: "Engineering",
            employees: [
              { name: "Alice", role: "Developer" },
              { name: "Bob", role: "Manager" },
            ],
          },
          {
            name: "Marketing",
            employees: [{ name: "Charlie", role: "Designer" }],
          },
        ],
      },
    };

    const result = indexJson(input);

    expect(result).toEqual({
      // Individual array elements with their nested fields
      "company.departments.0.name": {
        path: "company.departments.0.name",
        type: "string",
        isArrayCompressed: false,
      },
      "company.departments.0.employees.0.name": {
        path: "company.departments.0.employees.0.name",
        type: "string",
        isArrayCompressed: false,
      },
      "company.departments.0.employees.0.role": {
        path: "company.departments.0.employees.0.role",
        type: "string",
        isArrayCompressed: false,
      },
      "company.departments.0.employees.1.name": {
        path: "company.departments.0.employees.1.name",
        type: "string",
        isArrayCompressed: false,
      },
      "company.departments.0.employees.1.role": {
        path: "company.departments.0.employees.1.role",
        type: "string",
        isArrayCompressed: false,
      },
      "company.departments.0.employees.[*].name": {
        path: "company.departments.0.employees.[*].name",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
      "company.departments.0.employees.[*].role": {
        path: "company.departments.0.employees.[*].role",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
      "company.departments.1.name": {
        path: "company.departments.1.name",
        type: "string",
        isArrayCompressed: false,
      },
      "company.departments.1.employees.0.name": {
        path: "company.departments.1.employees.0.name",
        type: "string",
        isArrayCompressed: false,
      },
      "company.departments.1.employees.0.role": {
        path: "company.departments.1.employees.0.role",
        type: "string",
        isArrayCompressed: false,
      },
      "company.departments.1.employees.[*].name": {
        path: "company.departments.1.employees.[*].name",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
      "company.departments.1.employees.[*].role": {
        path: "company.departments.1.employees.[*].role",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
      // Array-compressed fields
      "company.departments.[*].name": {
        path: "company.departments.[*].name",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
    });
  });

  it("should handle arrays with mixed types", () => {
    const input = {
      mixed: [
        { type: "user", data: { name: "John" } },
        { type: "product", data: { price: 100 } },
        { type: "order", data: { items: ["item1", "item2"] } },
      ],
    };

    const result = indexJson(input);

    expect(result).toEqual({
      // Individual array elements with their nested fields
      "mixed.0.type": {
        path: "mixed.0.type",
        type: "string",
        isArrayCompressed: false,
      },
      "mixed.0.data.name": {
        path: "mixed.0.data.name",
        type: "string",
        isArrayCompressed: false,
      },
      "mixed.1.type": {
        path: "mixed.1.type",
        type: "string",
        isArrayCompressed: false,
      },
      "mixed.1.data.price": {
        path: "mixed.1.data.price",
        type: "number",
        isArrayCompressed: false,
      },
      "mixed.2.type": {
        path: "mixed.2.type",
        type: "string",
        isArrayCompressed: false,
      },
      "mixed.2.data.items.0": {
        path: "mixed.2.data.items.0",
        type: "string",
        isArrayCompressed: false,
      },
      "mixed.2.data.items.1": {
        path: "mixed.2.data.items.1",
        type: "string",
        isArrayCompressed: false,
      },
      // Array-compressed fields for primitive values
      "mixed.[*].type": {
        path: "mixed.[*].type",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
      "mixed.2.data.items.[*]": {
        path: "mixed.2.data.items.[*]",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
    });
  });

  it("should extract leaf-granular fields for nested array elements and object content as specified", () => {
    const input = {
      a: {
        0: "primitive_value", // a.0 is primitive
        1: { b: "nested_primitive" }, // a.1.b is primitive
        arr: [
          "primitive1", // a.arr[0] is primitive
          "primitive2", // a.arr[1] is primitive
          { c: "object_primitive" }, // a.arr[2].c is primitive
        ],
      },
    };

    const result = indexJson(input);

    expect(result).toEqual({
      // Leaf-granular fields for nested array elements (a.0)
      "a.0": { path: "a.0", type: "string", isArrayCompressed: false },
      // Leaf-granular fields for object content (a.1.b)
      "a.1.b": { path: "a.1.b", type: "string", isArrayCompressed: false },
      // Individual array elements
      "a.arr.0": { path: "a.arr.0", type: "string", isArrayCompressed: false },
      "a.arr.1": { path: "a.arr.1", type: "string", isArrayCompressed: false },
      "a.arr.2.c": {
        path: "a.arr.2.c",
        type: "string",
        isArrayCompressed: false,
      },
      // Array-compressed fields
      "a.arr.[*]": {
        path: "a.arr.[*]",
        type: "string", // Default type for mixed primitive types
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
      "a.arr.[*].c": {
        path: "a.arr.[*].c",
        type: "string",
        arrayTypes: new Set(["string"]),
        isArrayCompressed: true,
      },
    });
  });
});
