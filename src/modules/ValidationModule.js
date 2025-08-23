const TypeUtils = require('../utils/TypeUtils');

class ValidationModule {
  constructor() {
    this.schemas = {};
    this.validators = {};
  }

  setSchema(key, schema) {
    TypeUtils.isValidInput(key);

    if (!schema || typeof schema !== 'object') {
      throw new Error('Schema must be an object');
    }

    this.schemas[key] = schema;
    return true;
  }

  getSchema(key) {
    TypeUtils.isValidInput(key);

    if (this.schemas[key]) {
      return this.schemas[key];
    }

    for (const [schemaKey, schema] of Object.entries(this.schemas)) {
      if (key.startsWith(schemaKey)) {
        return schema;
      }
    }

    return undefined;
  }

  removeSchema(key) {
    TypeUtils.isValidInput(key);

    if (key in this.schemas) {
      delete this.schemas[key];
      return true;
    }

    return false;
  }

  addValidator(name, validatorFunction) {
    TypeUtils.isValidInput(name, 'validator');

    if (typeof validatorFunction !== 'function') {
      throw new Error('Validator must be a function');
    }

    this.validators[name] = validatorFunction.toString();
    return true;
  }

  removeValidator(name) {
    TypeUtils.isValidInput(name, 'validator');

    if (name in this.validators) {
      delete this.validators[name];
      return true;
    }

    return false;
  }

  async validateAndProcess(key, value) {
    const schema = this.getSchema(key);
    if (!schema) {
      return value;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return await this.validateObjectFields(key, value, schema);
    }

    return await this.validateSingleValue(key, value, schema);
  }

  async validateObjectFields(key, obj, schema) {
    const validatedObj = { ...obj };

    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      if (fieldSchema.required && (validatedObj[fieldName] === undefined || validatedObj[fieldName] === null)) {
        throw new Error(`Field '${fieldName}' is required in '${key}'`);
      }

      if (validatedObj[fieldName] === undefined && fieldSchema.default !== undefined) {
        validatedObj[fieldName] =
          typeof fieldSchema.default === 'function'
            ? fieldSchema.default()
            : fieldSchema.default;
      }

      if (validatedObj[fieldName] !== undefined && validatedObj[fieldName] !== null) {
        validatedObj[fieldName] = await this.validateSingleValue(
          `${key}.${fieldName}`,
          validatedObj[fieldName],
          fieldSchema
        );
      }
    }

    return validatedObj;
  }

  async validateSingleValue(fieldPath, value, schema) {
    let processedValue = value;

    if (processedValue === undefined && schema.default !== undefined) {
      processedValue =
        typeof schema.default === 'function'
          ? schema.default()
          : schema.default;
    }

    if (schema.required && (processedValue === undefined || processedValue === null)) {
      throw new Error(`Field '${fieldPath}' is required`);
    }

    if (processedValue !== undefined && processedValue !== null) {
      if (schema.type) {
        const isValidType = TypeUtils.validateType(processedValue, schema.type);
        if (!isValidType) {
          throw new Error(
            `Field '${fieldPath}' must be of type '${schema.type}'`
          );
        }
      }

      if (schema.validator) {
        const isValid = await this.runValidator(
          schema.validator,
          processedValue,
          fieldPath
        );
        if (!isValid) {
          throw new Error(`Validation failed for field '${fieldPath}'`);
        }
      }

      if (schema.min !== undefined) {
        const meetsMin = TypeUtils.validateMin(processedValue, schema.min);
        if (!meetsMin) {
          throw new Error(
            `Field '${fieldPath}' must be at least ${schema.min}`
          );
        }
      }

      if (schema.max !== undefined) {
        const meetsMax = TypeUtils.validateMax(processedValue, schema.max);
        if (!meetsMax) {
          throw new Error(`Field '${fieldPath}' must be at most ${schema.max}`);
        }
      }

      if (schema.pattern) {
        const matchesPattern = TypeUtils.validatePattern(
          processedValue,
          schema.pattern
        );
        if (!matchesPattern) {
          throw new Error(
            `Field '${fieldPath}' does not match required pattern`
          );
        }
      }
    }

    return processedValue;
  }

  async runValidator(validatorName, value, key) {
    if (!this.validators[validatorName]) {
      throw new Error(`Validator '${validatorName}' not found`);
    }

    try {
      const validatorCode = this.validators[validatorName];
      const validatorFunction = eval(`(${validatorCode})`);
      const result = await validatorFunction(value, key);
      return Boolean(result);
    } catch (error) {
      return false;
    }
  }

  getAllSchemas() {
    return Object.assign({}, this.schemas);
  }

  getAllValidators() {
    return Object.assign({}, this.validators);
  }

  clearSchemas() {
    this.schemas = {};
    return true;
  }

  clearValidators() {
    this.validators = {};
    return true;
  }

  exportData() {
    return {
      schemas: this.schemas,
      validators: this.validators
    };
  }

  importData(data) {
    if (data.schemas) {
      this.schemas = data.schemas;
    }
    if (data.validators) {
      this.validators = data.validators;
    }
  }
}

module.exports = ValidationModule;
