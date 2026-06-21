const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.db');
let db;

// Expose a promise that resolves when the database and tables are fully initialized
const initPromise = new Promise((resolve, reject) => {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
      reject(err);
    } else {
      console.log('Connected to the SQLite database.');
      
      // Run table creations inside a serialize block to guarantee execution order
      db.serialize(() => {
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            cpf TEXT UNIQUE NOT NULL,
            role TEXT CHECK(role IN ('admin', 'evaluator', 'participant')) NOT NULL,
            created_at TEXT NOT NULL
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            slug TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT CHECK(type IN ('school_of_summer', 'dima', 'live_cycle', 'workshop')) NOT NULL,
            description TEXT,
            banner_url TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            thematic_axes TEXT, -- JSON string array
            registration_categories TEXT, -- JSON object array
            submission_rules TEXT,
            workload_hours INTEGER DEFAULT 0,
            transmission_link TEXT,
            cert_border_color TEXT DEFAULT '#1A365D',
            cert_signature_name TEXT DEFAULT 'Comissão Organizadora G-TERCOA',
            cert_signature_role TEXT DEFAULT 'Coordenador Geral',
            cert_text_template TEXT DEFAULT 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou ativamente do evento acadêmico {evento}, realizado {periodo}, cumprindo carga horária total de {carga_horaria} horas.',
            location TEXT DEFAULT 'Auditório Principal',
            guests TEXT DEFAULT '[]', -- JSON string array of guest objects: [{id, name, role, institution, image_url}]
            submissions_enabled INTEGER DEFAULT 1,
            cert_text_organization TEXT DEFAULT 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou da Comissão Organizadora do evento acadêmico {evento}, realizado {periodo}, com carga horária total de {carga_horaria} horas.',
            cert_text_presentation TEXT DEFAULT 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, apresentou o trabalho intitulado "{titulo_trabalho}" no evento acadêmico {evento}, realizado {periodo}, com carga horária de {carga_horaria} horas.',
            cert_text_guest TEXT DEFAULT 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou como convidado(a)/palestrante especial no evento acadêmico {evento}, realizado {periodo}, ministrando atividades com carga horária de {carga_horaria} horas.',
            created_at TEXT NOT NULL
          )
        `);

        // Migration for existing tables: add certificate customization fields if missing
        const alterColumns = [
          "ALTER TABLE events ADD COLUMN cert_border_color TEXT DEFAULT '#1A365D'",
          "ALTER TABLE events ADD COLUMN cert_signature_name TEXT DEFAULT 'Comissão Organizadora G-TERCOA'",
          "ALTER TABLE events ADD COLUMN cert_signature_role TEXT DEFAULT 'Coordenador Geral'",
          "ALTER TABLE events ADD COLUMN cert_text_template TEXT DEFAULT 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou ativamente do evento acadêmico {evento}, realizado {periodo}, cumprindo carga horária total de {carga_horaria} horas.'",
          "ALTER TABLE events ADD COLUMN location TEXT DEFAULT 'Auditório Principal'",
          "ALTER TABLE events ADD COLUMN guests TEXT DEFAULT '[]'",
          "ALTER TABLE events ADD COLUMN submissions_enabled INTEGER DEFAULT 1",
          "ALTER TABLE events ADD COLUMN cert_text_organization TEXT DEFAULT 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou da Comissão Organizadora do evento acadêmico {evento}, realizado {periodo}, com carga horária total de {carga_horaria} horas.'",
          "ALTER TABLE events ADD COLUMN cert_text_presentation TEXT DEFAULT 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, apresentou o trabalho intitulado \"{titulo_trabalho}\" no evento acadêmico {evento}, realizado {periodo}, com carga horária de {carga_horaria} horas.'",
          "ALTER TABLE events ADD COLUMN cert_text_guest TEXT DEFAULT 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou como convidado(a)/palestrante especial no evento acadêmico {evento}, realizado {periodo}, ministrando atividades com carga horária de {carga_horaria} horas.'"
        ];
        alterColumns.forEach(query => {
          db.run(query, (err) => {
            if (err && !err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
              console.log('Alter table notice:', err.message);
            }
          });
        });

        db.run(`
          CREATE TABLE IF NOT EXISTS activities (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            title TEXT NOT NULL,
            type TEXT CHECK(type IN ('palestra', 'mesa_redonda', 'minicurso', 'outro')) NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            location TEXT,
            description TEXT,
            guests TEXT, -- JSON string array of guest objects
            created_at TEXT NOT NULL,
            FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS registrations (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            category TEXT NOT NULL,
            checked_in INTEGER DEFAULT 0,
            checked_in_at TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(event_id, user_id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS submissions (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            title TEXT NOT NULL,
            authors TEXT NOT NULL,
            affiliation TEXT NOT NULL,
            thematic_axis TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_name TEXT NOT NULL,
            status TEXT CHECK(status IN ('under_review', 'accepted', 'accepted_with_remarks', 'rejected')) DEFAULT 'under_review',
            reviewer_id TEXT,
            review_comments TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS event_assignments (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT CHECK(role IN ('coordinator', 'evaluator')) NOT NULL,
            axis TEXT,
            FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(event_id, user_id, role, axis)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS activity_presences (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            activity_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
            FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(activity_id, user_id)
          )
        `);

        db.run(`
          CREATE TABLE IF NOT EXISTS certificates (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            verification_code TEXT UNIQUE NOT NULL,
            workload_hours INTEGER NOT NULL,
            type TEXT DEFAULT 'participation',
            presentation_title TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            UNIQUE(event_id, user_id, type)
          )
        `);

        // Migration for existing certificates table columns
        const alterCertColumns = [
          "ALTER TABLE certificates ADD COLUMN type TEXT DEFAULT 'participation'",
          "ALTER TABLE certificates ADD COLUMN presentation_title TEXT"
        ];
        alterCertColumns.forEach(query => {
          db.run(query, (err) => {
            if (err && !err.message.includes('duplicate column name') && !err.message.includes('already exists')) {
              console.log('Alter certificates table notice:', err.message);
            }
          });
        });

        // Migration to update unique constraint on certificates table to include type
        db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='certificates'", (err, row) => {
          if (row && row.sql && !row.sql.includes('UNIQUE(event_id, user_id, type)')) {
            console.log('Migrating certificates unique constraint...');
            db.serialize(() => {
              db.run(`
                CREATE TABLE IF NOT EXISTS certificates_dg_tmp (
                  id TEXT PRIMARY KEY,
                  event_id TEXT NOT NULL,
                  user_id TEXT NOT NULL,
                  verification_code TEXT UNIQUE NOT NULL,
                  workload_hours INTEGER NOT NULL,
                  type TEXT DEFAULT 'participation',
                  presentation_title TEXT,
                  created_at TEXT NOT NULL,
                  FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
                  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                  UNIQUE(event_id, user_id, type)
                )
              `);
              db.run(`
                INSERT OR IGNORE INTO certificates_dg_tmp (id, event_id, user_id, verification_code, workload_hours, type, presentation_title, created_at)
                SELECT id, event_id, user_id, verification_code, workload_hours, type, presentation_title, created_at FROM certificates
              `);
              db.run("DROP TABLE certificates");
              db.run("ALTER TABLE certificates_dg_tmp RENAME TO certificates");
              console.log('Certificates unique constraint migration completed.');
            });
          }
        });

        // Check if admin is seeded
        const adminEmail = 'admin@gtercoa.org';
        db.get('SELECT id FROM users WHERE email = ?', [adminEmail], async (err, row) => {
          if (err) {
            console.error('Error querying admin:', err);
            reject(err);
          } else if (!row) {
            try {
              const salt = await bcrypt.genSalt(10);
              const hash = await bcrypt.hash('admin', salt);
              const adminId = 'admin-uuid-0000-0000-000000000000';
              db.run(`
                INSERT INTO users (id, name, email, password_hash, cpf, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `, [
                adminId,
                'Administrador Geral G-TERCOA',
                adminEmail,
                hash,
                '000.000.000-00',
                'admin',
                new Date().toISOString()
              ], (insertErr) => {
                if (insertErr) {
                  console.error('Error seeding admin user:', insertErr);
                  reject(insertErr);
                } else {
                  console.log('Default admin user created (admin@gtercoa.org / admin).');
                  resolve();
                }
              });
            } catch (hashErr) {
              reject(hashErr);
            }
          } else {
            resolve();
          }
        });
      });
    }
  });
});

async function runQuery(sql, params = []) {
  await initPromise;
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function getQuery(sql, params = []) {
  await initPromise;
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function allQuery(sql, params = []) {
  await initPromise;
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,
  initPromise,
  runQuery,
  getQuery,
  allQuery
};
