require('dotenv').config();

const config = {
  mongodb: {
    url: process.env.MONGO_URI,
    databaseName: process.env.DB_NAME || 'notenest',
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
