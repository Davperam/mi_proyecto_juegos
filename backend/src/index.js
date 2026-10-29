const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

// 1. Middlewares globales
app.use(cors()); // Permite peticiones desde Ionic en http://localhost:8100
app.use(express.json());

// 2. Pool de conexiones usando variables de entorno de Docker Compose
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

// ==========================================
// 3. RUTAS / ENDPOINTS DE LA API
// ==========================================

// Endpoint de prueba / Healthcheck
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ status: 'ok', db_connection: true, result: rows[0].result });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// GET /api/maestro/grupos - Obtener grupos creados por el maestro
app.get('/api/maestro/grupos', async (req, res) => {
  try {
    const query = `
      SELECT g.*, COUNT(ga.alumno_id) AS total_alumnos
      FROM grupos g
      LEFT JOIN grupo_alumnos ga ON g.id = ga.grupo_id
      GROUP BY g.id;
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/maestro/grupos - Crear un nuevo grupo
app.post('/api/maestro/grupos', async (req, res) => {
  const { nombre, descripcion } = req.body;
  try {
    const codigo = 'BIO-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const maestroId = 'a1111111-1111-1111-1111-111111111111'; // ID fijo de prueba

    const query = `
      INSERT INTO grupos (id, maestro_id, nombre, descripcion, codigo_invitacion) 
      VALUES (UUID(), ?, ?, ?, ?);
    `;
    await db.query(query, [maestroId, nombre, descripcion, codigo]);
    res.json({ message: 'Grupo creado exitosamente', codigo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/maestro/actividades - Crear una nueva actividad con palabras clave
app.post('/api/maestro/actividades', async (req, res) => {
  const { grupo_id, titulo, instrucciones, palabras } = req.body;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const actId = require('crypto').randomUUID();
    await connection.query(
      'INSERT INTO actividades (id, grupo_id, titulo, instrucciones) VALUES (?, ?, ?, ?)',
      [actId, grupo_id, titulo, instrucciones]
    );

    if (palabras && palabras.length > 0) {
      for (const p of palabras) {
        await connection.query(
          'INSERT INTO palabras_actividad (id, actividad_id, palabra, pista_concepto, puntos) VALUES (UUID(), ?, ?, ?, ?)',
          [actId, p.palabra.toUpperCase(), p.pista || p.pista_concepto, p.puntos || 10]
        );
      }
    }

    await connection.commit();
    res.json({ message: 'Actividad creada con éxito', actividad_id: actId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// GET /api/maestro/analitica/:grupoId - Reportes y desempeño de alumnos
app.get('/api/maestro/analitica/:grupoId', async (req, res) => {
  const { grupoId } = req.params;
  try {
    const query = `
      SELECT 
        u.nombre AS alumno_nombre,
        u.apellido AS alumno_apellido,
        act.titulo AS actividad,
        rv.puntaje_total,
        rv.palabras_encontradas,
        rv.tiempo_segundos,
        rv.completado,
        rv.fecha_jugado
      FROM resultados_videojuego rv
      JOIN actividades act ON rv.actividad_id = act.id
      JOIN alumnos al ON rv.alumno_id = al.id
      JOIN usuarios u ON al.usuario_id = u.id
      WHERE act.grupo_id = ?;
    `;
    const [rows] = await db.query(query, [grupoId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/juego/actividad/:id - Cargar nivel del juego Word Connect
app.get('/api/juego/actividad/:id', async (req, res) => {
  const { id } = req.params;
  try {
    let [actividades] = await db.query('SELECT * FROM actividades WHERE id = ?', [id]);
    let actId = id;

    // Si no encuentra la actividad solicitada, toma la primera registrada
    if (actividades.length === 0) {
      const [primerAct] = await db.query('SELECT * FROM actividades LIMIT 1');
      if (primerAct.length === 0) {
        return res.json({ actividad: null, palabras: [] });
      }
      actividades = primerAct;
      actId = primerAct[0].id;
    }

    // Consultar las palabras asociadas
    const [palabras] = await db.query(
      'SELECT palabra, pista_concepto, puntos FROM palabras_actividad WHERE actividad_id = ?',
      [actId]
    );

    res.json({ actividad: actividades[0], palabras });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/juego/guardar-resultado - Persistir partida jugada por el alumno
app.post('/api/juego/guardar-resultado', async (req, res) => {
  const { actividad_id, puntaje_total, palabras_encontradas, tiempo_segundos, completado } = req.body;
  const alumnoId = 'b1111111-1111-1111-1111-111111111111'; // ID fijo de prueba de Sofía López

  try {
    const query = `
      INSERT INTO resultados_videojuego 
      (id, actividad_id, alumno_id, puntaje_total, palabras_encontradas, tiempo_segundos, completado)
      VALUES (UUID(), ?, ?, ?, ?, ?, ?);
    `;
    await db.query(query, [actividad_id, alumnoId, puntaje_total, palabras_encontradas, tiempo_segundos, completado ? 1 : 0]);
    res.json({ message: 'Resultado registrado en MariaDB' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/alumno/mis-grupos - Obtener los grupos a los que pertenece el alumno
app.get('/api/alumno/mis-grupos', async (req, res) => {
  // ID fijo de prueba del alumno Sofía López (b1111111-1111-1111-1111-111111111111)
  const alumnoId = 'b1111111-1111-1111-1111-111111111111';

  try {
    const query = `
      SELECT 
        g.id, 
        g.nombre, 
        g.descripcion, 
        g.codigo_invitacion, 
        u.nombre AS maestro_nombre, 
        u.apellido AS maestro_apellido
      FROM grupo_alumnos ga
      JOIN grupos g ON ga.grupo_id = g.id
      JOIN maestros m ON g.maestro_id = m.id
      JOIN usuarios u ON m.usuario_id = u.id
      WHERE ga.alumno_id = ?;
    `;
    const [rows] = await db.query(query, [alumnoId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/alumno/unirse-grupo', async (req, res) => {
  const { codigo_invitacion } = req.body;
  const alumnoId = 'b1111111-1111-1111-1111-111111111111'; // ID de Sofía López

  try {
    if (!codigo_invitacion) {
      return res.status(400).json({ error: 'Debes proporcionar un código de invitación' });
    }

    // 1. Buscar si el código existe en MariaDB
    const [grupos] = await db.query(
      'SELECT id, nombre FROM grupos WHERE codigo_invitacion = ? AND activo = TRUE',
      [codigo_invitacion.trim().toUpperCase()]
    );

    if (grupos.length === 0) {
      return res.status(404).json({ error: 'El código de invitación no existe' });
    }

    const grupoId = grupos[0].id;

    // 2. Verificar si el alumno ya está inscrito
    const [existente] = await db.query(
      'SELECT id FROM grupo_alumnos WHERE grupo_id = ? AND alumno_id = ?',
      [grupoId, alumnoId]
    );

    if (existente.length > 0) {
      return res.status(400).json({ error: 'Ya estás inscrito en este grupo' });
    }

    // 3. Registrar la unión en MariaDB
    await db.query(
      'INSERT INTO grupo_alumnos (id, grupo_id, alumno_id) VALUES (UUID(), ?, ?)',
      [grupoId, alumnoId]
    );

    res.json({ message: `Te has unido al grupo ${grupos[0].nombre}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// RUTAS DEL ALUMNO
// ==========================================

// 1. GET /api/alumno/actividades/:grupoId - Consultar tareas de un grupo
app.get('/api/alumno/actividades/:grupoId', async (req, res) => {
  const { grupoId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id, grupo_id, titulo, instrucciones, fecha_limite FROM actividades WHERE grupo_id = ?',
      [grupoId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST /api/alumno/unirse-grupo - Unirse a un grupo por código de invitación
app.post('/api/alumno/unirse-grupo', async (req, res) => {
  const { codigo_invitacion } = req.body;
  const alumnoId = 'b1111111-1111-1111-1111-111111111111'; // ID fijo de prueba (Sofía López)

  try {
    if (!codigo_invitacion) {
      return res.status(400).json({ error: 'Debes proporcionar un código de invitación' });
    }

    // Buscar el grupo en MariaDB
    const [grupos] = await db.query(
      'SELECT id, nombre FROM grupos WHERE codigo_invitacion = ? AND activo = TRUE',
      [codigo_invitacion.trim().toUpperCase()]
    );

    if (grupos.length === 0) {
      return res.status(404).json({ error: 'El código de invitación no existe' });
    }

    const grupoId = grupos[0].id;

    // Verificar si el alumno ya está inscrito
    const [existente] = await db.query(
      'SELECT id FROM grupo_alumnos WHERE grupo_id = ? AND alumno_id = ?',
      [grupoId, alumnoId]
    );

    if (existente.length > 0) {
      return res.status(400).json({ error: 'Ya estás inscrito en este grupo' });
    }

    // Insertar inscripción en MariaDB
    await db.query(
      'INSERT INTO grupo_alumnos (id, grupo_id, alumno_id) VALUES (UUID(), ?, ?)',
      [grupoId, alumnoId]
    );

    res.json({ message: `¡Te has unido exitosamente al grupo ${grupos[0].nombre}!`, grupo: grupos[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Iniciar servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Express corriendo en el puerto ${PORT}`);
});

