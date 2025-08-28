![Banner](https://www.upload.ee/image/18526544/k9crypt-database-banner-2.png)

[Turkish Documentation](locales/tr/README.md) ・ [German Documentation](locales/de/README.md) ・ [Russian Documentation](locales/ru/README.md)

# K9DB

**K9DB** is a high-security database system developed for professional use, featuring end-to-end encryption support. Designed for enterprise-grade security and scalability. It is designed with a fully modular architecture, allowing all core and advanced functions such as validation, querying, backup, data relationships, and query building to be managed through separate modules. K9DB protects your data both on disk and in-memory operations with strong encryption algorithms and provides secret key management. It comes with modern features like schema-based data validation, advanced query operators, natural language search, full-text and fuzzy search. Additionally, backup and restore operations, data relationships (link system), query cache, and performance optimizations make it an ideal infrastructure for large-scale applications. K9DB offers a flexible and secure solution for both simple key-value storage and complex data modeling.

## Features

### Security

- Full encryption with **K9Crypt**
- Secure data storage
- Secret key management

### Modular Architecture

- **Validation Module**: Schema and custom validation
- **Query Module**: Advanced query system
- **Backup Module**: Backup and restore
- **Link Module**: Data relationship management
- **QueryBuilder**: Fluent API for query building

### Performance

- Query caching system
- Optimized data structures
- Lazy loading support

### Advanced Querying

- Powerful query operators
- Natural language query support
- Full-text search
- Fuzzy matching
- Nested path querying

### Scalability and High Availability

- **Cluster Management**: Foundation for sharding and replication.
- **Advanced Caching**: Configurable in-memory caching (e.g., LRU).
- **Health Monitoring**: Automatic health checks for cluster nodes.

## Installation

```bash
npm install k9db
```

## Quick Start

```javascript
const K9DB = require('k9db');

// Create database
const db = new K9DB({
  path: './data/myapp.db',
  secretKey: 'your-secret-key-here'
});

// Initialize
await db.init();

// Add data
await db.set('user1', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 25
});

// Read data
const user = db.get('user1');
console.log(user);

// Advanced query
const youngUsers = db.query({
  age: { $lt: 30 }
});
```

## Modular Architecture

### Module Descriptions

#### ValidationModule

Schema definition and data validation operations.

```javascript
// Define schema
db.setSchema('user', {
  name: { type: 'string', required: true, min: 2 },
  email: { type: 'string', pattern: /\S+@\S+\.\S+/ },
  age: { type: 'number', min: 0, max: 150 }
});

// Add custom validator
db.addValidator('emailValidator', (value) => {
  return value.includes('@') && value.includes('.');
});
```

#### QueryModule

Advanced querying and search operations.

```javascript
// Complex queries
const results = db.query({
  $and: [{ age: { $gte: 18 } }, { status: { $in: ['active', 'pending'] } }]
});

// Text search
const found = db.search('admin', {
  caseSensitive: false,
  limit: 10
});
```

#### LinkModule

Establishing and managing relationships between data.

```javascript
// Create link
await db.link('user1', 'profile1');

// Get linked data
const linkedData = db.getLinks('user1');

// Check link
const isLinked = db.isLinked('user1', 'profile1');
```

#### BackupModule

Database backup and restore operations.

```javascript
// Create backup
const backupPath = await db.backup('./backups/backup1.db', {
  includeMetadata: true
});

// Restore
await db.restore('./backups/backup1.db');

// List backups
const backups = db.listBackups('./backups/');
```

#### ClusterManager

Manages nodes, sharding, and replication in a distributed environment.

#### CacheModule

Provides an advanced, policy-based in-memory cache (e.g., LRU) for frequently accessed data.

#### MonitoringModule

Performs health checks on cluster nodes and collects performance metrics.

## API Documentation

### Basic Operations

#### `new K9DB(config)`

Creates a new database instance.

```javascript
const db = new K9DB({
  path: './data/app.db', // Database file path
  secretKey: 'your-secret-key-here' // Encryption key
});
```

#### `await db.init()`

Initializes the database and loads existing data.

#### `await db.set(key, value)`

Stores a key-value pair.

#### `db.get(key)`

Retrieves value by key.

#### `await db.delete(key)`

Deletes the key and its value.

#### `db.exists(key)`

Checks if the key exists.

### Schema Operations

#### `db.setSchema(key, schema)`

Defines a schema for the key.

```javascript
db.setSchema('product', {
  name: { type: 'string', required: true },
  price: { type: 'number', min: 0 },
  tags: { type: 'array' },
  metadata: { type: 'object' }
});
```

#### Schema Properties

- `type`: 'string', 'number', 'boolean', 'array', 'object', 'date'
- `required`: Required field check
- `min`: Minimum value/length
- `max`: Maximum value/length
- `pattern`: Regex pattern check
- `default`: Default value
- `validator`: Custom validator name

### Query Operations

#### Advanced Query Operators

```javascript
// Comparison
{
  field: {
    $eq: value;
  }
} // Equal
{
  field: {
    $ne: value;
  }
} // Not equal
{
  field: {
    $gt: value;
  }
} // Greater than
{
  field: {
    $gte: value;
  }
} // Greater than or equal
{
  field: {
    $lt: value;
  }
} // Less than
{
  field: {
    $lte: value;
  }
} // Less than or equal

// Array operators
{
  field: {
    $in: [val1, val2];
  }
} // In
{
  field: {
    $nin: [val1, val2];
  }
} // Not in
{
  field: {
    $all: [val1, val2];
  }
} // Contains all

// String operators
{
  field: {
    $contains: 'text';
  }
} // Contains
{
  field: {
    $startsWith: 'pre';
  }
} // Starts with
{
  field: {
    $endsWith: 'suf';
  }
} // Ends with
{
  field: {
    $regex: /pattern/;
  }
} // Regex match

// Logical operators
{
  $and: [cond1, cond2];
} // And
{
  $or: [cond1, cond2];
} // Or
{
  $not: condition;
} // Not
{
  $nor: [cond1, cond2];
} // Nor

// Special operators
{
  field: {
    $exists: true;
  }
} // Field exists
{
  field: {
    $type: 'string';
  }
} // Type check
{
  field: {
    $size: 5;
  }
} // Length check
{
  field: {
    $fuzzy: 'text';
  }
} // Fuzzy text
```

### QueryBuilder Usage

```javascript
const results = db
  .queryBuilder()
  .where('age', '>', 18)
  .where('status', 'active')
  .sort('name', 1)
  .limit(10)
  .execute();

// Complex queries with Fluent API
const complexQuery = db
  .queryBuilder()
  .where('category', 'electronics')
  .and({ price: { $lt: 1000 } }, { inStock: true })
  .or({ featured: true }, { onSale: true })
  .sort('price', -1)
  .project({ name: 1, price: 1, _key: 1 })
  .cache('electronics-under-1000')
  .execute();
```

## Advanced Usage

### Natural Language Queries

```javascript
// Query with natural language
const results = db.naturalQuery('age greater than 25');
const products = db.naturalQuery('price between 100 and 500');
const users = db.naturalQuery('name contains "admin"');
```

### Backup and Restore

```javascript
// Automatic backup
const backupPath = await db.backup();

// Backup with metadata
await db.backup('./manual-backup.db', {
  includeMetadata: true
});

// Cleanup backups
const cleaned = db.cleanupBackups({
  maxAge: 30, // Older than 30 days
  maxCount: 10, // Maximum 10 backups
  directory: './backups/'
});

// Backup validation
const validation = db.validateBackup('./backup.db');
if (validation.valid) {
  await db.restore('./backup.db');
}
```

### Link System

```javascript
// Complex relationships
await db.set('user1', { name: 'John' });
await db.set('post1', { title: 'First Post' });
await db.set('comment1', { text: 'Nice post!' });

// Establish relationships
await db.link('user1', 'post1');
await db.link('post1', 'comment1');

// Cascade delete
await db.deleteWithLinks('user1'); // All linked data will be deleted

// Link integrity check
const integrity = db.validateLinkIntegrity();
if (integrity.length > 0) {
  db.repairLinkIntegrity();
}
```

### Scalability and Cluster Configuration

K9DB includes foundational support for horizontal scaling, caching, and monitoring. You can configure these features during database initialization.

```javascript
const K9DB = require('k9db');

const db = new K9DB({
  path: './data/clustered-app.db',
  secretKey: 'your-secret-key-here',

  // Cache configuration
  cache: {
    policy: 'lru', // Least Recently Used
    maxSize: 1000 // Max number of items in cache
  },

  // Monitoring configuration
  monitoring: {
    enabled: true,
    interval: 5000 // Check node health every 5 seconds
  },

  // Cluster configuration
  cluster: {
    shardCount: 4 // Number of shards for data distribution
  }
});

await db.init();

// You can access the modules directly for advanced operations
// (Note: Direct access should be used with caution)
db.clusterManager.addNode('node-1', '192.168.1.100');
db.clusterManager.addNode('node-2', '192.168.1.101');

// Use the cache
db.cacheModule.set('my-special-key', { value: 'super-fast-access' });
const cachedItem = db.cacheModule.get('my-special-key');
console.log('Retrieved from cache:', cachedItem);

// Check system stats to see the new modules in action
// Use a timeout to allow the monitoring module to run
setTimeout(() => {
  const stats = db.getStats();
  console.log(stats);
  /*
  Output might look like:
  {
    totalKeys: 0,
    // ... other stats
    mainCacheSize: 1,
    mainCachePolicy: 'lru',
    clusterNodes: 2,
    monitoringStatus: 'active',
    // ... other stats
  }
  */
}, 6000);
```

## License

MIT License - See [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Create a Pull Request

## Support

For questions, please use the [Issues](https://github.com/K9Crypt/k9db/issues) section.
