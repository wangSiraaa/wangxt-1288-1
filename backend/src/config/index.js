const config = {
  port: 3001,
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'toilet_inspection',
    connectionLimit: 10,
    charset: 'utf8mb4'
  },
  jwt: {
    secret: 'toilet-inspection-secret-key-2024',
    expiresIn: '24h'
  }
};

module.exports = config;
