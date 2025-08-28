![Banner](https://www.upload.ee/image/18526544/k9crypt-database-banner-2.png)

[Almanca Dokümantasyon](../de/README.md) ・ [Rusça Dokümantasyon](../ru/README.md) ・ [İngilizce Dokümantasyon](../../README.md)

# K9DB

**K9DB**, profesyonel kullanım için geliştirilmiş, uçtan uca şifreleme desteğine sahip yüksek güvenlikli bir veritabanı sistemidir. Kurumsal düzeyde güvenlik ve ölçeklenebilirlik için tasarlanmıştır. Tamamen modüler bir mimariye sahip olan K9DB, doğrulama, sorgulama, yedekleme, veri ilişkileri ve sorgu oluşturma gibi tüm temel ve gelişmiş işlevlerin ayrı modüller üzerinden yönetilmesini sağlar. K9DB, verilerinizi hem disk üzerinde hem de bellek içi işlemlerde güçlü şifreleme algoritmalarıyla korur ve gizli anahtar yönetimi sunar. Şema tabanlı veri doğrulama, gelişmiş sorgu operatörleri, doğal dilde arama, tam metin ve bulanık arama gibi modern özelliklerle birlikte gelir. Ayrıca, yedekleme ve geri yükleme işlemleri, veri ilişkileri (bağlantı sistemi), sorgu önbelleği ve performans optimizasyonları sayesinde büyük ölçekli uygulamalar için ideal bir altyapı sunar. K9DB, hem basit anahtar-değer depolama hem de karmaşık veri modelleme için esnek ve güvenli bir çözüm sağlar.

## Özellikler

### Güvenlik

- **K9Crypt** ile tam şifreleme
- Güvenli veri depolama
- Gizli anahtar yönetimi

### Modüler Mimari

- **Doğrulama Modülü**: Şema ve özel doğrulama işlemleri
- **Sorgu Modülü**: Gelişmiş sorgu sistemi
- **Yedekleme Modülü**: Yedekleme ve geri yükleme işlemleri
- **Bağlantı Modülü**: Veri ilişkisi yönetimi
- **QueryBuilder**: Akıcı API ile sorgu oluşturma

### Performans

- Sorgu önbellekleme sistemi
- Optimize edilmiş veri yapıları
- Lazy loading (tembel yükleme) desteği

### Gelişmiş Sorgulama

- Güçlü sorgu operatörleri
- Doğal dilde sorgu desteği
- Tam metin arama
- Bulanık eşleşme
- İç içe yol sorgulama

### Ölçeklenebilirlik ve Yüksek Erişilebilirlik

- **Küme Yönetimi**: Parçalama (sharding) ve çoğaltma (replication) için altyapı.
- **Gelişmiş Önbellekleme**: Yapılandırılabilir bellek içi önbellek (örn. LRU).
- **Sağlık İzleme**: Küme düğümleri için otomatik sağlık kontrolleri.

## Kurulum

```bash
npm install k9db
```

## Hızlı Başlangıç

```javascript
const K9DB = require('k9db');

// Veritabanı oluştur
const db = new K9DB({
  path: './data/myapp.db',
  secretKey: 'your-secret-key-here'
});

// Başlat
await db.init();

// Veri ekle
await db.set('user1', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 25
});

// Veri oku
const user = db.get('user1');
console.log(user);

// Gelişmiş sorgu
const youngUsers = db.query({
  age: { $lt: 30 }
});
```

## Modüler Mimari

### Modül Açıklamaları

#### ValidationModule (Doğrulama Modülü)

Şema tanımlama ve veri doğrulama işlemleri.

```javascript
// Şema tanımla
db.setSchema('user', {
  name: { type: 'string', required: true, min: 2 },
  email: { type: 'string', pattern: /\S+@\S+\.\S+/ },
  age: { type: 'number', min: 0, max: 150 }
});

// Özel doğrulayıcı ekle
db.addValidator('emailValidator', (value) => {
  return value.includes('@') && value.includes('.');
});
```

#### QueryModule (Sorgu Modülü)

Gelişmiş sorgulama ve arama işlemleri.

```javascript
// Karmaşık sorgular
const results = db.query({
  $and: [{ age: { $gte: 18 } }, { status: { $in: ['active', 'pending'] } }]
});

// Metin arama
const found = db.search('admin', {
  caseSensitive: false,
  limit: 10
});
```

#### LinkModule

Veriler arasında ilişki kurma ve yönetme işlemlerini sağlar.

```javascript
// Bağlantı oluştur
await db.link('user1', 'profile1');

// Bağlantılı verileri getir
const linkedData = db.getLinks('user1');

// Bağlantı kontrolü
const isLinked = db.isLinked('user1', 'profile1');
```

#### BackupModule

Veritabanı yedekleme ve geri yükleme işlemlerini gerçekleştirir.

```javascript
// Yedek oluştur
const backupPath = await db.backup('./backups/backup1.db', {
  includeMetadata: true
});

// Geri yükleme
await db.restore('./backups/backup1.db');

// Yedekleri listele
const backups = db.listBackups('./backups/');
```

#### ClusterManager

Dağıtık ortamda düğüm yönetimi, parçalama (sharding) ve çoğaltma (replication) işlemlerini yönetir.

#### CacheModule

Sık erişilen veriler için gelişmiş, politika tabanlı bellek içi önbellek (örn. LRU) sağlar.

#### MonitoringModule

Küme düğümlerinin sağlık kontrollerini gerçekleştirir ve performans metriklerini toplar.

## API Dokümantasyonu

### Temel İşlemler

#### `new K9DB(config)`

Yeni bir veritabanı örneği oluşturur.

```javascript
const db = new K9DB({
  path: './data/app.db', // Veritabanı dosya yolu
  secretKey: 'your-secret-key-here' // Şifreleme anahtarı
});
```

#### `await db.init()`

Veritabanını başlatır ve mevcut verileri yükler.

#### `await db.set(key, value)`

Bir anahtar-değer çifti kaydeder.

#### `db.get(key)`

Anahtara göre değeri getirir.

#### `await db.delete(key)`

Belirtilen anahtarı ve değerini siler.

#### `db.exists(key)`

Anahtarın var olup olmadığını kontrol eder.

### Şema İşlemleri

#### `db.setSchema(key, schema)`

Bir anahtar için şema tanımlar.

```javascript
db.setSchema('product', {
  name: { type: 'string', required: true },
  price: { type: 'number', min: 0 },
  tags: { type: 'array' },
  metadata: { type: 'object' }
});
```

#### Şema Özellikleri

- `type`: 'string', 'number', 'boolean', 'array', 'object', 'date'
- `required`: Zorunlu alan kontrolü
- `min`: Minimum değer/uzunluk
- `max`: Maksimum değer/uzunluk
- `pattern`: Regex desen kontrolü
- `default`: Varsayılan değer
- `validator`: Özel doğrulayıcı adı

### Sorgu İşlemleri

#### Gelişmiş Sorgu Operatörleri

```javascript
// Karşılaştırma
{
  field: {
    $eq: value;
  }
} // Eşit
{
  field: {
    $ne: value;
  }
} // Eşit değil
{
  field: {
    $gt: value;
  }
} // Büyük
{
  field: {
    $gte: value;
  }
} // Büyük veya eşit
{
  field: {
    $lt: value;
  }
} // Küçük
{
  field: {
    $lte: value;
  }
} // Küçük veya eşit

// Dizi operatörleri
{
  field: {
    $in: [val1, val2];
  }
} // İçinde
{
  field: {
    $nin: [val1, val2];
  }
} // İçinde değil
{
  field: {
    $all: [val1, val2];
  }
} // Tümünü içeriyor

// Metin operatörleri
{
  field: {
    $contains: 'text';
  }
} // İçeriyor
{
  field: {
    $startsWith: 'pre';
  }
} // İle başlıyor
{
  field: {
    $endsWith: 'suf';
  }
} // İle bitiyor
{
  field: {
    $regex: /pattern/;
  }
} // Regex ile eşleşme

// Mantıksal operatörler
{
  $and: [cond1, cond2];
} // Ve
{
  $or: [cond1, cond2];
} // Veya
{
  $not: condition;
} // Değil
{
  $nor: [cond1, cond2];
} // Hiçbiri

// Özel operatörler
{
  field: {
    $exists: true;
  }
} // Alan var mı
{
  field: {
    $type: 'string';
  }
} // Tür kontrolü
{
  field: {
    $size: 5;
  }
} // Uzunluk kontrolü
{
  field: {
    $fuzzy: 'text';
  }
} // Bulanık metin
```

### QueryBuilder Kullanımı

```javascript
const results = db
  .queryBuilder()
  .where('age', '>', 18)
  .where('status', 'active')
  .sort('name', 1)
  .limit(10)
  .execute();

// Akıcı API ile karmaşık sorgular
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

## Gelişmiş Kullanım

### Doğal Dil Sorguları

```javascript
// Doğal dil ile sorgu
const results = db.naturalQuery('age greater than 25');
const products = db.naturalQuery('price between 100 and 500');
const users = db.naturalQuery('name contains "admin"');
```

### Yedekleme ve Geri Yükleme

```javascript
// Otomatik yedekleme
const backupPath = await db.backup();

// Metadata ile yedekleme
await db.backup('./manual-backup.db', {
  includeMetadata: true
});

// Yedekleri temizle
const cleaned = db.cleanupBackups({
  maxAge: 30, // 30 günden eski olanlar
  maxCount: 10, // Maksimum 10 yedek
  directory: './backups/'
});

// Yedek doğrulama
const validation = db.validateBackup('./backup.db');
if (validation.valid) {
  await db.restore('./backup.db');
}
```

### Bağlantı Sistemi

```javascript
// Karmaşık ilişkiler
await db.set('user1', { name: 'John' });
await db.set('post1', { title: 'First Post' });
await db.set('comment1', { text: 'Nice post!' });

// İlişki kur
await db.link('user1', 'post1');
await db.link('post1', 'comment1');

// Zincirleme silme
await db.deleteWithLinks('user1'); // Tüm bağlı veriler silinir

// Bağlantı bütünlüğü kontrolü
const integrity = db.validateLinkIntegrity();
if (integrity.length > 0) {
  db.repairLinkIntegrity();
}
```

### Ölçeklenebilirlik ve Küme Yapılandırması

K9DB, yatay ölçeklenebilirlik, önbellekleme ve izleme için temel desteği içerir. Bu özellikleri veritabanı başlatılırken yapılandırabilirsiniz.

```javascript
const K9DB = require('k9db');

const db = new K9DB({
  path: './data/clustered-app.db',
  secretKey: 'your-secret-key-here',

  // Önbellek yapılandırması
  cache: {
    policy: 'lru', // En Son Kullanılan
    maxSize: 1000 // Önbellekteki maksimum öğe sayısı
  },

  // İzleme yapılandırması
  monitoring: {
    enabled: true,
    interval: 5000 // Düğüm sağlığını her 5 saniyede bir kontrol et
  },

  // Küme yapılandırması
  cluster: {
    shardCount: 4 // Veri dağıtımı için parça sayısı
  }
});

await db.init();

// Gelişmiş işlemler için modüllere doğrudan erişebilirsiniz
// (Not: Doğrudan erişim dikkatli kullanılmalıdır)
db.clusterManager.addNode('node-1', '192.168.1.100');
db.clusterManager.addNode('node-2', '192.168.1.101');

// Önbelleği kullan
db.cacheModule.set('my-special-key', { value: 'super-fast-access' });
const cachedItem = db.cacheModule.get('my-special-key');
console.log('Önbellekten getirildi:', cachedItem);

// Yeni modüllerin çalıştığını görmek için sistem istatistiklerini kontrol edin
// İzleme modülünün çalışması için kısa bir süre bekleyin
setTimeout(() => {
  const stats = db.getStats();
  console.log(stats);
  /*
  Çıktı örneği:
  {
    totalKeys: 0,
    // ... diğer istatistikler
    mainCacheSize: 1,
    mainCachePolicy: 'lru',
    clusterNodes: 2,
    monitoringStatus: 'active',
    // ... diğer istatistikler
  }
  */
}, 6000);
```

## Lisans

MIT Lisansı - Detaylar için [LICENSE](LICENSE) dosyasına bakınız.

## Katkı Sağlama

1. Depoyu çatallayın (fork)
2. Bir özellik dalı oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit'leyin (`git commit -m 'Add amazing feature'`)
4. Dalınızı gönderin (`git push origin feature/amazing-feature`)
5. Bir Pull Request oluşturun

## Destek

Sorularınız için lütfen [Issues](https://github.com/K9Crypt/k9db/issues) bölümünü kullanın.
