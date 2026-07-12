/**
 * Request/response validation utilities with schema support
 */

export interface ValidationSchema {
  type?: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  properties?: Record<string, ValidationSchema>;
  items?: ValidationSchema;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: RegExp;
  enum?: any[];
  custom?: (value: any) => boolean | string;
  nullable?: boolean;
}

export interface ValidationError {
  path: string;
  message: string;
  value: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  data?: any;
}

export class Validator {
  /**
   * Validate data against a schema
   */
  validate(data: any, schema: ValidationSchema): ValidationResult {
    const errors: ValidationError[] = [];
    
    this.validateValue(data, schema, '', errors);
    
    return {
      valid: errors.length === 0,
      errors,
      data: errors.length === 0 ? data : undefined,
    };
  }

  private validateValue(
    value: any,
    schema: ValidationSchema,
    path: string,
    errors: ValidationError[]
  ): void {
    // Check nullable
    if (value === null || value === undefined) {
      if (!schema.nullable) {
        errors.push({
          path,
          message: 'Value cannot be null or undefined',
          value,
        });
      }
      return;
    }

    // Check type
    if (schema.type) {
      const typeError = this.checkType(value, schema.type, path);
      if (typeError) {
        errors.push(typeError);
        return;
      }
    }

    // Check enum
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        value,
      });
    }

    // Check pattern
    if (schema.pattern && typeof value === 'string') {
      if (!schema.pattern.test(value)) {
        errors.push({
          path,
          message: 'Value does not match required pattern',
          value,
        });
      }
    }

    // Check min/max for strings
    if (typeof value === 'string') {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({
          path,
          message: `Value must be at least ${schema.minLength} characters`,
          value,
        });
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push({
          path,
          message: `Value must be at most ${schema.maxLength} characters`,
          value,
        });
      }
    }

    // Check min/max for numbers
    if (typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({
          path,
          message: `Value must be at least ${schema.minimum}`,
          value,
        });
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({
          path,
          message: `Value must be at most ${schema.maximum}`,
          value,
        });
      }
    }

    // Check object properties
    if (schema.type === 'object' && schema.properties && typeof value === 'object') {
      // Check required properties
      if (schema.required) {
        for (const prop of schema.required) {
          if (!(prop in value) || value[prop] === undefined || value[prop] === null) {
            errors.push({
              path: path ? `${path}.${prop}` : prop,
              message: 'Property is required',
              value: undefined,
            });
          }
        }
      }

      // Validate each property
      for (const [prop, propSchema] of Object.entries(schema.properties)) {
        if (prop in value) {
          this.validateValue(
            value[prop],
            propSchema,
            path ? `${path}.${prop}` : prop,
            errors
          );
        }
      }
    }

    // Check array items
    if (schema.type === 'array' && schema.items && Array.isArray(value)) {
      value.forEach((item: any, index: number) => {
        this.validateValue(
          item,
          schema.items!,
          `${path}[${index}]`,
          errors
        );
      });
    }

    // Custom validation
    if (schema.custom) {
      const customResult = schema.custom(value);
      if (customResult !== true) {
        errors.push({
          path,
          message: typeof customResult === 'string' ? customResult : 'Custom validation failed',
          value,
        });
      }
    }
  }

  private checkType(value: any, type: string, path: string): ValidationError | null {
    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (actualType !== type) {
      return {
        path,
        message: `Expected type ${type}, got ${actualType}`,
        value,
      };
    }

    return null;
  }

  /**
   * Create a schema builder for easier schema creation
   */
  static schema(): SchemaBuilder {
    return new SchemaBuilder();
  }
}

export class SchemaBuilder {
  private schema: ValidationSchema = {};

  type(type: ValidationSchema['type']): SchemaBuilder {
    this.schema.type = type;
    return this;
  }

  properties(properties: Record<string, ValidationSchema>): SchemaBuilder {
    this.schema.properties = properties;
    return this;
  }

  items(items: ValidationSchema): SchemaBuilder {
    this.schema.items = items;
    return this;
  }

  required(required: string[]): SchemaBuilder {
    this.schema.required = required;
    return this;
  }

  minLength(minLength: number): SchemaBuilder {
    this.schema.minLength = minLength;
    return this;
  }

  maxLength(maxLength: number): SchemaBuilder {
    this.schema.maxLength = maxLength;
    return this;
  }

  minimum(minimum: number): SchemaBuilder {
    this.schema.minimum = minimum;
    return this;
  }

  maximum(maximum: number): SchemaBuilder {
    this.schema.maximum = maximum;
    return this;
  }

  pattern(pattern: RegExp): SchemaBuilder {
    this.schema.pattern = pattern;
    return this;
  }

  enum(values: any[]): SchemaBuilder {
    this.schema.enum = values;
    return this;
  }

  custom(validator: (value: any) => boolean | string): SchemaBuilder {
    this.schema.custom = validator;
    return this;
  }

  nullable(nullable: boolean = true): SchemaBuilder {
    this.schema.nullable = nullable;
    return this;
  }

  build(): ValidationSchema {
    return { ...this.schema };
  }
}

// Common schema templates
export const Schemas = {
  string: (options?: { minLength?: number; maxLength?: number; pattern?: RegExp; enum?: any[] }): ValidationSchema => ({
    type: 'string',
    ...options,
  }),

  number: (options?: { minimum?: number; maximum?: number }): ValidationSchema => ({
    type: 'number',
    ...options,
  }),

  boolean: (): ValidationSchema => ({
    type: 'boolean',
  }),

  array: (items: ValidationSchema): ValidationSchema => ({
    type: 'array',
    items,
  }),

  object: (properties: Record<string, ValidationSchema>, required?: string[]): ValidationSchema => ({
    type: 'object',
    properties,
    required,
  }),

  email: (): ValidationSchema => ({
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  }),

  url: (): ValidationSchema => ({
    type: 'string',
    pattern: /^https?:\/\/.+/,
  }),

  uuid: (): ValidationSchema => ({
    type: 'string',
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  }),
};

// Global validator instance
export const validator = new Validator();

// Convenience functions
export function validate(data: any, schema: ValidationSchema): ValidationResult {
  return validator.validate(data, schema);
}

export function createSchema(): SchemaBuilder {
  return Validator.schema();
}
