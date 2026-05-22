import { poolPromise, mssql } from '../config/db.js';

// Log user operations (updates, inserts, deletes, etc.) to SQL Server AuditLogs table
export const logOperation = async (username, operation, objectName, objectType) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Username', mssql.VarChar(255), username || 'System')
      .input('Operation', mssql.VarChar(255), operation)
      .input('ObjectName', mssql.VarChar(255), objectName)
      .input('ObjectType', mssql.VarChar(255), objectType)
      .query(`
        INSERT INTO AuditLogs (Username, Operation, ObjectName, ObjectType, OperationDate)
        VALUES (@Username, @Operation, @ObjectName, @ObjectType, GETDATE())
      `);
    console.log(`AuditLog created: User [${username}] performed [${operation}] on [${objectName}] (${objectType})`);
  } catch (err) {
    console.error('Failed to write to AuditLogs table:', err.message);
  }
};

// Log user logins to SQL Server LoginAudit table
export const logLogin = async (username) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('Username', mssql.VarChar(255), username)
      .query(`
        INSERT INTO LoginAudit (Username, LoginTime)
        VALUES (@Username, GETDATE())
      `);
    console.log(`LoginAudit created: User [${username}] logged in`);
  } catch (err) {
    console.error('Failed to write to LoginAudit table:', err.message);
  }
};
