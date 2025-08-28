![Banner](https://www.upload.ee/image/18526544/k9crypt-database-banner-2.png)

[Türkische Dokumentation](../tr/README.md) ・ [Russische Dokumentation](../ru/README.md) ・ [Englische Dokumentation](../../README.md)

# K9DB

**K9DB** ist ein Hochsicherheits-Datenbanksystem, das für den professionellen Einsatz entwickelt wurde und eine Ende-zu-Ende-Verschlüsselung unterstützt. Es wurde für unternehmenstaugliche Sicherheit und Skalierbarkeit konzipiert. Mit seiner vollständig modularen Architektur können alle Kern- und erweiterten Funktionen wie Validierung, Abfragen, Backups, Datenbeziehungen und Abfrageerstellung über separate Module verwaltet werden. K9DB schützt Ihre Daten sowohl auf der Festplatte als auch bei In-Memory-Operationen mit starken Verschlüsselungsalgorithmen und bietet eine Verwaltung für geheime Schlüssel. Es verfügt über moderne Funktionen wie schemabasierte Datenvalidierung, erweiterte Abfrageoperatoren, natürlichsprachliche Suche, Volltext- und Fuzzysuche. Darüber hinaus machen Backup- und Wiederherstellungsoperationen, Datenbeziehungen (Link-System), Abfrage-Cache und Leistungsoptimierungen es zu einer idealen Infrastruktur für große Anwendungen. K9DB bietet eine flexible und sichere Lösung sowohl für einfache Schlüssel-Wert-Speicher als auch für komplexe Datenmodellierung.

## Merkmale

### Sicherheit

- Vollständige Verschlüsselung mit **K9Crypt**
- Sichere Datenspeicherung
- Verwaltung geheimer Schlüssel

### Modulare Architektur

- **Validierungsmodul**: Schema- und benutzerdefinierte Validierung
- **Abfragemodul**: Erweitertes Abfragesystem
- **Backup-Modul**: Sicherung und Wiederherstellung
- **Link-Modul**: Verwaltung von Datenbeziehungen
- **QueryBuilder**: Fluent-API zur Abfrageerstellung

### Leistung

- Abfrage-Caching-System
- Optimierte Datenstrukturen
- Unterstützung für Lazy Loading

### Erweiterte Abfragen

- Leistungsstarke Abfrageoperatoren
- Unterstützung für natürlichsprachliche Abfragen
- Volltextsuche
- Fuzzy-Matching
- Abfragen verschachtelter Pfade

### Skalierbarkeit und Hochverfügbarkeit

- **Cluster-Management**: Grundlage für Sharding und Replikation.
- **Erweitertes Caching**: Konfigurierbarer In-Memory-Cache (z. B. LRU).
- **Zustandsüberwachung**: Automatische Zustandsprüfungen für Cluster-Knoten.

## Installation

```bash
npm install k9db
```

## Schnellstart

```javascript
const K9DB = require('k9db');

// Datenbank erstellen
const db = new K9DB({
  path: './data/myapp.db',
  secretKey: 'ihr-geheimer-schlüssel-hier'
});

// Initialisieren
await db.init();

// Daten hinzufügen
await db.set('user1', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 25
});

// Daten lesen
const user = db.get('user1');
console.log(user);

// Erweiterte Abfrage
const youngUsers = db.query({
  age: { $lt: 30 }
});
```

## Modulare Architektur

### Modulbeschreibungen

#### Validierungsmodul

Schemadefinition und Datenvalidierungsoperationen.

```javascript
// Schema definieren
db.setSchema('user', {
  name: { type: 'string', required: true, min: 2 },
  email: { type: 'string', pattern: /\S+@\S+\.\S+/ },
  age: { type: 'number', min: 0, max: 150 }
});

// Benutzerdefinierten Validator hinzufügen
db.addValidator('emailValidator', (value) => {
  return value.includes('@') && value.includes('.');
});
```

#### Abfragemodul

Erweiterte Abfrage- und Suchoperationen.

```javascript
// Komplexe Abfragen
const results = db.query({
  $and: [{ age: { $gte: 18 } }, { status: { $in: ['active', 'pending'] } }]
});

// Textsuche
const found = db.search('admin', {
  caseSensitive: false,
  limit: 10
});
```

#### Link-Modul

Herstellen und Verwalten von Beziehungen zwischen Daten.

```javascript
// Link erstellen
await db.link('user1', 'profile1');

// Verknüpfte Daten abrufen
const linkedData = db.getLinks('user1');

// Link überprüfen
const isLinked = db.isLinked('user1', 'profile1');
```

#### Backup-Modul

Datenbanksicherungs- und Wiederherstellungsoperationen.

```javascript
// Backup erstellen
const backupPath = await db.backup('./backups/backup1.db', {
  includeMetadata: true
});

// Wiederherstellen
await db.restore('./backups/backup1.db');

// Backups auflisten
const backups = db.listBackups('./backups/');
```

#### ClusterManager

Verwaltet Knoten, Sharding und Replikation in einer verteilten Umgebung.

#### Cache-Modul

Bietet einen erweiterten, richtlinienbasierten In-Memory-Cache (z. B. LRU) für häufig aufgerufene Daten.

#### Überwachungsmodul

Führt Zustandsprüfungen an Cluster-Knoten durch und sammelt Leistungsmetriken.

## API-Dokumentation

### Grundlegende Operationen

#### `new K9DB(config)`

Erstellt eine neue Datenbankinstanz.

```javascript
const db = new K9DB({
  path: './data/app.db', // Pfad zur Datenbankdatei
  secretKey: 'ihr-geheimer-schlüssel-hier' // Verschlüsselungsschlüssel
});
```

#### `await db.init()`

Initialisiert die Datenbank und lädt vorhandene Daten.

#### `await db.set(key, value)`

Speichert ein Schlüssel-Wert-Paar.

#### `db.get(key)`

Ruft den Wert nach Schlüssel ab.

#### `await db.delete(key)`

Löscht den Schlüssel und seinen Wert.

#### `db.exists(key)`

Überprüft, ob der Schlüssel existiert.

### Schema-Operationen

#### `db.setSchema(key, schema)`

Definiert ein Schema für den Schlüssel.

```javascript
db.setSchema('product', {
  name: { type: 'string', required: true },
  price: { type: 'number', min: 0 },
  tags: { type: 'array' },
  metadata: { type: 'object' }
});
```

#### Schema-Eigenschaften

- `type`: 'string', 'number', 'boolean', 'array', 'object', 'date'
- `required`: Prüfung auf erforderliches Feld
- `min`: Mindestwert/-länge
- `max`: Maximalwert/-länge
- `pattern`: Regex-Musterprüfung
- `default`: Standardwert
- `validator`: Name des benutzerdefinierten Validators

### Abfrageoperationen

#### Erweiterte Abfrageoperatoren

```javascript
// Vergleich
{
  field: {
    $eq: value;
  }
} // Gleich
{
  field: {
    $ne: value;
  }
} // Ungleich
{
  field: {
    $gt: value;
  }
} // Größer als
{
  field: {
    $gte: value;
  }
} // Größer als oder gleich
{
  field: {
    $lt: value;
  }
} // Kleiner als
{
  field: {
    $lte: value;
  }
} // Kleiner als oder gleich

// Array-Operatoren
{
  field: {
    $in: [val1, val2];
  }
} // In
{
  field: {
    $nin: [val1, val2];
  }
} // Nicht in
{
  field: {
    $all: [val1, val2];
  }
} // Enthält alle

// String-Operatoren
{
  field: {
    $contains: 'text';
  }
} // Enthält
{
  field: {
    $startsWith: 'pre';
  }
} // Beginnt mit
{
  field: {
    $endsWith: 'suf';
  }
} // Endet mit
{
  field: {
    $regex: /pattern/;
  }
} // Regex-Übereinstimmung

// Logische Operatoren
{
  $and: [cond1, cond2];
} // Und
{
  $or: [cond1, cond2];
} // Oder
{
  $not: condition;
} // Nicht
{
  $nor: [cond1, cond2];
} // Nor

// Spezielle Operatoren
{
  field: {
    $exists: true;
  }
} // Feld existiert
{
  field: {
    $type: 'string';
  }
} // Typprüfung
{
  field: {
    $size: 5;
  }
} // Längenprüfung
{
  field: {
    $fuzzy: 'text';
  }
} // Fuzzy-Text
```

### Verwendung des QueryBuilders

```javascript
const results = db
  .queryBuilder()
  .where('age', '>', 18)
  .where('status', 'active')
  .sort('name', 1)
  .limit(10)
  .execute();

// Komplexe Abfragen mit Fluent-API
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

## Erweiterte Nutzung

### Natürlichsprachliche Abfragen

```javascript
// Abfrage mit natürlicher Sprache
const results = db.naturalQuery('age greater than 25');
const products = db.naturalQuery('price between 100 and 500');
const users = db.naturalQuery('name contains "admin"');
```

### Sicherung und Wiederherstellung

```javascript
// Automatische Sicherung
const backupPath = await db.backup();

// Sicherung mit Metadaten
await db.backup('./manual-backup.db', {
  includeMetadata: true
});

// Backups bereinigen
const cleaned = db.cleanupBackups({
  maxAge: 30, // Älter als 30 Tage
  maxCount: 10, // Maximal 10 Backups
  directory: './backups/'
});

// Backup-Validierung
const validation = db.validateBackup('./backup.db');
if (validation.valid) {
  await db.restore('./backup.db');
}
```

### Link-System

```javascript
// Komplexe Beziehungen
await db.set('user1', { name: 'John' });
await db.set('post1', { title: 'First Post' });
await db.set('comment1', { text: 'Nice post!' });

// Beziehungen herstellen
await db.link('user1', 'post1');
await db.link('post1', 'comment1');

// Kaskadierendes Löschen
await db.deleteWithLinks('user1'); // Alle verknüpften Daten werden gelöscht

// Link-Integritätsprüfung
const integrity = db.validateLinkIntegrity();
if (integrity.length > 0) {
  db.repairLinkIntegrity();
}
```

### Skalierbarkeit und Cluster-Konfiguration

K9DB bietet grundlegende Unterstützung für horizontales Skalieren, Caching und Überwachung. Sie können diese Funktionen bei der Initialisierung der Datenbank konfigurieren.

```javascript
const K9DB = require('k9db');

const db = new K9DB({
  path: './data/clustered-app.db',
  secretKey: 'ihr-geheimer-schlüssel-hier',

  // Cache-Konfiguration
  cache: {
    policy: 'lru', // Least Recently Used
    maxSize: 1000 // Maximale Anzahl von Elementen im Cache
  },

  // Überwachungskonfiguration
  monitoring: {
    enabled: true,
    interval: 5000 // Alle 5 Sekunden den Zustand der Knoten überprüfen
  },

  // Cluster-Konfiguration
  cluster: {
    shardCount: 4 // Anzahl der Shards für die Datenverteilung
  }
});

await db.init();

// Sie können direkt auf die Module für erweiterte Operationen zugreifen
// (Hinweis: Direkter Zugriff sollte mit Vorsicht verwendet werden)
db.clusterManager.addNode('node-1', '192.168.1.100');
db.clusterManager.addNode('node-2', '192.168.1.101');

// Den Cache verwenden
db.cacheModule.set('my-special-key', { value: 'super-fast-access' });
const cachedItem = db.cacheModule.get('my-special-key');
console.log('Aus dem Cache abgerufen:', cachedItem);

// Systemstatistiken überprüfen, um die neuen Module in Aktion zu sehen
// Verwenden Sie ein Timeout, damit das Überwachungsmodul ausgeführt werden kann
setTimeout(() => {
  const stats = db.getStats();
  console.log(stats);
  /*
  Die Ausgabe könnte so aussehen:
  {
    totalKeys: 0,
    // ... andere Statistiken
    mainCacheSize: 1,
    mainCachePolicy: 'lru',
    clusterNodes: 2,
    monitoringStatus: 'active',
    // ... andere Statistiken
  }
  */
}, 6000);
```

## Lizenz

MIT-Lizenz - Weitere Informationen finden Sie in der [LICENSE](LICENSE)-Datei.

## Mitwirken

1.  Forken Sie das Repository
2.  Erstellen Sie einen Feature-Branch (`git checkout -b feature/amazing-feature`)
3.  Committen Sie Ihre Änderungen (`git commit -m 'Add amazing feature'`)
4.  Pushen Sie zu Ihrem Branch (`git push origin feature/amazing-feature`)
5.  Erstellen Sie einen Pull Request

## Unterstützung

Bei Fragen verwenden Sie bitte den [Issues](https://github.com/K9Crypt/k9db/issues)-Bereich.
