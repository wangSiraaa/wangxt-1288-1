require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT) || 3001,
  database: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'toilet_inspection',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
    charset: 'utf8mb4'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'toilet-inspection-secret-key-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  }
};

module.exports = config;
