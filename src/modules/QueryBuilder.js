class QueryBuilder {
  constructor(queryModule, dataProvider) {
    this.queryModule = queryModule;
    this.dataProvider = dataProvider;
    this.queryObject = {};
    this.options = {};
  }

  where(field, operator, value) {
    if (arguments.length === 2) {
      this.queryObject[field] = operator;
      return this;
    }

    if (operator === '=') {
      this.queryObject[field] = { $eq: value };
    }

    if (operator === '!=') {
      this.queryObject[field] = { $ne: value };
    }

    if (operator === '>') {
      this.queryObject[field] = { $gt: value };
    }

    if (operator === '>=') {
      this.queryObject[field] = { $gte: value };
    }

    if (operator === '<') {
      this.queryObject[field] = { $lt: value };
    }

    if (operator === '<=') {
      this.queryObject[field] = { $lte: value };
    }

    if (operator === 'in') {
      this.queryObject[field] = { $in: value };
    }

    if (operator === 'contains') {
      this.queryObject[field] = { $contains: value };
    }

    if (operator === 'startsWith') {
      this.queryObject[field] = { $startsWith: value };
    }

    if (operator === 'endsWith') {
      this.queryObject[field] = { $endsWith: value };
    }

    if (operator === 'regex') {
      this.queryObject[field] = { $regex: value };
    }

    if (operator === 'fuzzy') {
      this.queryObject[field] = { $fuzzy: value };
    }

    return this;
  }

  and(...conditions) {
    if (!this.queryObject.$and) {
      this.queryObject.$and = [];
    }
    this.queryObject.$and.push(...conditions);
    return this;
  }

  or(...conditions) {
    if (!this.queryObject.$or) {
      this.queryObject.$or = [];
    }
    this.queryObject.$or.push(...conditions);
    return this;
  }

  not(condition) {
    this.queryObject.$not = condition;
    return this;
  }

  exists(field, shouldExist = true) {
    this.queryObject[field] = { $exists: shouldExist };
    return this;
  }

  type(field, expectedType) {
    this.queryObject[field] = { $type: expectedType };
    return this;
  }

  between(field, min, max) {
    this.queryObject[field] = { $between: [min, max] };
    return this;
  }

  size(field, expectedSize) {
    this.queryObject[field] = { $size: expectedSize };
    return this;
  }

  limit(count) {
    this.options.limit = count;
    return this;
  }

  skip(count) {
    this.options.skip = count;
    return this;
  }

  sort(field, direction = 1) {
    if (!this.options.sort) {
      this.options.sort = {};
    }
    this.options.sort[field] = direction;
    return this;
  }

  project(projection) {
    this.options.projection = projection;
    return this;
  }

  cache(key) {
    this.options.cacheKey = key;
    return this;
  }

  explain() {
    this.options.explain = true;
    return this;
  }

  elemMatch(field, condition) {
    this.queryObject[field] = { $elemMatch: condition };
    return this;
  }

  all(field, values) {
    this.queryObject[field] = { $all: values };
    return this;
  }

  nin(field, values) {
    this.queryObject[field] = { $nin: values };
    return this;
  }

  nor(...conditions) {
    if (!this.queryObject.$nor) {
      this.queryObject.$nor = [];
    }
    this.queryObject.$nor.push(...conditions);
    return this;
  }

  text(field, searchTerm) {
    this.queryObject[field] = { $search: searchTerm };
    return this;
  }

  reset() {
    this.queryObject = {};
    this.options = {};
    return this;
  }

  getQuery() {
    return {
      query: { ...this.queryObject },
      options: { ...this.options }
    };
  }

  count(data = null) {
    const dataToUse = data || this.dataProvider();
    const results = this.queryModule.query(
      this.queryObject,
      dataToUse,
      this.options
    );
    return Array.isArray(results) ? results.length : 0;
  }

  first(data = null) {
    const originalLimit = this.options.limit;
    this.options.limit = 1;

    const dataToUse = data || this.dataProvider();
    const results = this.queryModule.query(
      this.queryObject,
      dataToUse,
      this.options
    );

    this.options.limit = originalLimit;

    return Array.isArray(results) && results.length > 0 ? results[0] : null;
  }

  execute(data = null) {
    const dataToUse = data || this.dataProvider();
    return this.queryModule.query(this.queryObject, dataToUse, this.options);
  }

  clone() {
    const cloned = new QueryBuilder(this.queryModule, this.dataProvider);
    cloned.queryObject = JSON.parse(JSON.stringify(this.queryObject));
    cloned.options = JSON.parse(JSON.stringify(this.options));
    return cloned;
  }
}

module.exports = QueryBuilder;
