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
app.post('/api/maestro/actividad', async (req, res) => {
  const { grupo_id, titulo, instrucciones, tipo_juego, palabras } = req.body;
  try {
    const actividadId = require('crypto').randomUUID();

    // Insertar actividad con el tipo de juego
    await db.query(
      'INSERT INTO actividades (id, grupo_id, titulo, instrucciones, tipo_juego) VALUES (?, ?, ?, ?, ?)',
      [actividadId, grupo_id, titulo, instrucciones, tipo_juego || 'WORD_CONNECT']
    );

    // Insertar palabras asociadas
    for (const p of palabras) {
      if (p.palabra) {
        await db.query(
          'INSERT INTO palabras_actividad (id, actividad_id, palabra, pista_concepto, puntos) VALUES (UUID(), ?, ?, ?, ?)',
          [actividadId, p.palabra.toUpperCase().trim(), p.pista, p.puntos || 10]
        );
      }
    }

    res.json({ message: 'Actividad creada correctamente', actividadId });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// En backend/src/index.js

// GET /api/maestro/reporte/:grupoId - Reporte de resultados de los alumnos
app.get('/api/maestro/reporte/:grupoId', async (req, res) => {
  const { grupoId } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT 
        u.nombre AS alumno_nombre,
        u.apellido AS alumno_apellido,
        act.titulo AS actividad,
        rv.puntaje_total,
        rv.palabras_encontradas,
        rv.tiempo_segundos,
        rv.completado
      FROM resultados_videojuego rv
      JOIN actividades act ON rv.actividad_id = act.id
      JOIN alumnos al ON rv.alumno_id = al.id
      JOIN usuarios u ON al.usuario_id = u.id
      WHERE act.grupo_id = ?`,
      [grupoId]
    );
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
// En backend/src/index.js

app.get('/api/alumno/actividades/:grupoId', async (req, res) => {
  const { grupoId } = req.params;
  try {
    const [actividades] = await db.query(
      'SELECT id, grupo_id, titulo, instrucciones, tipo_juego FROM actividades WHERE grupo_id = ?',
      [grupoId]
    );
    res.json(actividades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/// GET /api/alumno/grupos - Obtener los grupos en los que está inscrito el alumno
app.get('/api/alumno/grupos', async (req, res) => {
  try {
    // Si manejas sesiones/JWT, aquí obtienes el usuario del token.
    // De forma general, realiza la consulta JOIN entre grupo_alumnos, grupos y usuarios (maestros):
    const [rows] = await db.query(
      `SELECT 
        g.id, 
        g.nombre, 
        g.descripcion, 
        g.codigo_invitacion,
        u_m.nombre AS maestro_nombre,
        u_m.apellido AS maestro_apellido
      FROM grupo_alumnos ga
      JOIN grupos g ON ga.grupo_id = g.id
      JOIN maestros m ON g.maestro_id = m.id
      JOIN usuarios u_m ON m.usuario_id = u_m.id`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/alumno/unirse - Permitir al alumno unirse a un grupo mediante código de invitación
app.post('/api/alumno/unirse', async (req, res) => {
  const { codigo_invitacion, usuario_id } = req.body;

  try {
    // 1. Buscar el grupo por su código de invitación
    const [grupos] = await db.query(
      'SELECT id FROM grupos WHERE codigo_invitacion = ?',
      [codigo_invitacion ? codigo_invitacion.toUpperCase().trim() : '']
    );

    if (grupos.length === 0) {
      return res.status(404).json({ error: 'El código de invitación no es válido' });
    }

    const grupoId = grupos[0].id;

    // 2. Obtener el id del alumno a partir de su usuario_id (o usar el ID del alumno recibido)
    let alumnoId = req.body.alumno_id;

    if (!alumnoId && usuario_id) {
      const [alumnos] = await db.query('SELECT id FROM alumnos WHERE usuario_id = ?', [usuario_id]);
      if (alumnos.length > 0) {
        alumnoId = alumnos[0].id;
      }
    }

    // Fallback: Si no viene id específico, consultar el primer alumno registrado para pruebas
    if (!alumnoId) {
      const [primerAlumno] = await db.query('SELECT id FROM alumnos LIMIT 1');
      if (primerAlumno.length > 0) {
        alumnoId = primerAlumno[0].id;
      } else {
        return res.status(400).json({ error: 'No se encontró el registro de alumno' });
      }
    }

    // 3. Insertar la inscripción en la tabla intermedia grupo_alumnos
    await db.query(
      'INSERT INTO grupo_alumnos (id, grupo_id, alumno_id) VALUES (UUID(), ?, ?)',
      [grupoId, alumnoId]
    );

    res.json({ message: 'Te has unido al grupo exitosamente' });
  } catch (error) {
    // Manejo de error cuando el alumno ya está inscrito en ese grupo (clave única uq_grupo_alumno)
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Ya estás inscrito en este grupo' });
    }
    console.error('Error al unirse al grupo:', error);
    res.status(500).json({ error: error.message });
  }
});


// 4. Iniciar servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Express corriendo en el puerto ${PORT}`);
});

