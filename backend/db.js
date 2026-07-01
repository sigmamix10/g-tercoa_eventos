const path = require('path');
const bcrypt = require('bcryptjs');

const dbType = process.env.DB_TYPE || 'sqlite';
const isMySQL = dbType === 'mysql';

let db; // SQLite database object (only for SQLite mode)
let mysqlPool; // MySQL connection pool (only for MySQL mode)

// Expose a promise that resolves when the database and tables are fully initialized
const initPromise = new Promise(async (resolve, reject) => {
  if (isMySQL) {
    try {
      const mysql = require('mysql2/promise');
      const dbName = process.env.DB_DATABASE || 'gtercoa_eventos';

      // Connect without database to create it if it doesn't exist
      const tempConnection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
      });
      await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      await tempConnection.end();

      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306', 10),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      console.log('Connected to the MySQL/MariaDB database.');

      // Create tables if they do not exist
      // Since MySQL does not support TEXT as Primary Key/Unique/Foreign Key without length limit,
      // we declare keys as VARCHAR(255) in MySQL.
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          cpf VARCHAR(50) UNIQUE NOT NULL,
          role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'moderator', 'evaluator', 'participant')),
          photo_url TEXT,
          minibio TEXT,
          contact VARCHAR(100),
          institution VARCHAR(255),
          position VARCHAR(255),
          lattes_link TEXT,
          orcid VARCHAR(100),
          created_at VARCHAR(50) NOT NULL
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS events (
          id VARCHAR(255) PRIMARY KEY,
          slug VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL CHECK(type IN ('school_of_summer', 'dima', 'live_cycle', 'workshop')),
          description TEXT,
          banner_url TEXT,
          start_date VARCHAR(50) NOT NULL,
          end_date VARCHAR(50) NOT NULL,
          thematic_axes TEXT, -- JSON string array
          registration_categories TEXT, -- JSON object array
          submission_rules TEXT,
          workload_hours INTEGER DEFAULT 0,
          transmission_link TEXT,
          cert_border_color VARCHAR(50) DEFAULT '#1A365D',
          cert_signature_name VARCHAR(255) DEFAULT 'Comissão Organizadora G-TERCOA',
          cert_signature_role VARCHAR(255) DEFAULT 'Coordenador Geral',
          cert_text_template TEXT,
          location VARCHAR(255) DEFAULT 'Auditório Principal',
          guests TEXT, -- JSON string array of guest objects: [{id, name, role, institution, image_url}]
          submissions_enabled INTEGER DEFAULT 1,
          cert_text_organization TEXT,
          cert_text_presentation TEXT,
          cert_text_guest TEXT,
          registration_start_date VARCHAR(50),
          registration_end_date VARCHAR(50),
          supporters TEXT,
          additional_links TEXT,
          cert_bg_front_url TEXT,
          cert_bg_back_url TEXT,
          rules_files TEXT,
          max_coauthors INTEGER DEFAULT 0,
          submission_start_date VARCHAR(50),
          submission_deadline VARCHAR(50),
          evaluation_deadline VARCHAR(50),
          results_deadline VARCHAR(50),
          created_at VARCHAR(50) NOT NULL
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id VARCHAR(255) PRIMARY KEY,
          event_id VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL CHECK(type IN ('palestra', 'mesa_redonda', 'minicurso', 'outro')),
          start_time VARCHAR(50) NOT NULL,
          end_time VARCHAR(50) NOT NULL,
          location VARCHAR(255),
          description TEXT,
          guests TEXT, -- JSON string array of guest objects
          transmission_link TEXT,
          additional_links TEXT,
          created_at VARCHAR(50) NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS registrations (
          id VARCHAR(255) PRIMARY KEY,
          event_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          category VARCHAR(255) NOT NULL,
          checked_in INTEGER DEFAULT 0,
          checked_in_at VARCHAR(50),
          created_at VARCHAR(50) NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(event_id, user_id)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS submissions (
          id VARCHAR(255) PRIMARY KEY,
          event_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          authors TEXT NOT NULL,
          affiliation VARCHAR(255) NOT NULL,
          thematic_axis VARCHAR(255) NOT NULL,
          file_path TEXT NOT NULL,
          file_name TEXT NOT NULL,
          status VARCHAR(50) DEFAULT 'under_review' CHECK(status IN ('under_review', 'accepted', 'accepted_with_remarks', 'rejected')),
          reviewer_id VARCHAR(255),
          reviewer_status VARCHAR(50),
          reviewer_comments TEXT,
          reviewer_2_id VARCHAR(255),
          reviewer_2_status VARCHAR(50),
          reviewer_2_comments TEXT,
          reviewer_evaluation_form TEXT,
          reviewer_2_evaluation_form TEXT,
          file_path_identified TEXT,
          file_name_identified TEXT,
          coauthor_ids TEXT,
          created_at VARCHAR(50) NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL,
          FOREIGN KEY (reviewer_2_id) REFERENCES users (id) ON DELETE SET NULL
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS event_assignments (
          id VARCHAR(255) PRIMARY KEY,
          event_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL CHECK(role IN ('coordinator', 'evaluator', 'organizer', 'event_coordinator', 'communication_coordinator')),
          axis VARCHAR(255),
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(event_id, user_id, role, axis)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS event_notifications (
          id VARCHAR(255) PRIMARY KEY,
          event_id VARCHAR(255) NOT NULL,
          sender_id VARCHAR(255) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          target_audience VARCHAR(50) NOT NULL CHECK(target_audience IN ('all', 'present', 'authors', 'evaluators', 'coordinators')),
          created_at VARCHAR(50) NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS activity_presences (
          id VARCHAR(255) PRIMARY KEY,
          event_id VARCHAR(255) NOT NULL,
          activity_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          created_at VARCHAR(50) NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          FOREIGN KEY (activity_id) REFERENCES activities (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(activity_id, user_id)
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS certificate_templates (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          bg_front_url TEXT,
          bg_back_url TEXT,
          text_template TEXT,
          created_at VARCHAR(50) NOT NULL
        )
      `);

      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS certificates (
          id VARCHAR(255) PRIMARY KEY,
          event_id VARCHAR(255) NOT NULL,
          user_id VARCHAR(255) NOT NULL,
          verification_code VARCHAR(255) UNIQUE NOT NULL,
          workload_hours INTEGER NOT NULL,
          type VARCHAR(50) DEFAULT 'participation',
          presentation_title TEXT,
          template_id VARCHAR(255),
          created_at VARCHAR(50) NOT NULL,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          UNIQUE(event_id, user_id, type)
        )
      `);

      // MySQL migrations for tables
      const mysqlAlterQueries = [
        "ALTER TABLE submissions ADD COLUMN reviewer_status VARCHAR(50)",
        "ALTER TABLE submissions ADD COLUMN reviewer_comments TEXT",
        "ALTER TABLE submissions ADD COLUMN reviewer_2_id VARCHAR(255)",
        "ALTER TABLE submissions ADD COLUMN reviewer_2_status VARCHAR(50)",
        "ALTER TABLE submissions ADD COLUMN reviewer_2_comments TEXT",
        "ALTER TABLE events ADD COLUMN rules_files TEXT",
        "ALTER TABLE events ADD COLUMN max_coauthors INTEGER DEFAULT 0",
        "ALTER TABLE events ADD COLUMN submission_start_date VARCHAR(50)",
        "ALTER TABLE events ADD COLUMN submission_deadline VARCHAR(50)",
        "ALTER TABLE events ADD COLUMN evaluation_deadline VARCHAR(50)",
        "ALTER TABLE events ADD COLUMN results_deadline VARCHAR(50)",
        "ALTER TABLE submissions ADD COLUMN reviewer_evaluation_form TEXT",
        "ALTER TABLE submissions ADD COLUMN reviewer_2_evaluation_form TEXT",
        "ALTER TABLE submissions ADD COLUMN file_path_identified TEXT",
        "ALTER TABLE submissions ADD COLUMN file_name_identified TEXT",
        "ALTER TABLE submissions ADD COLUMN coauthor_ids TEXT",
        "ALTER TABLE certificates ADD COLUMN template_id VARCHAR(255)"
      ];
      for (const query of mysqlAlterQueries) {
        try {
          await mysqlPool.query(query);
        } catch (err) {
          if (!err.message.includes('duplicate column') && !err.message.includes('already exists') && !err.message.includes('Duplicate column')) {
            console.log('MySQL Alter Table Notice:', err.message);
          }
        }
      }
      // Migrate existing MySQL reviews to reviewer_status/reviewer_comments if reviewer_id is set
      try {
        await mysqlPool.query(`
          UPDATE submissions 
          SET reviewer_status = status, reviewer_comments = review_comments 
          WHERE reviewer_id IS NOT NULL AND reviewer_status IS NULL
        `);
      } catch (err) {
        console.log('MySQL data migration notice:', err.message);
      }

      // Seed the default admin in MySQL
      const adminEmail = process.env.ADMIN_EMAIL || 'tercoa.monitoria@gmail.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'G-tercoaufc@2024';

      const [rows] = await mysqlPool.query('SELECT id, email, cpf FROM users WHERE email = ? OR cpf = ?', [adminEmail, '000.000.000-00']);
      if (rows.length === 0) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(adminPassword, salt);
        const adminId = 'admin-uuid-0000-0000-000000000000';
        await mysqlPool.query(`
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
        ]);
        console.log(`Default admin user created in MySQL (${adminEmail}).`);
      } else {
        // Update admin if exists to ensure credentials match env variables
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(adminPassword, salt);
        await mysqlPool.query(`
          UPDATE users
          SET name = ?, email = ?, password_hash = ?, role = 'admin'
          WHERE id = ? OR cpf = ?
        `, [
          'Administrador Geral G-TERCOA',
          adminEmail,
          hash,
          rows[0].id,
          '000.000.000-00'
        ]);
        console.log(`Admin user synchronized in MySQL (${adminEmail}).`);
      }

      resolve();
    } catch (err) {
      console.error('Error opening/initializing MySQL database:', err.message);
      reject(err);
    }
  } else {
    // SQLite Mode
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'database.db');
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
      } else {
        console.log('Connected to the SQLite database.');
        
        db.serialize(() => {
          db.run(`
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              cpf TEXT UNIQUE NOT NULL,
              role TEXT CHECK(role IN ('admin', 'moderator', 'evaluator', 'participant')) NOT NULL,
              photo_url TEXT,
              minibio TEXT,
              contact TEXT,
              institution TEXT,
              position TEXT,
              lattes_link TEXT,
              orcid TEXT,
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
              registration_start_date TEXT,
              registration_end_date TEXT,
              supporters TEXT DEFAULT '[]',
              additional_links TEXT DEFAULT '[]',
              cert_bg_front_url TEXT,
              cert_bg_back_url TEXT,
              rules_files TEXT,
              max_coauthors INTEGER DEFAULT 0,
              submission_start_date TEXT,
              submission_deadline TEXT,
              evaluation_deadline TEXT,
              results_deadline TEXT,
              created_at TEXT NOT NULL
            )
          `);

          // Run SQLite migrations
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
            "ALTER TABLE events ADD COLUMN cert_text_guest TEXT DEFAULT 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou como convidado(a)/palestrante especial no evento acadêmico {evento}, realizado {periodo}, ministrando atividades com carga horária de {carga_horaria} horas.'",
            "ALTER TABLE events ADD COLUMN registration_start_date TEXT",
            "ALTER TABLE events ADD COLUMN registration_end_date TEXT",
            "ALTER TABLE events ADD COLUMN supporters TEXT DEFAULT '[]'",
            "ALTER TABLE activities ADD COLUMN transmission_link TEXT",
            "ALTER TABLE users ADD COLUMN photo_url TEXT",
            "ALTER TABLE users ADD COLUMN minibio TEXT",
            "ALTER TABLE users ADD COLUMN contact TEXT",
            "ALTER TABLE users ADD COLUMN institution TEXT",
            "ALTER TABLE users ADD COLUMN position TEXT",
            "ALTER TABLE users ADD COLUMN lattes_link TEXT",
            "ALTER TABLE users ADD COLUMN orcid TEXT",
            "ALTER TABLE events ADD COLUMN additional_links TEXT DEFAULT '[]'",
            "ALTER TABLE activities ADD COLUMN additional_links TEXT DEFAULT '[]'",
            "ALTER TABLE events ADD COLUMN cert_bg_front_url TEXT",
            "ALTER TABLE events ADD COLUMN cert_bg_back_url TEXT",
            "ALTER TABLE submissions ADD COLUMN reviewer_status TEXT",
            "ALTER TABLE submissions ADD COLUMN reviewer_comments TEXT",
            "ALTER TABLE submissions ADD COLUMN reviewer_2_id TEXT",
            "ALTER TABLE submissions ADD COLUMN reviewer_2_status TEXT",
            "ALTER TABLE submissions ADD COLUMN reviewer_2_comments TEXT",
            "ALTER TABLE events ADD COLUMN rules_files TEXT",
            "ALTER TABLE events ADD COLUMN max_coauthors INTEGER DEFAULT 0",
            "ALTER TABLE events ADD COLUMN submission_start_date TEXT",
            "ALTER TABLE events ADD COLUMN submission_deadline TEXT",
            "ALTER TABLE events ADD COLUMN evaluation_deadline TEXT",
            "ALTER TABLE events ADD COLUMN results_deadline TEXT",
            "ALTER TABLE submissions ADD COLUMN reviewer_evaluation_form TEXT",
            "ALTER TABLE submissions ADD COLUMN reviewer_2_evaluation_form TEXT",
            "ALTER TABLE submissions ADD COLUMN file_path_identified TEXT",
            "ALTER TABLE submissions ADD COLUMN file_name_identified TEXT",
            "ALTER TABLE submissions ADD COLUMN coauthor_ids TEXT"
          ];

          alterColumns.forEach(query => {
            db.run(query, (err) => {
              if (err && !err.message.includes('duplicate column name') && !err.message.includes('already exists') && !err.message.includes('duplicate column')) {
                console.log('Alter table notice:', err.message);
              }
            });
          });

          // SQLite data migration: copy old reviews to reviewer_status / reviewer_comments
          db.run(`
            UPDATE submissions 
            SET reviewer_status = status, reviewer_comments = review_comments 
            WHERE reviewer_id IS NOT NULL AND reviewer_status IS NULL
          `, (err) => {
            if (err) {
              console.log('SQLite data migration notice:', err.message);
            }
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
              transmission_link TEXT,
              additional_links TEXT DEFAULT '[]',
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
              reviewer_status TEXT,
              reviewer_comments TEXT,
              reviewer_2_id TEXT,
              reviewer_2_status TEXT,
              reviewer_2_comments TEXT,
              reviewer_evaluation_form TEXT,
              reviewer_2_evaluation_form TEXT,
              file_path_identified TEXT,
              file_name_identified TEXT,
              coauthor_ids TEXT,
              created_at TEXT NOT NULL,
              FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
              FOREIGN KEY (reviewer_id) REFERENCES users (id) ON DELETE SET NULL,
              FOREIGN KEY (reviewer_2_id) REFERENCES users (id) ON DELETE SET NULL
            )
          `);

          db.run(`
            CREATE TABLE IF NOT EXISTS event_assignments (
              id TEXT PRIMARY KEY,
              event_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              role TEXT CHECK(role IN ('coordinator', 'evaluator', 'organizer', 'event_coordinator', 'communication_coordinator')) NOT NULL,
              axis TEXT,
              FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
              UNIQUE(event_id, user_id, role, axis)
            )
          `);

          db.run(`
            CREATE TABLE IF NOT EXISTS event_notifications (
              id TEXT PRIMARY KEY,
              event_id TEXT NOT NULL,
              sender_id TEXT NOT NULL,
              title TEXT NOT NULL,
              message TEXT NOT NULL,
              target_audience TEXT CHECK(target_audience IN ('all', 'present', 'authors', 'evaluators', 'coordinators')) NOT NULL,
              created_at VARCHAR(50) NOT NULL,
              FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
              FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
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
            CREATE TABLE IF NOT EXISTS certificate_templates (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              bg_front_url TEXT,
              bg_back_url TEXT,
              text_template TEXT,
              created_at TEXT NOT NULL
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
              template_id TEXT,
              created_at TEXT NOT NULL,
              FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
              FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
              UNIQUE(event_id, user_id, type)
            )
          `);

          const alterCertColumns = [
            "ALTER TABLE certificates ADD COLUMN type TEXT DEFAULT 'participation'",
            "ALTER TABLE certificates ADD COLUMN presentation_title TEXT",
            "ALTER TABLE certificates ADD COLUMN template_id TEXT"
          ];
          alterCertColumns.forEach(query => {
            db.run(query, (err) => {
              if (err && !err.message.includes('duplicate column name') && !err.message.includes('already exists') && !err.message.includes('duplicate column')) {
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

          // Migration to update CHECK constraint on users table to include moderator role
          db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
            if (row && row.sql && !row.sql.includes('moderator')) {
              console.log('Migrating users table for moderator role...');
              db.serialize(() => {
                db.run(`
                  CREATE TABLE IF NOT EXISTS users_dg_tmp (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    cpf TEXT UNIQUE NOT NULL,
                    role TEXT CHECK(role IN ('admin', 'moderator', 'evaluator', 'participant')) NOT NULL,
                    photo_url TEXT,
                    minibio TEXT,
                    contact TEXT,
                    institution TEXT,
                    position TEXT,
                    lattes_link TEXT,
                    orcid TEXT,
                    created_at TEXT NOT NULL
                  )
                `);
                db.run(`
                  INSERT OR IGNORE INTO users_dg_tmp (id, name, email, password_hash, cpf, role, photo_url, minibio, contact, institution, position, lattes_link, orcid, created_at)
                  SELECT id, name, email, password_hash, cpf, role, photo_url, minibio, contact, institution, position, lattes_link, orcid, created_at FROM users
                `);
                db.run("DROP TABLE users");
                db.run("ALTER TABLE users_dg_tmp RENAME TO users");
                console.log('users table migration completed.');
              });
            }
          });

          // Migration to update CHECK constraint on event_assignments table to include organizer, event_coordinator and communication_coordinator roles
          db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='event_assignments'", (err, row) => {
            if (row && row.sql && (!row.sql.includes('organizer') || !row.sql.includes('communication_coordinator'))) {
              console.log('Migrating event_assignments table for communication_coordinator role...');
              db.serialize(() => {
                db.run(`
                  CREATE TABLE IF NOT EXISTS event_assignments_dg_tmp (
                    id TEXT PRIMARY KEY,
                    event_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    role TEXT CHECK(role IN ('coordinator', 'evaluator', 'organizer', 'event_coordinator', 'communication_coordinator')) NOT NULL,
                    axis TEXT,
                    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
                    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                    UNIQUE(event_id, user_id, role, axis)
                  )
                `);
                db.run(`
                  INSERT OR IGNORE INTO event_assignments_dg_tmp (id, event_id, user_id, role, axis)
                  SELECT id, event_id, user_id, role, axis FROM event_assignments
                `);
                db.run("DROP TABLE event_assignments");
                db.run("ALTER TABLE event_assignments_dg_tmp RENAME TO event_assignments");
                console.log('event_assignments table migration completed.');
              });
            }
          });

          // Check if admin is seeded
          const adminEmail = process.env.ADMIN_EMAIL || 'tercoa.monitoria@gmail.com';
          const adminPassword = process.env.ADMIN_PASSWORD || 'G-tercoaufc@2024';
          db.get('SELECT id, email, cpf FROM users WHERE email = ? OR cpf = ?', [adminEmail, '000.000.000-00'], async (err, row) => {
            if (err) {
              console.error('Error querying admin:', err);
              reject(err);
            } else if (!row) {
              try {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(adminPassword, salt);
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
                    console.log(`Default admin user created (${adminEmail}).`);
                    resolve();
                  }
                });
              } catch (hashErr) {
                reject(hashErr);
              }
            } else {
              try {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(adminPassword, salt);
                db.run(`
                  UPDATE users
                  SET name = ?, email = ?, password_hash = ?, role = 'admin'
                  WHERE id = ? OR cpf = ?
                `, [
                  'Administrador Geral G-TERCOA',
                  adminEmail,
                  hash,
                  row.id,
                  '000.000.000-00'
                ], (updateErr) => {
                  if (updateErr) {
                    console.error('Error updating admin user:', updateErr);
                    reject(updateErr);
                  } else {
                    console.log(`Admin user synchronized (${adminEmail}).`);
                    resolve();
                  }
                });
              } catch (hashErr) {
                reject(hashErr);
              }
            }
          });
        });
      }
    });
  }
});

