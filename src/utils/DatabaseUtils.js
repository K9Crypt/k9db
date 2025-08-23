const fs = require('fs');
const path = require('path');

class DatabaseUtils {
  static getNestedValue(obj, path) {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    const pathParts = path.split('.');
    let currentValue = obj;

    for (const part of pathParts) {
      if (currentValue && typeof currentValue === 'object' && part in currentValue) {
        currentValue = currentValue[part];
        continue;
      }
      return undefined;
    }

    return currentValue;
  }

  static setNestedValue(obj, path, value) {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    const pathParts = path.split('.');
    let currentObj = obj;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in currentObj)) {
        currentObj[part] = {};
      }
      currentObj = currentObj[part];
    }

    currentObj[pathParts[pathParts.length - 1]] = value;
  }

  static unsetNestedValue(obj, path) {
    if (!obj || typeof obj !== 'object') {
      return;
    }

    const pathParts = path.split('.');
    let currentObj = obj;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in currentObj)) {
        return;
      }
      currentObj = currentObj[part];
    }

    delete currentObj[pathParts[pathParts.length - 1]];
  }

  static ensureDirectoryExists(filePath) {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }

  static calculateLevenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  static performTextSearch(value, searchTerm) {
    if (typeof value === 'string') {
      return value.toLowerCase().includes(searchTerm.toLowerCase());
    }

    if (typeof value === 'object' && value !== null) {
      const valueString = JSON.stringify(value).toLowerCase();
      return valueString.includes(searchTerm.toLowerCase());
    }

    return false;
  }

  static applyProjection(item, projection) {
    if (typeof projection !== 'object' || projection === null) {
      return item;
    }

    const result = {};
    const includeMode = Object.values(projection).some(
      (val) => val === 1 || val === true
    );

    if (includeMode) {
      for (const [key, include] of Object.entries(projection)) {
        if (include === 1 || include === true) {
          if (key.includes('.')) {
            this.setNestedValue(result, key, this.getNestedValue(item, key));
          }
          if (key in item) {
            result[key] = item[key];
          }
        }
      }
    }

    if (!includeMode) {
      Object.assign(result, item);
      for (const [key, exclude] of Object.entries(projection)) {
        if (exclude === 0 || exclude === false) {
          if (key.includes('.')) {
            this.unsetNestedValue(result, key);
          }
          if (!key.includes('.')) {
            delete result[key];
          }
        }
      }
    }

    return result;
  }

  static applySorting(results, sortOptions) {
    if (typeof sortOptions === 'string') {
      return results.sort((a, b) => {
        const valueA = a[sortOptions];
        const valueB = b[sortOptions];

        if (valueA < valueB) return -1;
        if (valueA > valueB) return 1;
        return 0;
      });
    }

    if (typeof sortOptions === 'object' && sortOptions !== null) {
      return results.sort((a, b) => {
        for (const [field, direction] of Object.entries(sortOptions)) {
          const valueA = this.getNestedValue(a, field);
          const valueB = this.getNestedValue(b, field);

          const multiplier = direction === -1 || direction === 'desc' ? -1 : 1;

          if (valueA < valueB) return -1 * multiplier;
          if (valueA > valueB) return 1 * multiplier;
        }
        return 0;
      });
    }

    return results;
  }

  static generateTimestamp() {
    return new Date().toISOString().replace(/[:.]/g, '-');
  }

  static isValidConfig(config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Config object is required');
    }

    if (!config.path) {
      throw new Error('Database path is required');
    }

    if (!config.secretKey) {
      throw new Error('Secret key is required');
    }

    return true;
  }
}

module.exports = DatabaseUtils;
