import BaseRepository from './BaseRepository.js';

class UserRepository extends BaseRepository {
  constructor() {
    super('Users');
  }

  async findByUsername(username) {
    const query = `
      SELECT u.*, r.RoleName as role, d.DepartmentName as department
      FROM Users u
      LEFT JOIN Roles r ON u.RoleID = r.RoleID
      LEFT JOIN Departments d ON u.DepartmentID = d.DepartmentID
      WHERE u.Username = @username
    `;
    const res = await this.db.query(query, { username });
    return res.recordset[0] || null;
  }

  async createLoginAudit(username) {
    const query = `
      INSERT INTO LoginAudit (Username, LoginTime)
      VALUES (@username, GETDATE())
    `;
    await this.db.query(query, { username });
  }

  async logFailedAttempt(username, details = 'Invalid password credential block') {
    await this.logAudit(
      username,
      'Failed Login',
      username,
      'SecuritySession',
      details
    );
  }

  async logAudit(username, operation, objectName, objectType, details = '') {
    const operationDesc = details ? `${operation} - ${details}`.substring(0, 255) : operation;
    const query = `
      INSERT INTO AuditLogs (Username, Operation, ObjectName, ObjectType, OperationDate)
      VALUES (@username, @operation, @objectName, @objectType, GETDATE())
    `;
    await this.db.query(query, {
      username,
      operation: operationDesc,
      objectName: objectName.substring(0, 100),
      objectType: objectType.substring(0, 50)
    });
  }

  async updatePasswordHash(userID, passwordHash) {
    const query = `
      UPDATE Users
      SET PasswordHash = @passwordHash
      WHERE UserID = @userID
    `;
    await this.db.query(query, { userID, passwordHash });
  }

  async getRecentAudits(limit = 10) {
    const query = `
      SELECT TOP (@limit) * 
      FROM AuditLogs 
      ORDER BY OperationDate DESC
    `;
    const res = await this.db.query(query, { limit });
    return res.recordset;
  }

  async getRecentLogins(limit = 10) {
    const query = `
      SELECT TOP (@limit) * 
      FROM LoginAudit 
      ORDER BY LoginTime DESC
    `;
    const res = await this.db.query(query, { limit });
    return res.recordset;
  }
}

export default new UserRepository();
export { UserRepository };
