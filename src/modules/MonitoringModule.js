class MonitoringModule {
  constructor(clusterManager) {
    this.clusterManager = clusterManager;
    this.intervalId = null;
  }

  collectMetrics() {
    const nodes = this.clusterManager.nodes;
    const metrics = [];
    for (const [nodeId, nodeInfo] of nodes.entries()) {
      metrics.push({
        nodeId,
        isHealthy: nodeInfo.isHealthy,
        cpuUsage: Math.random(),
        memoryUsage: Math.random() * 1000
      });
    }
    return metrics;
  }

  checkNodeHealth() {
    for (const [nodeId, nodeInfo] of this.clusterManager.nodes.entries()) {
      const isHealthy = Math.random() > 0.1;
      this.clusterManager.nodes.get(nodeId).isHealthy = isHealthy;
    }
  }

  startMonitoring(interval = 5000) {
    this.intervalId = setInterval(() => {
      this.checkNodeHealth();
    }, interval);
  }
}

module.exports = MonitoringModule;
