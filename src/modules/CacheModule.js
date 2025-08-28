class CacheModule {
  constructor(config) {
    this.cache = new Map();
    this.policy = config.policy || 'lru';
    this.maxSize = config.maxSize || 10000;
  }

  get(key) {
    const item = this.cache.get(key);
    if (item) {
      if (this.policy === 'lru') {
        this.cache.delete(key);
        this.cache.set(key, item);
      }
      if (item.ttl && item.ttl < Date.now()) {
        this.cache.delete(key);
        return null;
      }
      return item.value;
    }
    return null;
  }

  set(key, value, ttl) {
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    const item = { value, timestamp: Date.now() };
    if (ttl) {
      item.ttl = Date.now() + ttl;
    }

    this.cache.set(key, item);
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  evict() {
    if (this.policy === 'lru') {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    if (this.policy === 'lfu') {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }
}

module.exports = CacheModule;
