import { config as envConfig } from 'dotenv';
envConfig();
import config from 'config';

// In this file you can configure migrate-mongo
const dbConfig = {
  mongodb: {
    // TODO Change (or review) the url to your MongoDB:
    url: config.get<string>('db.mongodb.uri'),

    // TODO Change this to your database name:
    // databaseName: "YOURDATABASENAME",

    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true, // removes a deprecating warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    },
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: 'src/db-migrations',

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: 'db-migrations',

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: '.ts',

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determin
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  moduleSystem: 'commonjs',
};

// Return the config as a promise
export = dbConfig;
