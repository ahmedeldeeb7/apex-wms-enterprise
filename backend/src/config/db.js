import mssql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'SmartWarehouseDB',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    trustedConnection: true,
    connectTimeout: 15000,
    requestTimeout: 30000
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000
  }
};

if (process.env.DB_USER && process.env.DB_PASSWORD) {
  dbConfig.user = process.env.DB_USER;
  dbConfig.password = process.env.DB_PASSWORD;
  dbConfig.options.trustedConnection = false;
  if (process.env.DB_PORT) {
    dbConfig.port = parseInt(process.env.DB_PORT, 10);
  }
}

class Database {
  constructor() {
    this.pool = null;
    this.connectionPromise = null;
  }

  async connect() {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      let attempts = 0;
      const maxAttempts = 5;
      const delay = 3000;

      while (attempts < maxAttempts) {
        try {
          console.log(`Connecting to SQL Server... Attempt ${attempts + 1}/${maxAttempts}`);
          const pool = await new mssql.ConnectionPool(dbConfig).connect();
          console.log('Successfully connected to Microsoft SQL Server pool.');
          
          pool.on('error', err => {
            console.error('SQL Connection Pool encountered error:', err);
            this.reconnect();
          });

          this.pool = pool;
          return pool;
        } catch (err) {
          attempts++;
          console.error(`Database connection attempt failed: ${err.message}`);
          if (attempts >= maxAttempts) {
            console.error('All connection attempts failed. Exiting process.');
            process.exit(1);
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    })();

    return this.connectionPromise;
  }

  async reconnect() {
    console.log('Re-initializing database pool connection...');
    this.pool = null;
    this.connectionPromise = null;
    return this.connect();
  }

  async getPool() {
    if (!this.pool) {
      await this.connect();
    }
    return this.pool;
  }

  // Parameterized Query Helper with retry support
  async query(queryString, params = {}, retries = 2) {
    let attempt = 0;
    while (attempt <= retries) {
      try {
        const pool = await this.getPool();
        const request = pool.request();
        
        // Dynamic binding
        for (const [key, val] of Object.entries(params)) {
          request.input(key, val);
        }

        return await request.query(queryString);
      } catch (err) {
        attempt++;
        console.error(`Query Execution failed (Attempt ${attempt}/${retries + 1}): ${err.message}`);
        
        // If connection is dead/broken, try to reconnect
        if (err.message.includes('connection') || err.message.includes('Connection')) {
          await this.reconnect();
        }

        if (attempt > retries) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // Structured Transaction block execution helper
  async executeTransaction(callback) {
    const pool = await this.getPool();
    const transaction = new mssql.Transaction(pool);
    try {
      await transaction.begin();
      console.log('Starting DB Transaction block...');
      
      const request = new mssql.Request(transaction);
      
      // Inject transaction context helpers
      const result = await callback(request, transaction);
      
      await transaction.commit();
      console.log('DB Transaction successfully committed.');
      return result;
    } catch (err) {
      console.error('DB Transaction failed! Triggering Rollback. Error: ', err.message);
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error('Failed to rollback transaction:', rollbackErr.message);
      }
      throw err;
    }
  }
}

const dbInstance = new Database();
dbInstance.connect();

// Maintain legacy compatibility
const poolPromise = dbInstance.connect();

export { mssql, dbInstance, poolPromise };
export default dbInstance;
