const mysql = require('mysql2/promise');
const config = require('../config');

const pool = mysql.createPool(config.database);

class Database {
  static async query(sql, params = []) {
    const connection = await pool.getConnection();
    try {
      const [rows, fields] = await connection.execute(sql, params);
      return rows;
    } finally {
      connection.release();
    }
  }

  static async getOne(sql, params = []) {
    const rows = await this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  static async insert(table, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    const result = await this.query(sql, values);
    return result.insertId;
  }

  static async update(table, data, where, whereParams = []) {
    const sets = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), ...whereParams];
    const sql = `UPDATE ${table} SET ${sets} WHERE ${where}`;
    const result = await this.query(sql, values);
    return result.affectedRows;
  }

  static async delete(table, where, whereParams = []) {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const result = await this.query(sql, whereParams);
    return result.affectedRows;
  }

  static async transaction(callback) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = Database;
