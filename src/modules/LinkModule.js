const TypeUtils = require('../utils/TypeUtils');

class LinkModule {
  constructor() {
    this.links = {};
    this.linkedTo = {};
  }

  async link(sourceKey, targetKey, dataStore) {
    TypeUtils.isValidInput(sourceKey);
    TypeUtils.isValidInput(targetKey);

    if (!dataStore || typeof dataStore !== 'object') {
      throw new Error('Data store is required for link validation');
    }

    if (!(sourceKey in dataStore)) {
      throw new Error('Source key does not exist');
    }

    if (!(targetKey in dataStore)) {
      throw new Error('Target key does not exist');
    }

    if (!this.links[sourceKey]) {
      this.links[sourceKey] = [];
    }

    if (!this.linkedTo[targetKey]) {
      this.linkedTo[targetKey] = [];
    }

    if (!this.links[sourceKey].includes(targetKey)) {
      this.links[sourceKey].push(targetKey);
    }

    if (!this.linkedTo[targetKey].includes(sourceKey)) {
      this.linkedTo[targetKey].push(sourceKey);
    }

    return true;
  }

  async unlink(sourceKey, targetKey) {
    TypeUtils.isValidInput(sourceKey);
    TypeUtils.isValidInput(targetKey);

    if (this.links[sourceKey]) {
      this.links[sourceKey] = this.links[sourceKey].filter(
        (key) => key !== targetKey
      );
      if (this.links[sourceKey].length === 0) {
        delete this.links[sourceKey];
      }
    }

    if (this.linkedTo[targetKey]) {
      this.linkedTo[targetKey] = this.linkedTo[targetKey].filter(
        (key) => key !== sourceKey
      );
      if (this.linkedTo[targetKey].length === 0) {
        delete this.linkedTo[targetKey];
      }
    }

    return true;
  }

  getLinks(key) {
    TypeUtils.isValidInput(key);
    return this.links[key] ? [...this.links[key]] : [];
  }

  getLinkedTo(key) {
    TypeUtils.isValidInput(key);
    return this.linkedTo[key] ? [...this.linkedTo[key]] : [];
  }

  isLinked(sourceKey, targetKey) {
    TypeUtils.isValidInput(sourceKey);
    TypeUtils.isValidInput(targetKey);

    if (!this.links[sourceKey]) {
      return false;
    }

    return this.links[sourceKey].includes(targetKey);
  }

  getAllLinks() {
    return Object.assign({}, this.links);
  }

  getAllLinkedTo() {
    return Object.assign({}, this.linkedTo);
  }

  removeKeyFromLinks(key) {
    TypeUtils.isValidInput(key);

    const linkedKeys = this.getLinks(key);

    if (this.links[key]) {
      delete this.links[key];
    }

    if (this.linkedTo[key]) {
      for (const sourceKey of this.linkedTo[key]) {
        if (this.links[sourceKey]) {
          this.links[sourceKey] = this.links[sourceKey].filter(
            (k) => k !== key
          );
          if (this.links[sourceKey].length === 0) {
            delete this.links[sourceKey];
          }
        }
      }
      delete this.linkedTo[key];
    }

    return linkedKeys;
  }

  getLinkedKeys(key) {
    TypeUtils.isValidInput(key);

    const directLinks = this.getLinks(key);
    const reverseLinks = this.getLinkedTo(key);

    return [...new Set([...directLinks, ...reverseLinks])];
  }

  hasAnyLinks(key) {
    TypeUtils.isValidInput(key);

    const hasForwardLinks = this.links[key] && this.links[key].length > 0;
    const hasBackwardLinks =
      this.linkedTo[key] && this.linkedTo[key].length > 0;

    return hasForwardLinks || hasBackwardLinks;
  }

  clearAllLinks() {
    this.links = {};
    this.linkedTo = {};
    return true;
  }

  exportData() {
    return {
      links: this.links,
      linkedTo: this.linkedTo
    };
  }

  importData(data) {
    if (data.links) {
      this.links = data.links;
    }
    if (data.linkedTo) {
      this.linkedTo = data.linkedTo;
    }
  }

  validateLinkIntegrity(dataStore) {
    const invalidLinks = [];

    for (const [sourceKey, targets] of Object.entries(this.links)) {
      if (!(sourceKey in dataStore)) {
        invalidLinks.push({ type: 'missing_source', key: sourceKey });
        continue;
      }

      for (const targetKey of targets) {
        if (!(targetKey in dataStore)) {
          invalidLinks.push({
            type: 'missing_target',
            source: sourceKey,
            target: targetKey
          });
        }
      }
    }

    return invalidLinks;
  }

  repairLinkIntegrity(dataStore) {
    const repairedCount = { removed: 0, fixed: 0 };

    for (const [sourceKey, targets] of Object.entries(this.links)) {
      if (!(sourceKey in dataStore)) {
        delete this.links[sourceKey];
        repairedCount.removed++;
        continue;
      }

      const validTargets = targets.filter((targetKey) => {
        if (targetKey in dataStore) {
          return true;
        }
        repairedCount.removed++;
        return false;
      });

      if (validTargets.length === 0) {
        delete this.links[sourceKey];
      }
      if (validTargets.length > 0) {
        this.links[sourceKey] = validTargets;
        repairedCount.fixed++;
      }
    }

    for (const [targetKey, sources] of Object.entries(this.linkedTo)) {
      if (!(targetKey in dataStore)) {
        delete this.linkedTo[targetKey];
        continue;
      }

      const validSources = sources.filter(
        (sourceKey) => sourceKey in dataStore
      );

      if (validSources.length === 0) {
        delete this.linkedTo[targetKey];
      }
      if (validSources.length > 0) {
        this.linkedTo[targetKey] = validSources;
      }
    }

    return repairedCount;
  }
}

module.exports = LinkModule;
