class LoadBalancer {
  constructor(clusterManager) {
    this.clusterManager = clusterManager;
    this.policy = 'round-robin';
    this.lastNodeIndex = 0;
  }

  getNextNode() {
    const nodes = Array.from(this.clusterManager.nodes.values()).filter(
      (node) => node.isHealthy
    );
    if (nodes.length === 0) {
      throw new Error('No healthy nodes available.');
    }

    if (this.policy === 'round-robin') {
      this.lastNodeIndex = (this.lastNodeIndex + 1) % nodes.length;
      return nodes[this.lastNodeIndex];
    }

    return nodes[0];
  }

  routeRequest(request) {
    const node = this.getNextNode();
    return { routedTo: node.address };
  }
}

module.exports = LoadBalancer;
