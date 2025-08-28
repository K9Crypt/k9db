const K9Crypt = require('k9crypt');
const fs = require('fs');
const path = require('path');
const DatabaseUtils = require('../utils/DatabaseUtils');
const TypeUtils = require('../utils/TypeUtils');
const ValidationModule = require('../modules/ValidationModule');
const QueryModule = require('../modules/QueryModule');
const BackupModule = require('../modules/BackupModule');
const LinkModule = require('../modules/LinkModule');
const QueryBuilder = require('../modules/QueryBuilder');
const ClusterManager = require('../modules/ClusterManager');
const CacheModule = require('../modules/CacheModule');
const QueryExecutor = require('../modules/QueryExecutor');
const LoadBalancer = require('../modules/LoadBalancer');
const MonitoringModule = require('../modules/MonitoringModule');

class K9DB {
  constructor(config) {
    DatabaseUtils.isValidConfig(config);

    this.databasePath = config.path;
    this.encryptor = new K9Crypt(config.secretKey);
    this.data = {};
    this.isInitialized = false;

    this.validationModule = new ValidationModule();
    this.queryModule = new QueryModule();
    this.backupModule = new BackupModule(this.databasePath, this.encryptor);
    this.linkModule = new LinkModule();

    this.clusterManager = new ClusterManager(config.cluster || {});
    this.cacheModule = new CacheModule(config.cache || {});
    this.queryExecutor = new QueryExecutor(this.clusterManager);
    this.loadBalancer = new LoadBalancer(this.clusterManager);
    this.monitoringModule = new MonitoringModule(this.clusterManager);

    if (config.monitoring && config.monitoring.enabled) {
      this.monitoringModule.startMonitoring(config.monitoring.interval);
    }
  }

  async loadDatabase() {
    if (!fs.existsSync(this.databasePath)) {
      return;
    }

    try {
      const encryptedData = fs.readFileSync(this.databasePath, 'utf8');
      if (encryptedData.trim()) {
        const decryptedData = await this.encryptor.decrypt(encryptedData);
        const parsedData = JSON.parse(decryptedData);

        this.data = parsedData.data || {};
        this.validationModule.importData(parsedData);
        this.linkModule.importData(parsedData);
        this.queryModule.clearQueryCache();
      }
    } catch (error) {
      this.data = {};
      this.validationModule = new ValidationModule();
      this.linkModule = new LinkModule();
      this.queryModule.clearQueryCache();
    }
  }

  async saveDatabase() {
    try {
      const fullData = {
        data: this.data,
        ...this.validationModule.exportData(),
        ...this.linkModule.exportData()
      };

      const dataString = JSON.stringify(fullData, null, 2);
      const encryptedData = await this.encryptor.encrypt(dataString);

      DatabaseUtils.ensureDirectoryExists(this.databasePath);
      fs.writeFileSync(this.databasePath, encryptedData, 'utf8');
    } catch (error) {
      throw new Error(`Database save failed: ${error.message}`);
    }
  }

  async set(key, value) {
    TypeUtils.isValidInput(key);

    const validatedValue = await this.validationModule.validateAndProcess(
      key,
      value
    );
    this.data[key] = validatedValue;
    await this.saveDatabase();
    return true;
  }

  get(key) {
    TypeUtils.isValidInput(key);
    return this.data[key];
  }

  async delete(key) {
    TypeUtils.isValidInput(key);

    if (key in this.data) {
      await this.deleteWithLinks(key);
      return true;
    }

    return false;
  }

  exists(key) {
    TypeUtils.isValidInput(key);
    return key in this.data;
  }

  async clear() {
    this.data = {};
    this.validationModule.clearSchemas();
    this.validationModule.clearValidators();
    this.linkModule.clearAllLinks();
    this.queryModule.clearQueryCache();
    await this.saveDatabase();
    return true;
  }

  setSchema(key, schema) {
    return this.validationModule.setSchema(key, schema);
  }

  getSchema(key) {
    return this.validationModule.getSchema(key);
  }

  removeSchema(key) {
    return this.validationModule.removeSchema(key);
  }

  addValidator(name, validatorFunction) {
    return this.validationModule.addValidator(name, validatorFunction);
  }

  removeValidator(name) {
    return this.validationModule.removeValidator(name);
  }

  getAllKeys() {
    return Object.keys(this.data);
  }

  size() {
    return Object.keys(this.data).length;
  }

  async init() {
    if (!this.isInitialized) {
      await this.loadDatabase();
      this.isInitialized = true;
    }
    return this;
  }

