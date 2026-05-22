import dbInstance from '../config/db.js';

class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.db = dbInstance;
  }

  async getAll() {
    const res = await this.db.query(`SELECT * FROM ${this.tableName}`);
    return res.recordset;
  }

  async getById(idColumn, idValue) {
    const res = await this.db.query(
      `SELECT * FROM ${this.tableName} WHERE ${idColumn} = @id`,
      { id: idValue }
    );
    return res.recordset[0] || null;
  }

  async count(condition = '', params = {}) {
    const whereClause = condition ? `WHERE ${condition}` : '';
    const res = await this.db.query(
      `SELECT COUNT(*) AS total FROM ${this.tableName} ${whereClause}`,
      params
    );
    return res.recordset[0].total;
  }
}

export default BaseRepository;
