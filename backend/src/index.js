const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a MariaDB
const db = mysql.createPool({
  host: process.env.DB_HOST || 'database',
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'app_password',
  database: process.env.DB_NAME || 'juego_educativo',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const MAESTRO_ID_TEST = 'a1111111-1111-1111-1111-111111111111';
const ALUMNO_ID_TEST  = 'b1111111-1111-1111-1111-111111111111';

// Healthcheck
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ status: 'ok', db_connection: true, result: rows[0].result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Grupos Maestro
app.get('/api/maestro/grupos', async (req, res) => {
  try {
    const [grupos] = await db.query(
      `SELECT g.*, COUNT(ga.alumno_id) AS total_alumnos 
       FROM grupos g 
       LEFT JOIN grupo_alumnos ga ON g.id = ga.grupo_id 
       WHERE g.maestro_id = ? 
       GROUP BY g.id`,
      [MAESTRO_ID_TEST]
    );
    res.json(grupos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear Grupo
app.post('/api/maestro/grupos', async (req, res) => {
  const { nombre, descripcion } = req.body;
  const codigo = 'BIO-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  try {
    await db.query(
      `INSERT INTO grupos (id, maestro_id, nombre, descripcion, codigo_invitacion) 
       VALUES (UUID(), ?, ?, ?, ?)`,
      [MAESTRO_ID_TEST, nombre, descripcion, codigo]
    );
    res.json({ message: 'Grupo creado exitosamente', codigo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Manejadores de proceso
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Express corriendo en http://0.0.0.0:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});