// Error mapper to normalize MySQL constraint error messages to match SQLite formats
function handleDatabaseError(err) {
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    const msg = err.sqlMessage || err.message || '';
    let constraintName = 'UNIQUE';
    
    if (msg.includes('users.email') || msg.includes("key 'email'") || msg.includes("key 'users.email'")) {
      constraintName = 'users.email';
    } else if (msg.includes('users.cpf') || msg.includes("key 'cpf'") || msg.includes("key 'users.cpf'")) {
      constraintName = 'users.cpf';
    } else if (msg.includes('events.slug') || msg.includes("key 'slug'") || msg.includes("key 'events.slug'")) {
      constraintName = 'events.slug';
    } else {
      const keyMatch = msg.match(/key '([^']+)'/);
      if (keyMatch) {
        constraintName = keyMatch[1];
      }
    }
    
    const translatedErr = new Error(`UNIQUE constraint failed: ${constraintName}`);
    translatedErr.code = err.code;
    translatedErr.errno = err.errno;
    translatedErr.sqlMessage = err.sqlMessage;
    return translatedErr;
  }
  return err;
}

async function runQuery(sql, params = []) {
  await initPromise;
  if (isMySQL) {
    try {
      const [result] = await mysqlPool.query(sql, params);
      return {
        changes: result.affectedRows,
        lastID: result.insertId
      };
    } catch (err) {
      throw handleDatabaseError(err);
    }
  } else {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }
}

async function getQuery(sql, params = []) {
  await initPromise;
  if (isMySQL) {
    try {
      const [rows] = await mysqlPool.query(sql, params);
      return rows[0] || null;
    } catch (err) {
      throw handleDatabaseError(err);
    }
  } else {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

async function allQuery(sql, params = []) {
  await initPromise;
  if (isMySQL) {
    try {
      const [rows] = await mysqlPool.query(sql, params);
      return rows;
    } catch (err) {
      throw handleDatabaseError(err);
    }
  } else {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = {
  db,
  mysqlPool,
  initPromise,
  runQuery,
  getQuery,
  allQuery
};
