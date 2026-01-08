import { z, ZodTypeAny } from "zod";

/**
 * Recursively converts a JSON Schema object into a Zod schema, preserving all
 * nested structures, descriptions, and optionality.
 * @param schema The JSON schema fragment to convert.
 * @returns A Zod schema object.
 */
function jsonSchemaToZodRecursive(schema: any): ZodTypeAny {
  // Base case: if the schema is not an object, we can't process it.
  if (typeof schema !== "object" || schema === null) {
    return z.any();
  }

  switch (schema.type) {
    case "object": {
      const shape: { [key: string]: ZodTypeAny } = {};
      if (schema.properties) {
        for (const key in schema.properties) {
          const propSchema = schema.properties[key];
          let zodProp = jsonSchemaToZodRecursive(propSchema);

          // Handle optionality based on the 'required' array of the current object
          if (!schema.required?.includes(key)) {
            zodProp = zodProp.optional();
          }
          shape[key] = zodProp;
        }
      }
      let objectSchema = z.object(shape);
      if (schema.description) {
        objectSchema = objectSchema.describe(schema.description);
      }
      return objectSchema;
    }

    case "array": {
      if (!schema.items) {
        return z.array(z.any());
      }
      let arraySchema = z.array(jsonSchemaToZodRecursive(schema.items));
      if (schema.description) {
        arraySchema = arraySchema.describe(schema.description);
      }
      return arraySchema;
    }

    case "string": {
      let stringSchema;
      if (schema.enum) {
        // z.enum requires a non-empty array of strings
        const enumValues = schema.enum.filter((v: any) => typeof v === 'string') as [string, ...string[]];
        if (enumValues.length > 0) {
            stringSchema = z.enum(enumValues);
        } else {
            stringSchema = z.string(); // Fallback if enum is invalid
        }
      } else {
        stringSchema = z.string();
      }
      if (schema.description) {
        return stringSchema.describe(schema.description);
      }
      return stringSchema;
    }

    case "number":
    case "integer": {
      let numSchema = z.number();
      if (schema.description) {
        return numSchema.describe(schema.description);
      }
      return numSchema;
    }

    case "boolean": {
      let boolSchema = z.boolean();
      if (schema.description) {
        return boolSchema.describe(schema.description);
      }
      return boolSchema;
    }

    default:
      return z.any();
  }
}

/**
 * Main entry point for converting a full JSON Schema to a Zod schema.
 * @param jsonSchema The root JSON Schema object.
 * @returns A Zod schema object.
 */
export function jsonSchemaToZod(jsonSchema: any): ZodTypeAny {
  return jsonSchemaToZodRecursive(jsonSchema);
}