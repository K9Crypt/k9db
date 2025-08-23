const fs = require('fs');
const path = require('path');
const DatabaseUtils = require('../utils/DatabaseUtils');

class BackupModule {
  constructor(databasePath, encryptor) {
    this.databasePath = databasePath;
    this.encryptor = encryptor;
  }

  async backup(backupPath, options = {}) {
    try {
      if (!backupPath) {
        const timestamp = DatabaseUtils.generateTimestamp();
        backupPath = `${this.databasePath}.backup.${timestamp}`;
      }

      if (!fs.existsSync(this.databasePath)) {
        throw new Error('Database file not found');
      }

      DatabaseUtils.ensureDirectoryExists(backupPath);

      const sourceData = fs.readFileSync(this.databasePath);
      fs.writeFileSync(backupPath, sourceData);

      if (options.includeMetadata) {
        const metadata = this.createBackupMetadata();
        const metadataPath = `${backupPath}.meta`;
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
      }

      return backupPath;
    } catch (error) {
      throw new Error(`Backup error: ${error.message}`);
    }
  }

  async restore(backupPath, options = {}) {
    try {
      if (!backupPath) {
        throw new Error('Backup file path must be specified');
      }

      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }

      if (options.backupCurrent !== false && fs.existsSync(this.databasePath)) {
        const currentBackupPath = `${this.databasePath}.pre-restore.${Date.now()}`;
        await this.backup(currentBackupPath);
      }

      const backupData = fs.readFileSync(backupPath);
      DatabaseUtils.ensureDirectoryExists(this.databasePath);
      fs.writeFileSync(this.databasePath, backupData);

      const metadataPath = `${backupPath}.meta`;
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        console.log('Backup metadata:', metadata);
      }

      return true;
    } catch (error) {
      throw new Error(`Restore error: ${error.message}`);
    }
  }

  listBackups(directory = './') {
    try {
      if (!fs.existsSync(directory)) {
        return [];
      }

      const files = fs.readdirSync(directory);
      const backupFiles = files.filter(
        (file) => file.includes('.backup.') || file.includes('.pre-restore.')
      );

      const backupList = backupFiles.map((file) => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        const metadataPath = `${filePath}.meta`;

        let metadata = null;
        if (fs.existsSync(metadataPath)) {
          try {
            metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
          } catch (e) {
            metadata = null;
          }
        }

        return {
          filename: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          metadata: metadata
        };
      });

      return backupList.sort((a, b) => b.created - a.created);
    } catch (error) {
      throw new Error(`Could not retrieve backup list: ${error.message}`);
    }
  }

  cleanupBackups(options = {}) {
    try {
      const maxAge = options.maxAge || 30;
      const maxCount = options.maxCount || 10;
      const directory = options.directory || './';

      const backups = this.listBackups(directory);
      const now = new Date();
      let deletedCount = 0;

      if (options.maxAge) {
        const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;
        backups.forEach((backup) => {
          const age = now - backup.created;
          if (age > maxAgeMs) {
            try {
              fs.unlinkSync(backup.path);

              const metadataPath = `${backup.path}.meta`;
              if (fs.existsSync(metadataPath)) {
                fs.unlinkSync(metadataPath);
              }

              deletedCount++;
            } catch (e) {}
          }
        });
      }

      if (options.maxCount) {
        const remainingBackups = this.listBackups(directory);
        if (remainingBackups.length > maxCount) {
          const toDelete = remainingBackups.slice(maxCount);
          toDelete.forEach((backup) => {
            try {
              fs.unlinkSync(backup.path);

              const metadataPath = `${backup.path}.meta`;
              if (fs.existsSync(metadataPath)) {
                fs.unlinkSync(metadataPath);
              }

              deletedCount++;
            } catch (e) {}
          });
        }
      }

      return deletedCount;
    } catch (error) {
      throw new Error(`Backup cleanup error: ${error.message}`);
    }
  }

  createBackupMetadata() {
    return {
      backupDate: new Date().toISOString(),
      originalPath: this.databasePath,
      version: '1.0.0',
      type: 'full_backup'
    };
  }

  validateBackup(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        return { valid: false, error: 'Backup file not found' };
      }

      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        return { valid: false, error: 'Backup file is empty' };
      }

      const backupData = fs.readFileSync(backupPath, 'utf8');
      if (!backupData.trim()) {
        return { valid: false, error: 'Backup file contains no data' };
      }

      return { valid: true, size: stats.size };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  getBackupInfo(backupPath) {
    try {
      const validation = this.validateBackup(backupPath);
      if (!validation.valid) {
        return validation;
      }

      const stats = fs.statSync(backupPath);
      const metadataPath = `${backupPath}.meta`;
      let metadata = null;

      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        } catch (e) {
          metadata = null;
        }
      }

      return {
        valid: true,
        path: backupPath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        metadata: metadata
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

module.exports = BackupModule;
