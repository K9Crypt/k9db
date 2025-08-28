![Баннер](https://www.upload.ee/image/18526544/k9crypt-database-banner-2.png)

[Турецкая документация](../tr/README.md) ・ [Немецкая документация](../de/README.md) ・ [Английская документация](../../README.md)

# K9DB

**K9DB** — это высокозащищенная система баз данных, разработанная для профессионального использования с поддержкой сквозного шифрования. Разработана для обеспечения безопасности и масштабируемости корпоративного уровня. Она имеет полностью модульную архитектуру, позволяющую управлять всеми основными и расширенными функциями, такими как проверка, запросы, резервное копирование, связи данных и построение запросов, через отдельные модули. K9DB защищает ваши данные как на диске, так и в оперативной памяти с помощью надежных алгоритмов шифрования и обеспечивает управление секретными ключами. Она поставляется с современными функциями, такими как проверка данных на основе схемы, расширенные операторы запросов, поиск на естественном языке, полнотекстовый и нечеткий поиск. Кроме того, операции резервного копирования и восстановления, связи данных (система ссылок), кэш запросов и оптимизация производительности делают ее идеальной инфраструктурой для крупномасштабных приложений. K9DB предлагает гибкое и безопасное решение как для простого хранения пар «ключ-значение», так и для сложного моделирования данных.

## Функции

### Безопасность

- Полное шифрование с помощью **K9Crypt**
- Безопасное хранение данных
- Управление секретными ключами

### Модульная архитектура

- **Модуль проверки**: Проверка по схеме и пользовательская проверка
- **Модуль запросов**: Расширенная система запросов
- **Модуль резервного копирования**: Резервное копирование и восстановление
- **Модуль связей**: Управление связями данных
- **QueryBuilder**: Fluent API для построения запросов

### Производительность

- Система кэширования запросов
- Оптимизированные структуры данных
- Поддержка отложенной загрузки

### Расширенные запросы

- Мощные операторы запросов
- Поддержка запросов на естественном языке
- Полнотекстовый поиск
- Нечеткое сопоставление
- Запросы по вложенным путям

### Масштабируемость и высокая доступность

- **Управление кластером**: Основа для шардинга и репликации.
- **Расширенное кэширование**: Настраиваемый кэш в памяти (например, LRU).
- **Мониторинг состояния**: Автоматические проверки состояния узлов кластера.

## Установка

```bash
npm install k9db
```

## Быстрый старт

```javascript
const K9DB = require('k9db');

// Создать базу данных
const db = new K9DB({
  path: './data/myapp.db',
  secretKey: 'ваш-секретный-ключ-здесь'
});

// Инициализировать
await db.init();

// Добавить данные
await db.set('user1', {
  name: 'John Doe',
  email: 'john@example.com',
  age: 25
});

// Прочитать данные
const user = db.get('user1');
console.log(user);

// Расширенный запрос
const youngUsers = db.query({
  age: { $lt: 30 }
});
```

## Модульная архитектура

### Описание модулей

#### Модуль проверки

Определение схемы и операции по проверке данных.

```javascript
// Определить схему
db.setSchema('user', {
  name: { type: 'string', required: true, min: 2 },
  email: { type: 'string', pattern: /\S+@\S+\.\S+/ },
  age: { type: 'number', min: 0, max: 150 }
});

// Добавить пользовательский валидатор
db.addValidator('emailValidator', (value) => {
  return value.includes('@') && value.includes('.');
});
```

#### Модуль запросов

Расширенные операции запросов и поиска.

```javascript
// Сложные запросы
const results = db.query({
  $and: [{ age: { $gte: 18 } }, { status: { $in: ['active', 'pending'] } }]
});

// Поиск по тексту
const found = db.search('admin', {
  caseSensitive: false,
  limit: 10
});
```

#### Модуль связей

Установление и управление связями между данными.

```javascript
// Создать связь
await db.link('user1', 'profile1');

// Получить связанные данные
const linkedData = db.getLinks('user1');

// Проверить связь
const isLinked = db.isLinked('user1', 'profile1');
```

#### Модуль резервного копирования

Операции резервного копирования и восстановления базы данных.

```javascript
// Создать резервную копию
const backupPath = await db.backup('./backups/backup1.db', {
  includeMetadata: true
});

// Восстановить
await db.restore('./backups/backup1.db');

// Список резервных копий
const backups = db.listBackups('./backups/');
```

#### ClusterManager

Управляет узлами, шардингом и репликацией в распределенной среде.

#### Модуль кэширования

Предоставляет расширенный, основанный на политиках кэш в памяти (например, LRU) для часто используемых данных.

#### Модуль мониторинга

Выполняет проверки состояния узлов кластера и собирает метрики производительности.

## Документация по API

### Основные операции

#### `new K9DB(config)`

Создает новый экземпляр базы данных.

```javascript
const db = new K9DB({
  path: './data/app.db', // Путь к файлу базы данных
  secretKey: 'ваш-секретный-ключ-здесь' // Ключ шифрования
});
```

#### `await db.init()`

Инициализирует базу данных и загружает существующие данные.

#### `await db.set(key, value)`

Сохраняет пару «ключ-значение».

#### `db.get(key)`

Извлекает значение по ключу.

#### `await db.delete(key)`

Удаляет ключ и его значение.

#### `db.exists(key)`

Проверяет, существует ли ключ.

### Операции со схемой

#### `db.setSchema(key, schema)`

Определяет схему для ключа.

```javascript
db.setSchema('product', {
  name: { type: 'string', required: true },
  price: { type: 'number', min: 0 },
  tags: { type: 'array' },
  metadata: { type: 'object' }
});
```

#### Свойства схемы

- `type`: 'string', 'number', 'boolean', 'array', 'object', 'date'
- `required`: Проверка на обязательное поле
- `min`: Минимальное значение/длина
- `max`: Максимальное значение/длина
- `pattern`: Проверка по шаблону Regex
- `default`: Значение по умолчанию
- `validator`: Имя пользовательского валидатора

### Операции запросов

#### Расширенные операторы запросов

```javascript
// Сравнение
{
  field: {
    $eq: value;
  }
} // Равно
{
  field: {
    $ne: value;
  }
} // Не равно
{
  field: {
    $gt: value;
  }
} // Больше чем
{
  field: {
    $gte: value;
  }
} // Больше или равно
{
  field: {
    $lt: value;
  }
} // Меньше чем
{
  field: {
    $lte: value;
  }
} // Меньше или равно

// Операторы для массивов
{
  field: {
    $in: [val1, val2];
  }
} // В
{
  field: {
    $nin: [val1, val2];
  }
} // Не в
{
  field: {
    $all: [val1, val2];
  }
} // Содержит все

// Строковые операторы
{
  field: {
    $contains: 'text';
  }
} // Содержит
{
  field: {
    $startsWith: 'pre';
  }
} // Начинается с
{
  field: {
    $endsWith: 'suf';
  }
} // Заканчивается на
{
  field: {
    $regex: /pattern/;
  }
} // Соответствие Regex

// Логические операторы
{
  $and: [cond1, cond2];
} // И
{
  $or: [cond1, cond2];
} // Или
{
  $not: condition;
} // Не
{
  $nor: [cond1, cond2];
} // Ни

// Специальные операторы
{
  field: {
    $exists: true;
  }
} // Поле существует
{
  field: {
    $type: 'string';
  }
} // Проверка типа
{
  field: {
    $size: 5;
  }
} // Проверка длины
{
  field: {
    $fuzzy: 'text';
  }
} // Нечеткий текст
```

### Использование QueryBuilder

```javascript
const results = db
  .queryBuilder()
  .where('age', '>', 18)
  .where('status', 'active')
  .sort('name', 1)
  .limit(10)
  .execute();

// Сложные запросы с помощью Fluent API
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

## Расширенное использование

### Запросы на естественном языке

```javascript
// Запрос на естественном языке
const results = db.naturalQuery('age greater than 25');
const products = db.naturalQuery('price between 100 and 500');
const users = db.naturalQuery('name contains "admin"');
```

### Резервное копирование и восстановление

```javascript
// Автоматическое резервное копирование
const backupPath = await db.backup();

// Резервное копирование с метаданными
await db.backup('./manual-backup.db', {
  includeMetadata: true
});

// Очистка резервных копий
const cleaned = db.cleanupBackups({
  maxAge: 30, // Старше 30 дней
  maxCount: 10, // Максимум 10 резервных копий
  directory: './backups/'
});

// Проверка резервной копии
const validation = db.validateBackup('./backup.db');
if (validation.valid) {
  await db.restore('./backup.db');
}
```

### Система связей

```javascript
// Сложные связи
await db.set('user1', { name: 'John' });
await db.set('post1', { title: 'First Post' });
await db.set('comment1', { text: 'Nice post!' });

// Установить связи
await db.link('user1', 'post1');
await db.link('post1', 'comment1');

// Каскадное удаление
await db.deleteWithLinks('user1'); // Все связанные данные будут удалены

// Проверка целостности связей
const integrity = db.validateLinkIntegrity();
if (integrity.length > 0) {
  db.repairLinkIntegrity();
}
```

### Масштабируемость и конфигурация кластера

K9DB включает базовую поддержку горизонтального масштабирования, кэширования и мониторинга. Вы можете настроить эти функции при инициализации базы данных.

```javascript
const K9DB = require('k9db');

const db = new K9DB({
  path: './data/clustered-app.db',
  secretKey: 'ваш-секретный-ключ-здесь',

  // Конфигурация кэша
  cache: {
    policy: 'lru', // Least Recently Used
    maxSize: 1000 // Максимальное количество элементов в кэше
  },

  // Конфигурация мониторинга
  monitoring: {
    enabled: true,
    interval: 5000 // Проверять состояние узла каждые 5 секунд
  },

  // Конфигурация кластера
  cluster: {
    shardCount: 4 // Количество шардов для распределения данных
  }
});

await db.init();

// Вы можете напрямую обращаться к модулям для расширенных операций
// (Примечание: прямой доступ следует использовать с осторожностью)
db.clusterManager.addNode('node-1', '192.168.1.100');
db.clusterManager.addNode('node-2', '192.168.1.101');

// Использовать кэш
db.cacheModule.set('my-special-key', { value: 'super-fast-access' });
const cachedItem = db.cacheModule.get('my-special-key');
console.log('Извлечено из кэша:', cachedItem);

// Проверьте системную статистику, чтобы увидеть новые модули в действии
// Используйте тайм-аут, чтобы модуль мониторинга успел запуститься
setTimeout(() => {
  const stats = db.getStats();
  console.log(stats);
  /*
  Вывод может выглядеть так:
  {
    totalKeys: 0,
    // ... другие статистики
    mainCacheSize: 1,
    mainCachePolicy: 'lru',
    clusterNodes: 2,
    monitoringStatus: 'active',
    // ... другие статистики
  }
  */
}, 6000);
```

## Лицензия

Лицензия MIT - подробности см. в файле [LICENSE](LICENSE).

## Участие в проекте

1.  Сделайте форк репозитория
2.  Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3.  Закоммитьте свои изменения (`git commit -m 'Add amazing feature'`)
4.  Отправьте в свою ветку (`git push origin feature/amazing-feature`)
5.  Создайте Pull Request

## Поддержка

По вопросам обращайтесь в раздел [Issues](https://github.com/K9Crypt/k9db/issues).
