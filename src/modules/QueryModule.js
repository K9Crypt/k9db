const TypeUtils = require('../utils/TypeUtils');
const DatabaseUtils = require('../utils/DatabaseUtils');

class QueryModule {
  constructor() {
    this.queryCache = new Map();
  }

  search(query, data, options = {}) {
    if (typeof query !== 'string' && typeof query !== 'object' && typeof query !== 'function') {
      throw new Error('Query must be a string, object, or function');
    }

    const {
      caseSensitive = false,
      exactMatch = false,
      limit = 0,
      keys = Object.keys(data),
      valueOnly = false
    } = options;

    const results = [];
    const processedQuery = caseSensitive ? query : String(query).toLowerCase();

    const isMatch = (value) => {
      if (typeof query === 'function') {
        try {
          return query(value);
        } catch (e) {
          return false;
        }
      }

      if (query === null || query === undefined) {
        return value === query;
      }

      const strValue = String(value);
      const processedValue = caseSensitive ? strValue : strValue.toLowerCase();

      if (exactMatch) {
        return processedValue === processedQuery;
      }

      if (typeof query === 'object') {
        if (Array.isArray(query)) {
          return query.some((q) =>
            processedValue.includes(caseSensitive ? q : String(q).toLowerCase())
          );
        }
        return Object.entries(query).every(([k, v]) => {
          if (value && typeof value === 'object' && k in value) {
            return String(value[k]) === String(v);
          }
          return false;
        });
      }

      return processedValue.includes(processedQuery);
    };

    for (const key of keys) {
      if (key in data) {
        const value = data[key];

        if (isMatch(value)) {
          results.push(valueOnly ? value : { key, value });
          if (limit > 0 && results.length >= limit) {
            break;
          }
          continue;
        }

        if (value && typeof value === 'object') {
          if (Array.isArray(value)) {
            const matchingItems = value.filter(isMatch);
            if (matchingItems.length > 0) {
              results.push(
                valueOnly ? matchingItems : { key, value: matchingItems }
              );
              if (limit > 0 && results.length >= limit) {
                break;
              }
              continue;
            }
          }

          if (typeof value === 'object') {
            for (const [subKey, subValue] of Object.entries(value)) {
              if (isMatch(subValue)) {
                results.push(
                  valueOnly
                    ? subValue
                    : {
                        key: `${key}.${subKey}`,
                        value: subValue,
                        parent: value,
                        parentKey: key
                      }
                );
                if (limit > 0 && results.length >= limit) {
                  break;
                }
              }
            }
            if (limit > 0 && results.length >= limit) {
              break;
            }
          }
        }
      }
    }

    return results;
  }

  query(queryObject, data, options = {}) {
    if (!queryObject || (typeof queryObject !== 'object' && typeof queryObject !== 'function')) {
      throw new Error('Query must be an object or function');
    }

    const {
      limit = 0,
      skip = 0,
      sort = null,
      projection = null,
      cacheKey = null,
      explain = false
    } = options;

    if (cacheKey && this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey);
    }

    const queryPlan = {
      totalKeys: Object.keys(data).length,
      matchedKeys: 0,
      operations: [],
      executionTime: Date.now()
    };

    let results = [];
    const allKeys = Object.keys(data);

    for (const key of allKeys) {
      const value = data[key];
      let match;

      if (typeof queryObject === 'function') {
        try {
          match = queryObject(value, key);
        } catch (error) {
          match = false;
        }
      }

      if (typeof queryObject === 'object') {
        match = this.evaluateQuery(queryObject, value, key, queryPlan);
      }

      if (match) {
        queryPlan.matchedKeys++;
        let resultItem = { _key: key, ...value };

        if (projection) {
          resultItem = DatabaseUtils.applyProjection(resultItem, projection);
        }

        results.push(resultItem);
      }
    }

    if (sort) {
      results = DatabaseUtils.applySorting(results, sort);
    }

    if (skip > 0) {
      results = results.slice(skip);
    }

    if (limit > 0) {
      results = results.slice(0, limit);
    }

    queryPlan.executionTime = Date.now() - queryPlan.executionTime;
    queryPlan.resultCount = results.length;

