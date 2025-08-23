class TypeUtils {
  static getValueType(value) {
    if (value === null) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    if (value instanceof Date) {
      return 'date';
    }

    return typeof value;
  }

  static validateType(value, expectedType) {
    if (expectedType === 'string') {
      return typeof value === 'string';
    }

    if (expectedType === 'number') {
      return typeof value === 'number' && !isNaN(value);
    }

    if (expectedType === 'boolean') {
      return typeof value === 'boolean';
    }

    if (expectedType === 'array') {
      return Array.isArray(value);
    }

    if (expectedType === 'object') {
      return (
        typeof value === 'object' && value !== null && !Array.isArray(value)
      );
    }

    if (expectedType === 'date') {
      return (
        value instanceof Date ||
        (typeof value === 'string' && !isNaN(Date.parse(value)))
      );
    }

    return true;
  }

  static isComparable(value1, value2) {
    const type1 = typeof value1;
    const type2 = typeof value2;

    if (type1 === 'number' && type2 === 'number') {
      return true;
    }

    if (type1 === 'string' && type2 === 'string') {
      return true;
    }

    if (value1 instanceof Date && value2 instanceof Date) {
      return true;
    }

    return false;
  }

  static validateMin(value, min) {
    if (typeof value === 'number') {
      return value >= min;
    }

    if (typeof value === 'string') {
      return value.length >= min;
    }

    if (Array.isArray(value)) {
      return value.length >= min;
    }

    return true;
  }

  static validateMax(value, max) {
    if (typeof value === 'number') {
      return value <= max;
    }

    if (typeof value === 'string') {
      return value.length <= max;
    }

    if (Array.isArray(value)) {
      return value.length <= max;
    }

    return true;
  }

  static validatePattern(value, pattern) {
    if (typeof value !== 'string') {
      return false;
    }

    const regex = new RegExp(pattern);
    return regex.test(value);
  }

  static isValidInput(key, operation = 'general') {
    if (typeof key !== 'string') {
      throw new Error('Key must be a string');
    }

    if (operation === 'validator' && typeof key !== 'string') {
      throw new Error('Validator name must be a string');
    }

    return true;
  }
}

module.exports = TypeUtils;
