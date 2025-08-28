class ClusterManager {
  constructor(config) {
    this.config = config;
    this.nodes = new Map();
    this.shardMap = new Map();
  }

  addNode(nodeId, nodeAddress) {
    this.nodes.set(nodeId, { address: nodeAddress, isHealthy: true });
  }

  removeNode(nodeId) {
    this.nodes.delete(nodeId);
  }

  getShard(key) {
    const shardId = this.calculateShardId(key);
    return this.shardMap.get(shardId);
  }

  calculateShardId(key) {
    const hash = key
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `shard-${hash % this.config.shardCount}`;
  }

  handleReplication(data) {}

  initiateFailover(nodeId) {}
}

module.exports = ClusterManager;