  async changeSecretKey(newKey) {
    if (!newKey || typeof newKey !== 'string') {
      throw new Error('New secret key must be a non-empty string');
    }

    this.encryptor = new K9Crypt(newKey);
    await this.saveDatabase();
    return true;
  }

  async push(key, value) {
    TypeUtils.isValidInput(key);

    if (!Array.isArray(this.data[key])) {
      if (this.data[key] !== undefined) {
        this.data[key] = [this.data[key]];
      }
      if (this.data[key] === undefined) {
        this.data[key] = [];
      }
    }

    const validatedValue = await this.validationModule.validateAndProcess(
      key,
      value
    );
    this.data[key].push(validatedValue);
    await this.saveDatabase();
    return true;
  }

  fetchAll() {
    return Object.assign({}, this.data);
  }

  async pull(key, value) {
    TypeUtils.isValidInput(key);

    if (!Array.isArray(this.data[key])) {
      return false;
    }

    const filtered = this.data[key].filter((item) => item !== value);

    if (filtered.length !== this.data[key].length) {
      this.data[key] = filtered;
      await this.saveDatabase();
      return true;
    }

    return false;
  }

  async link(sourceKey, targetKey) {
    const result = await this.linkModule.link(sourceKey, targetKey, this.data);
    if (result) {
      await this.saveDatabase();
    }
    return result;
  }

  async unlink(sourceKey, targetKey) {
    const result = await this.linkModule.unlink(sourceKey, targetKey);
    if (result) {
      await this.saveDatabase();
    }
    return result;
  }

  getLinks(key) {
    return this.linkModule.getLinks(key);
  }

  getLinkedTo(key) {
    return this.linkModule.getLinkedTo(key);
  }

  async deleteWithLinks(key) {
    TypeUtils.isValidInput(key);

    const linkedKeys = this.linkModule.removeKeyFromLinks(key);
    delete this.data[key];

    for (const linkedKey of linkedKeys) {
      if (linkedKey in this.data) {
        await this.deleteWithLinks(linkedKey);
      }
    }

    await this.saveDatabase();
    return true;
  }

  isLinked(sourceKey, targetKey) {
    return this.linkModule.isLinked(sourceKey, targetKey);
  }

  getAllLinks() {
    return this.linkModule.getAllLinks();
  }

  search(query, options = {}) {
    return this.queryModule.search(query, this.data, options);
  }

  query(queryObject, options = {}) {
    return this.queryModule.query(queryObject, this.data, options);
  }

  queryBuilder() {
    return new QueryBuilder(this.queryModule, () => this.data);
  }

  clearQueryCache() {
    return this.queryModule.clearQueryCache();
  }

  naturalQuery(naturalLanguageQuery, options = {}) {
    return this.queryModule.naturalQuery(
      naturalLanguageQuery,
      this.data,
      options
    );
  }

  async backup(backupPath, options = {}) {
    await this.saveDatabase();
    return this.backupModule.backup(backupPath, options);
  }

  async restore(backupPath, options = {}) {
    const result = await this.backupModule.restore(backupPath, options);
    if (result) {
      await this.loadDatabase();
    }
    return result;
  }

  listBackups(directory) {
    return this.backupModule.listBackups(directory);
  }

  cleanupBackups(options = {}) {
    return this.backupModule.cleanupBackups(options);
  }

  validateBackup(backupPath) {
    return this.backupModule.validateBackup(backupPath);
  }

  getBackupInfo(backupPath) {
    return this.backupModule.getBackupInfo(backupPath);
  }

  repairLinkIntegrity() {
    return this.linkModule.repairLinkIntegrity(this.data);
  }

  validateLinkIntegrity() {
    return this.linkModule.validateLinkIntegrity(this.data);
  }

  getStats() {
    return {
      totalKeys: this.size(),
      schemas: Object.keys(this.validationModule.getAllSchemas()).length,
      validators: Object.keys(this.validationModule.getAllValidators()).length,
      links: Object.keys(this.linkModule.getAllLinks()).length,
      queryCacheSize: this.queryModule.getCacheSize(),
      mainCacheSize: this.cacheModule.cache.size,
      mainCachePolicy: this.cacheModule.policy,
      clusterNodes: this.clusterManager.nodes.size,
      monitoringStatus: this.monitoringModule.intervalId
        ? 'active'
        : 'inactive',
      databasePath: this.databasePath,
      isInitialized: this.isInitialized
    };
  }
}

module.exports = K9DB;