    if (explain) {
      return {
        results,
        queryPlan
      };
    }

    if (cacheKey) {
      this.queryCache.set(cacheKey, results);
    }

    return results;
  }

  evaluateQuery(queryObject, value, key, queryPlan) {
    queryPlan.operations.push(`Evaluating key: ${key}`);
    return this.evaluateCondition(queryObject, value, key, queryPlan);
  }

  evaluateCondition(condition, value, key, queryPlan) {
    if (condition === null || condition === undefined) {
      return value === condition;
    }

    if (typeof condition === 'string' || typeof condition === 'number' || typeof condition === 'boolean') {
      return value === condition;
    }

    if (Array.isArray(condition)) {
      return condition.some((cond) =>
        this.evaluateCondition(cond, value, key, queryPlan)
      );
    }

    if (typeof condition === 'function') {
      try {
        return condition(value, key);
      } catch (error) {
        return false;
      }
    }

    if (typeof condition === 'object') {
      return this.evaluateObjectCondition(condition, value, key, queryPlan);
    }

    return false;
  }

  evaluateObjectCondition(condition, value, key, queryPlan) {
    for (const [condKey, condValue] of Object.entries(condition)) {
      if (condKey.startsWith('$')) {
        const result = this.evaluateOperator(
          condKey,
          condValue,
          value,
          key,
          queryPlan
        );
        if (!result) {
          return false;
        }
        continue;
      }

      if (condKey.includes('.')) {
        const result = this.evaluateNestedPath(
          condKey,
          condValue,
          value,
          key,
          queryPlan
        );
        if (!result) {
          return false;
        }
        continue;
      }

      if (value && typeof value === 'object' && condKey in value) {
        const result = this.evaluateCondition(
          condValue,
          value[condKey],
          key,
          queryPlan
        );
        if (!result) {
          return false;
        }
        continue;
      }

      return false;
    }

    return true;
  }

  evaluateOperator(operator, operand, value, key, queryPlan) {
    queryPlan.operations.push(`Operator: ${operator}`);

    if (operator === '$eq') {
      return value === operand;
    }

    if (operator === '$ne') {
      return value !== operand;
    }

    if (operator === '$gt') {
      return TypeUtils.isComparable(value, operand) && value > operand;
    }

    if (operator === '$gte') {
      return TypeUtils.isComparable(value, operand) && value >= operand;
    }

    if (operator === '$lt') {
      return TypeUtils.isComparable(value, operand) && value < operand;
    }

    if (operator === '$lte') {
      return TypeUtils.isComparable(value, operand) && value <= operand;
    }

    if (operator === '$in') {
      return Array.isArray(operand) && operand.includes(value);
    }

    if (operator === '$nin') {
      return Array.isArray(operand) && !operand.includes(value);
    }

    if (operator === '$exists') {
      return operand ? value !== undefined : value === undefined;
    }

    if (operator === '$type') {
      return TypeUtils.getValueType(value) === operand;
    }

    if (operator === '$regex') {
      if (typeof value !== 'string') {
        return false;
      }
      const regex = new RegExp(operand);
      return regex.test(value);
    }

    if (operator === '$contains') {
      if (typeof value === 'string') {
        return value.includes(operand);
      }
      if (Array.isArray(value)) {
        return value.includes(operand);
      }
      return false;
    }

    if (operator === '$startsWith') {
      return typeof value === 'string' && value.startsWith(operand);
    }

    if (operator === '$endsWith') {
      return typeof value === 'string' && value.endsWith(operand);
    }

    if (operator === '$between') {
      if (!Array.isArray(operand) || operand.length !== 2) {
        return false;
      }
      return (
        TypeUtils.isComparable(value, operand[0]) &&
        value >= operand[0] &&
        value <= operand[1]
      );
    }

    if (operator === '$size') {
      if (Array.isArray(value)) {
        return value.length === operand;
      }
      if (typeof value === 'string') {
        return value.length === operand;
      }
      return false;
    }

    if (operator === '$all') {
      if (!Array.isArray(value) || !Array.isArray(operand)) {
        return false;
      }
      return operand.every((item) => value.includes(item));
    }

    if (operator === '$elemMatch') {
      if (!Array.isArray(value)) {
        return false;
      }
      return value.some((item) =>
        this.evaluateCondition(operand, item, key, queryPlan)
      );
    }

    if (operator === '$and') {
      if (!Array.isArray(operand)) {
        return false;
      }
      return operand.every((cond) =>
        this.evaluateCondition(cond, value, key, queryPlan)
      );
    }

    if (operator === '$or') {
      if (!Array.isArray(operand)) {
        return false;
      }
      return operand.some((cond) =>
        this.evaluateCondition(cond, value, key, queryPlan)
      );
    }

    if (operator === '$not') {
      return !this.evaluateCondition(operand, value, key, queryPlan);
    }

    if (operator === '$nor') {
      if (!Array.isArray(operand)) {
        return false;
      }
      return !operand.some((cond) =>
        this.evaluateCondition(cond, value, key, queryPlan)
      );
    }

    if (operator === '$xor') {
      if (!Array.isArray(operand) || operand.length !== 2) {
        return false;
      }
      const result1 = this.evaluateCondition(operand[0], value, key, queryPlan);
      const result2 = this.evaluateCondition(operand[1], value, key, queryPlan);
      return (result1 && !result2) || (!result1 && result2);
    }

    if (operator === '$fuzzy') {
      if (typeof value !== 'string' || typeof operand !== 'string') {
        return false;
      }
      return (
        DatabaseUtils.calculateLevenshteinDistance(
          value.toLowerCase(),
          operand.toLowerCase()
        ) <= 2
      );
    }

    if (operator === '$search') {
      return DatabaseUtils.performTextSearch(value, operand);
    }

    return false;
  }

  evaluateNestedPath(path, condition, value, key, queryPlan) {
    const pathParts = path.split('.');
    let currentValue = value;

    for (const part of pathParts) {
      if (currentValue && typeof currentValue === 'object' && part in currentValue) {
        currentValue = currentValue[part];
        continue;
      }
      return false;
    }

    return this.evaluateCondition(condition, currentValue, key, queryPlan);
  }

  naturalQuery(naturalLanguageQuery, data, options = {}) {
    const normalizedQuery = naturalLanguageQuery.toLowerCase().trim();
    let queryObject = {};

    if (normalizedQuery.includes('greater than') || normalizedQuery.includes('>')) {
      const match = normalizedQuery.match(/(\w+)\s+(?:greater than|>)\s+(\d+)/);
      if (match) {
        queryObject[match[1]] = { $gt: parseInt(match[2]) };
      }
    }

    if (normalizedQuery.includes('less than') || normalizedQuery.includes('<')) {
      const match = normalizedQuery.match(/(\w+)\s+(?:less than|<)\s+(\d+)/);
      if (match) {
        queryObject[match[1]] = { $lt: parseInt(match[2]) };
      }
    }

    if (normalizedQuery.includes('contains')) {
      const match = normalizedQuery.match(/(\w+)\s+contains\s+"([^"]+)"/);
      if (match) {
        queryObject[match[1]] = { $contains: match[2] };
      }
    }

    if (normalizedQuery.includes('starts with')) {
      const match = normalizedQuery.match(/(\w+)\s+starts with\s+"([^"]+)"/);
      if (match) {
        queryObject[match[1]] = { $startsWith: match[2] };
      }
    }

    if (normalizedQuery.includes('ends with')) {
      const match = normalizedQuery.match(/(\w+)\s+ends with\s+"([^"]+)"/);
      if (match) {
        queryObject[match[1]] = { $endsWith: match[2] };
      }
    }

    if (normalizedQuery.includes('between')) {
      const match = normalizedQuery.match(
        /(\w+)\s+between\s+(\d+)\s+and\s+(\d+)/
      );
      if (match) {
        queryObject[match[1]] = {
          $between: [parseInt(match[2]), parseInt(match[3])]
        };
      }
    }

    return this.query(queryObject, data, options);
  }

  clearQueryCache() {
    this.queryCache.clear();
    return true;
  }

  getCacheSize() {
    return this.queryCache.size;
  }

  removeCacheEntry(key) {
    return this.queryCache.delete(key);
  }
}

module.exports = QueryModule;
