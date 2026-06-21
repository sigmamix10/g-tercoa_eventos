const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { runQuery, getQuery, allQuery } = require('./db');
const { sendReceiptEmail } = require('./email');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'g_tercoa_secret_key_12345';

// Middlewares
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Multer storage configuration for submissions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const safeName = path.basename(file.originalname, fileExt).replace(/[^a-z0-9]/gi, '_').toLowerCase();
    cb(null, `${Date.now()}-${safeName}${fileExt}`);
  }
});
const upload = multer({ storage });

// Upload Image Endpoint
app.post('/api/upload-image', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo de imagem fornecido' });
  }
  res.json({ image_url: `/uploads/${req.file.filename}` });
});

// JWT Token Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token de autenticação não fornecido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado' });
    req.user = user;
    next();
  });
}

// RBAC Middleware
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado: privilégios insuficientes' });
    }
    next();
  };
}

// ==========================================
// 1. AUTENTICAÇÃO
// ==========================================

// Registrar Usuário
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, cpf, role } = req.body;

  if (!name || !email || !password || !cpf) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const selectedRole = role && ['evaluator', 'participant'].includes(role) ? role : 'participant';

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = crypto.randomUUID();

    await runQuery(`
      INSERT INTO users (id, name, email, password_hash, cpf, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, name, email, passwordHash, cpf, selectedRole, new Date().toISOString()]);

    res.status(201).json({ message: 'Usuário registrado com sucesso', userId });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: users.email')) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado' });
    }
    if (err.message.includes('UNIQUE constraint failed: users.cpf')) {
      return res.status(400).json({ error: 'Este CPF já está cadastrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
  }

  try {
    const user = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'E-mail ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, cpf: user.cpf },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cpf: user.cpf
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao realizar login' });
  }
});

// Obter Usuário Logado
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getQuery('SELECT id, name, email, cpf, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

// Lista de Pareceristas/Avaliadores para o Admin designar
app.get('/api/users/evaluators', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const evaluators = await allQuery("SELECT id, name, email FROM users WHERE role = 'evaluator'");
    res.json(evaluators);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar avaliadores' });
  }
});


// ==========================================
// 2. EVENTOS (EVENT BUILDER)
// ==========================================

// Criar Evento (Admin)
app.post('/api/events', authenticateToken, requireRole(['admin']), async (req, res) => {
  const {
    name,
    slug,
    type,
    description,
    banner_url,
    start_date,
    end_date,
    thematic_axes,
    registration_categories,
    submission_rules,
    workload_hours,
    transmission_link,
    cert_border_color,
    cert_signature_name,
    cert_signature_role,
    cert_text_template,
    location,
    guests,
    submissions_enabled,
    cert_text_organization,
    cert_text_presentation,
    cert_text_guest
  } = req.body;

  if (!name || !slug || !type || !start_date || !end_date) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  // Formatting strings
  const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const axesJSON = JSON.stringify(thematic_axes || []);
  const categoriesJSON = JSON.stringify(registration_categories || []);

  try {
    const eventId = crypto.randomUUID();
    await runQuery(`
      INSERT INTO events (
        id, slug, name, type, description, banner_url, start_date, end_date, 
        thematic_axes, registration_categories, submission_rules, workload_hours, transmission_link,
        cert_border_color, cert_signature_name, cert_signature_role, cert_text_template,
        location, guests, submissions_enabled, cert_text_organization, cert_text_presentation, cert_text_guest, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      eventId,
      formattedSlug,
      name,
      type,
      description || '',
      banner_url || '',
      start_date,
      end_date,
      axesJSON,
      categoriesJSON,
      submission_rules || '',
      parseInt(workload_hours) || 0,
      transmission_link || '',
      cert_border_color || '#1A365D',
      cert_signature_name || 'Comissão Organizadora G-TERCOA',
      cert_signature_role || 'Coordenador Geral',
      cert_text_template || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou ativamente do evento acadêmico {evento}, realizado {periodo}, cumprindo carga horária total de {carga_horaria} horas.',
      location || 'Auditório Principal',
      JSON.stringify(guests || []),
      submissions_enabled !== undefined ? parseInt(submissions_enabled) : 1,
      cert_text_organization || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou da Comissão Organizadora do evento acadêmico {evento}, realizado {periodo}, com carga horária total de {carga_horaria} horas.',
      cert_text_presentation || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, apresentou o trabalho intitulado "{titulo_trabalho}" no evento acadêmico {evento}, realizado {periodo}, com carga horária de {carga_horaria} horas.',
      cert_text_guest || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou como convidado(a)/palestrante especial no evento acadêmico {evento}, realizado {periodo}, ministrando atividades com carga horária de {carga_horaria} horas.',
      new Date().toISOString()
    ]);

    res.status(201).json({ message: 'Evento criado com sucesso', eventId, slug: formattedSlug });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: events.slug')) {
      return res.status(400).json({ error: 'Já existe um evento cadastrado com esta URL amigável (slug)' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

// Listar Eventos
app.get('/api/events', async (req, res) => {
  try {
    const events = await allQuery('SELECT * FROM events ORDER BY start_date DESC');
    // Parse JSON lists before returning
    const parsedEvents = events.map(e => ({
      ...e,
      thematic_axes: JSON.parse(e.thematic_axes || '[]'),
      registration_categories: JSON.parse(e.registration_categories || '[]')
    }));
    res.json(parsedEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar eventos' });
  }
});

// Detalhes de um Evento pelo Slug (Multi-tenant)
app.get('/api/events/by-slug/:slug', async (req, res) => {
  try {
    const event = await getQuery('SELECT * FROM events WHERE slug = ?', [req.params.slug]);
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    event.thematic_axes = JSON.parse(event.thematic_axes || '[]');
    event.registration_categories = JSON.parse(event.registration_categories || '[]');
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar evento' });
  }
});

// Editar Evento (Admin)
app.put('/api/events/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const {
    name,
    slug,
    type,
    description,
    banner_url,
    start_date,
    end_date,
    thematic_axes,
    registration_categories,
    submission_rules,
    workload_hours,
    transmission_link,
    cert_border_color,
    cert_signature_name,
    cert_signature_role,
    cert_text_template,
    location,
    guests,
    submissions_enabled,
    cert_text_organization,
    cert_text_presentation,
    cert_text_guest
  } = req.body;

  const formattedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  const axesJSON = JSON.stringify(thematic_axes || []);
  const categoriesJSON = JSON.stringify(registration_categories || []);

  try {
    await runQuery(`
      UPDATE events 
      SET name = ?, slug = ?, type = ?, description = ?, banner_url = ?, start_date = ?, end_date = ?, 
          thematic_axes = ?, registration_categories = ?, submission_rules = ?, workload_hours = ?, transmission_link = ?,
          cert_border_color = ?, cert_signature_name = ?, cert_signature_role = ?, cert_text_template = ?,
          location = ?, guests = ?, submissions_enabled = ?, cert_text_organization = ?, cert_text_presentation = ?, cert_text_guest = ?
      WHERE id = ?
    `, [
      name,
      formattedSlug,
      type,
      description,
      banner_url,
      start_date,
      end_date,
      axesJSON,
      categoriesJSON,
      submission_rules,
      parseInt(workload_hours) || 0,
      transmission_link,
      cert_border_color || '#1A365D',
      cert_signature_name || 'Comissão Organizadora G-TERCOA',
      cert_signature_role || 'Coordenador Geral',
      cert_text_template || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou ativamente do evento acadêmico {evento}, realizado {periodo}, cumprindo carga horária total de {carga_horaria} horas.',
      location || 'Auditório Principal',
      JSON.stringify(guests || []),
      submissions_enabled !== undefined ? parseInt(submissions_enabled) : 1,
      cert_text_organization || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou da Comissão Organizadora do evento acadêmico {evento}, realizado {periodo}, com carga horária total de {carga_horaria} horas.',
      cert_text_presentation || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, apresentou o trabalho intitulado "{titulo_trabalho}" no evento acadêmico {evento}, realizado {periodo}, com carga horária de {carga_horaria} horas.',
      cert_text_guest || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou como convidado(a)/palestrante especial no evento acadêmico {evento}, realizado {periodo}, ministrando atividades com carga horária de {carga_horaria} horas.',
      req.params.id
    ]);

    res.json({ message: 'Evento atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar evento' });
  }
});


// ==========================================
// 3. INSCRIÇÕES E CREDENCIAMENTO (CHECK-IN)
// ==========================================

// Registrar Inscrição de Participante
app.post('/api/events/:id/register', authenticateToken, async (req, res) => {
  const { category } = req.body;
  const eventId = req.params.id;
  const userId = req.user.id;

  if (!category) {
    return res.status(400).json({ error: 'Selecione uma categoria de inscrição' });
  }

  try {
    const regId = crypto.randomUUID();
    await runQuery(`
      INSERT INTO registrations (id, event_id, user_id, category, checked_in, checked_in_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [regId, eventId, userId, category, 0, null, new Date().toISOString()]);

    // Generate receipt and send email mock in the background
    (async () => {
      try {
        const fullReg = await getQuery(`
          SELECT r.*, u.name as user_name, u.email as user_email, u.cpf as user_cpf,
                 e.name as event_name, e.start_date as event_start, e.end_date as event_end, e.type as event_type
          FROM registrations r
          JOIN users u ON r.user_id = u.id
          JOIN events e ON r.event_id = e.id
          WHERE r.id = ?
        `, [regId]);

        if (fullReg) {
          // Generate QR Code as a Buffer
          const qrBuffer = await QRCode.toBuffer(fullReg.id, {
            margin: 1,
            width: 150,
            errorCorrectionLevel: 'M'
          });

          // Generate PDF document in memory
          const doc = new PDFDocument({ layout: 'portrait', size: 'A4', margin: 40 });
          const buffers = [];
          doc.on('data', buffers.push.bind(buffers));
          doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            sendReceiptEmail(fullReg, fullReg.event_name, fullReg.user_name, fullReg.user_email, pdfBuffer);
          });

          // Draw PDF
          const primaryColor = '#1A365D';
          const secondaryColor = '#D69E2E';
          const darkGray = '#2D3748';
          const lightGray = '#718096';
          const bgFillColor = '#F8FAFC';
          const borderColor = '#E2E8F0';

          doc.rect(40, 40, 515, 8).fill(primaryColor);
          doc.rect(40, 48, 515, 3).fill(secondaryColor);

          doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(24).text('G-TERCOA', 40, 70);
          doc.fillColor(lightGray).font('Helvetica').fontSize(9).text('Grupo de Estudos e Pesquisa - Educação Matemática e Pedagogia', 40, 98);
          doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(18).text('COMPROVANTE DE INSCRIÇÃO', 40, 130);
          doc.moveTo(40, 160).lineTo(555, 160).lineWidth(1).stroke(borderColor);

          const drawCard = (title, x, y, width, height) => {
            doc.rect(x, y, width, height).fillAndStroke(bgFillColor, borderColor);
            doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text(title, x + 15, y + 12);
          };

          const drawInfoLine = (label, value, x, y, width) => {
            doc.fillColor(lightGray).font('Helvetica').fontSize(9.5).text(label, x, y);
            doc.fillColor(darkGray).font('Helvetica-Bold').fontSize(9.5).text(value, x + 100, y, { width: width - 110 });
          };

          drawCard('DADOS DO PARTICIPANTE', 40, 175, 515, 80);
          drawInfoLine('Nome:', fullReg.user_name, 55, 205, 485);
          drawInfoLine('CPF:', fullReg.user_cpf, 55, 222, 485);
          drawInfoLine('E-mail:', fullReg.user_email, 55, 239, 485);

          const startObj = new Date(fullReg.event_start);
          const endObj = new Date(fullReg.event_end);
          const formatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
          const dateRange = startObj.getTime() === endObj.getTime()
            ? startObj.toLocaleDateString('pt-BR', formatOptions)
            : `${startObj.toLocaleDateString('pt-BR', formatOptions)} a ${endObj.toLocaleDateString('pt-BR', formatOptions)}`;

          const getFormatName = (type) => {
            const formats = {
              'school_of_summer': 'Escola de Verão',
              'dima': 'DIMA (Diálogos Matemática & Pedagogia)',
              'live_cycle': 'Ciclo de Lives',
              'workshop': 'Workshop'
            };
            return formats[type] || 'Evento';
          };

          drawCard('DADOS DO EVENTO', 40, 270, 515, 80);
          drawInfoLine('Evento:', fullReg.event_name, 55, 300, 485);
          drawInfoLine('Formato:', getFormatName(fullReg.event_type), 55, 317, 485);
          drawInfoLine('Período:', dateRange, 55, 334, 485);

          const regDate = new Date(fullReg.created_at).toLocaleString('pt-BR');
          drawCard('DETALHES DA INSCRIÇÃO', 40, 365, 515, 80);
          drawInfoLine('Categoria:', fullReg.category, 55, 395, 485);
          drawInfoLine('Inscrição em:', regDate, 55, 412, 485);
          drawInfoLine('Código ID:', fullReg.id, 55, 429, 485);

          const qrCardY = 460;
          doc.rect(177, qrCardY, 240, 230).lineWidth(1).stroke(borderColor);
          doc.fillColor(primaryColor).font('Helvetica-Bold').fontSize(11).text('QR CODE DE CREDENCIAMENTO', 177, qrCardY + 15, { align: 'center', width: 240 });
          doc.image(qrBuffer, 222, qrCardY + 40, { width: 150 });
          doc.fillColor(darkGray).font('Helvetica-Oblique').fontSize(8.5).text('Apresente este QR Code no credenciamento do evento para confirmar sua presença.', 192, qrCardY + 198, { align: 'center', width: 210 });

          doc.moveTo(40, 770).lineTo(555, 770).lineWidth(0.5).stroke('#CBD5E1');
          doc.fillColor(lightGray).font('Helvetica').fontSize(8.5).text('Este documento confirma sua inscrição oficial na plataforma de eventos acadêmicos G-TERCOA.', 40, 785, { align: 'center', width: 515 });

          doc.end();
        }
      } catch (emailErr) {
        console.error('Error in background email generation:', emailErr);
      }
    })();

    res.status(201).json({ message: 'Inscrição realizada com sucesso!', registrationId: regId });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Você já está inscrito neste evento' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao realizar inscrição' });
  }
});

// Listar Inscritos de um Evento (Admin)
app.get('/api/events/:id/registrations', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const registrations = await allQuery(`
      SELECT r.*, u.name as user_name, u.email as user_email, u.cpf as user_cpf 
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
      ORDER BY u.name ASC
    `, [req.params.id]);

    res.json(registrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar inscrições' });
  }
});

// Exportar Inscritos em CSV (Admin)
app.get('/api/events/:id/registrations/export', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const registrations = await allQuery(`
      SELECT r.*, u.name as user_name, u.email as user_email, u.cpf as user_cpf 
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
      ORDER BY u.name ASC
    `, [req.params.id]);

    const event = await getQuery('SELECT name FROM events WHERE id = ?', [req.params.id]);
    const eventName = event ? event.name : 'Evento';

    // Format headers and rows
    // To support Excel UTF-8 in Portuguese, we include BOM \uFEFF
    let csvContent = '\uFEFF';
    csvContent += 'Nome,Email,CPF,Categoria,Status de Check-in,Data de Entrada,Data de Inscrição\n';

    registrations.forEach(r => {
      const checkedInStatus = r.checked_in ? 'Presente' : 'Faltando';
      const checkinDate = r.checked_in_at ? new Date(r.checked_in_at).toLocaleString('pt-BR') : '';
      const createdDate = new Date(r.created_at).toLocaleString('pt-BR');
      
      // Escape commas and double quotes for CSV safety
      const escape = (text) => `"${(text || '').replace(/"/g, '""')}"`;

      csvContent += `${escape(r.user_name)},${escape(r.user_email)},${escape(r.user_cpf)},${escape(r.category)},${escape(checkedInStatus)},${escape(checkinDate)},${escape(createdDate)}\n`;
    });

    // Set headers
    const safeName = eventName.toLowerCase().replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=lista_presenca_${safeName}.csv`);
    res.send(csvContent);
  } catch (err) {
    console.error('Erro ao exportar CSV:', err);
    res.status(500).json({ error: 'Erro ao exportar lista de presença' });
  }
});

// Listar Inscrições do Usuário Logado
app.get('/api/registrations/my-events', authenticateToken, async (req, res) => {
  try {
    const myRegistrations = await allQuery(`
      SELECT r.*, e.name as event_name, e.slug as event_slug, e.start_date, e.end_date, e.type, e.transmission_link
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = ?
      ORDER BY e.start_date DESC
    `, [req.user.id]);

    res.json(myRegistrations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar suas inscrições' });
  }
});

// Realizar Check-in (Admin)
app.post('/api/registrations/:id/checkin', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { status } = req.body; // status: 1 (checked-in) ou 0 (remover check-in)
  const checkedIn = status === undefined ? 1 : parseInt(status);
  const checkedInAt = checkedIn ? new Date().toISOString() : null;

  try {
    await runQuery(`
      UPDATE registrations 
      SET checked_in = ?, checked_in_at = ?
      WHERE id = ?
    `, [checkedIn, checkedInAt, req.params.id]);

    res.json({ message: checkedIn ? 'Credenciamento realizado com sucesso!' : 'Presença removida com sucesso!', checked_in: checkedIn });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao realizar check-in' });
  }
});

// Download do Comprovante de Inscrição em PDF (Autenticado)
app.get('/api/registrations/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const reg = await getQuery(`
      SELECT r.*, u.name as user_name, u.email as user_email, u.cpf as user_cpf,
             e.name as event_name, e.start_date as event_start, e.end_date as event_end, e.type as event_type
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      WHERE r.id = ?
    `, [req.params.id]);

    if (!reg) {
      return res.status(404).json({ error: 'Inscrição não encontrada' });
    }

    // Verify ownership (only the registered user or an admin can access)
    if (reg.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: você não é o proprietário desta inscrição' });
    }

    // Generate QR Code as a Buffer
    const qrBuffer = await QRCode.toBuffer(reg.id, {
      margin: 1,
      width: 150,
      errorCorrectionLevel: 'M'
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=comprovante-${reg.id}.pdf`);

    // Create PDF document
    const doc = new PDFDocument({ layout: 'portrait', size: 'A4', margin: 40 });
    doc.pipe(res);

    // Styling properties
    const primaryColor = '#1A365D'; // Navy blue G-TERCOA
    const secondaryColor = '#D69E2E'; // Gold accent
    const darkGray = '#2D3748';
    const lightGray = '#718096';
    const bgFillColor = '#F8FAFC';
    const borderColor = '#E2E8F0';

    // 1. Draw header borders and styling
    doc.rect(40, 40, 515, 8).fill(primaryColor);
    doc.rect(40, 48, 515, 3).fill(secondaryColor);

    // 2. Logo & Institutional Header
    doc.fillColor(primaryColor)
       .font('Helvetica-Bold')
       .fontSize(24)
       .text('G-TERCOA', 40, 70);

    doc.fillColor(lightGray)
       .font('Helvetica')
       .fontSize(9)
       .text('Grupo de Estudos e Pesquisa - Educação Matemática e Pedagogia', 40, 98);

    doc.fillColor(primaryColor)
       .font('Helvetica-Bold')
       .fontSize(18)
       .text('COMPROVANTE DE INSCRIÇÃO', 40, 130);

    // Separator line
    doc.moveTo(40, 160).lineTo(555, 160).lineWidth(1).stroke(borderColor);

    // Helper function to draw info card
    const drawCard = (title, x, y, width, height) => {
      doc.rect(x, y, width, height).fillAndStroke(bgFillColor, borderColor);
      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(11)
         .text(title, x + 15, y + 12);
    };

    // Helper for key-value styling in cards
    const drawInfoLine = (label, value, x, y, width) => {
      doc.fillColor(lightGray).font('Helvetica').fontSize(9.5).text(label, x, y);
      doc.fillColor(darkGray).font('Helvetica-Bold').fontSize(9.5).text(value, x + 100, y, { width: width - 110 });
    };

    // 3. Card: Dados do Participante
    drawCard('DADOS DO PARTICIPANTE', 40, 175, 515, 80);
    drawInfoLine('Nome:', reg.user_name, 55, 205, 485);
    drawInfoLine('CPF:', reg.user_cpf, 55, 222, 485);
    drawInfoLine('E-mail:', reg.user_email, 55, 239, 485);

    // 4. Card: Dados do Evento
    const startObj = new Date(reg.event_start);
    const endObj = new Date(reg.event_end);
    const formatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const dateRange = startObj.getTime() === endObj.getTime()
      ? startObj.toLocaleDateString('pt-BR', formatOptions)
      : `${startObj.toLocaleDateString('pt-BR', formatOptions)} a ${endObj.toLocaleDateString('pt-BR', formatOptions)}`;

    const getFormatName = (type) => {
      const formats = {
        'school_of_summer': 'Escola de Verão',
        'dima': 'DIMA (Diálogos Matemática & Pedagogia)',
        'live_cycle': 'Ciclo de Lives',
        'workshop': 'Workshop'
      };
      return formats[type] || 'Evento';
    };

    drawCard('DADOS DO EVENTO', 40, 270, 515, 80);
    drawInfoLine('Evento:', reg.event_name, 55, 300, 485);
    drawInfoLine('Formato:', getFormatName(reg.event_type), 55, 317, 485);
    drawInfoLine('Período:', dateRange, 55, 334, 485);

    // 5. Card: Detalhes da Inscrição
    const regDate = new Date(reg.created_at).toLocaleString('pt-BR');
    drawCard('DETALHES DA INSCRIÇÃO', 40, 365, 515, 80);
    drawInfoLine('Categoria:', reg.category, 55, 395, 485);
    drawInfoLine('Inscrição em:', regDate, 55, 412, 485);
    drawInfoLine('Código ID:', reg.id, 55, 429, 485);

    // 6. QR Code Credenciamento Section
    const qrCardY = 460;
    doc.rect(177, qrCardY, 240, 230).lineWidth(1).stroke(borderColor);
    doc.fillColor(primaryColor)
       .font('Helvetica-Bold')
       .fontSize(11)
       .text('QR CODE DE CREDENCIAMENTO', 177, qrCardY + 15, { align: 'center', width: 240 });

    // Embed QR Code
    doc.image(qrBuffer, 222, qrCardY + 40, { width: 150 });

    doc.fillColor(darkGray)
       .font('Helvetica-Oblique')
       .fontSize(8.5)
       .text('Apresente este QR Code no credenciamento do evento para confirmar sua presença.', 192, qrCardY + 198, { align: 'center', width: 210 });

    // Footer Info
    doc.moveTo(40, 770).lineTo(555, 770).lineWidth(0.5).stroke('#CBD5E1');
    doc.fillColor(lightGray)
       .font('Helvetica')
       .fontSize(8.5)
       .text('Este documento confirma sua inscrição oficial na plataforma de eventos acadêmicos G-TERCOA.', 40, 785, { align: 'center', width: 515 });

    doc.end();
  } catch (err) {
    console.error('Erro ao gerar comprovante em PDF:', err);
    res.status(500).json({ error: 'Erro interno ao gerar comprovante de inscrição' });
  }
});


// ==========================================
// 4. SUBMISSÃO DE TRABALHOS
// ==========================================

// Enviar Submissão (Participante/Autor)
app.post('/api/events/:id/submissions', authenticateToken, upload.single('file'), async (req, res) => {
  const { title, authors, affiliation, thematic_axis } = req.body;
  const eventId = req.params.id;
  const userId = req.user.id;

  if (!title || !authors || !affiliation || !thematic_axis) {
    return res.status(400).json({ error: 'Todos os campos estruturados são obrigatórios' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'O arquivo do trabalho (PDF/Word) é obrigatório' });
  }

  try {
    const submissionId = crypto.randomUUID();
    await runQuery(`
      INSERT INTO submissions (id, event_id, user_id, title, authors, affiliation, thematic_axis, file_path, file_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'under_review', ?)
    `, [
      submissionId,
      eventId,
      userId,
      title,
      authors,
      affiliation,
      thematic_axis,
      `/uploads/${req.file.filename}`,
      req.file.originalname,
      new Date().toISOString()
    ]);

    res.status(201).json({ message: 'Trabalho submetido com sucesso para avaliação!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao submeter trabalho' });
  }
});

// Listar Trabalhos de um Evento (Admin)
app.get('/api/events/:id/submissions', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const submissions = await allQuery(`
      SELECT s.*, u.name as submitter_name, u.email as submitter_email, rev.name as reviewer_name
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN users rev ON s.reviewer_id = rev.id
      WHERE s.event_id = ?
      ORDER BY s.created_at DESC
    `, [req.params.id]);

    res.json(submissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao listar submissões' });
  }
});

// Listar Trabalhos atribuídos ao Avaliador Logado
app.get('/api/submissions/to-review', authenticateToken, requireRole(['evaluator']), async (req, res) => {
  try {
    const toReview = await allQuery(`
      SELECT s.*, e.name as event_name, u.name as submitter_name
      FROM submissions s
      JOIN events e ON s.event_id = e.id
      JOIN users u ON s.user_id = u.id
      WHERE s.reviewer_id = ?
      ORDER BY s.created_at DESC
    `, [req.user.id]);

    res.json(toReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar trabalhos designados' });
  }
});

// Listar Trabalhos do próprio Participante Logado
app.get('/api/submissions/my-submissions', authenticateToken, async (req, res) => {
  try {
    const mySubmissions = await allQuery(`
      SELECT s.*, e.name as event_name, e.slug as event_slug
      FROM submissions s
      JOIN events e ON s.event_id = e.id
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `, [req.user.id]);

    res.json(mySubmissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar suas submissões' });
  }
});

// Alocar Avaliador a uma Submissão (Admin)
app.post('/api/submissions/:id/assign', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { reviewer_id } = req.body;

  if (!reviewer_id) {
    return res.status(400).json({ error: 'Selecione um avaliador' });
  }

  try {
    await runQuery('UPDATE submissions SET reviewer_id = ? WHERE id = ?', [reviewer_id, req.params.id]);
    res.json({ message: 'Avaliador alocado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao alocar avaliador' });
  }
});

// Emitir Parecer (Avaliador)
app.post('/api/submissions/:id/review', authenticateToken, requireRole(['evaluator']), async (req, res) => {
  const { status, review_comments } = req.body;

  if (!status || !['accepted', 'accepted_with_remarks', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Selecione um status de avaliação válido' });
  }

  try {
    // Verify the submission is indeed allocated to this evaluator
    const sub = await getQuery('SELECT reviewer_id FROM submissions WHERE id = ?', [req.params.id]);
    if (!sub || sub.reviewer_id !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado: você não é o avaliador designado para este trabalho' });
    }

    await runQuery(`
      UPDATE submissions 
      SET status = ?, review_comments = ?
      WHERE id = ?
    `, [status, review_comments || '', req.params.id]);

    res.json({ message: 'Parecer enviado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar parecer' });
  }
});


// ==========================================
// 5. CERTIFICADOS
// ==========================================

// Listar Certificados do Usuário Logado
app.get('/api/certificates/user', authenticateToken, async (req, res) => {
  try {
    const certs = await allQuery(`
      SELECT c.*, e.name as event_name, e.slug as event_slug, e.start_date, e.end_date, u.name as user_name
      FROM certificates c
      JOIN events e ON c.event_id = e.id
      JOIN users u ON c.user_id = u.id
      WHERE c.user_id = ?
    `, [req.user.id]);

    res.json(certs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar certificados' });
  }
});

// Emitir Certificados para os Credenciados do Evento (Admin)
app.post('/api/events/:id/certificates/generate', authenticateToken, requireRole(['admin']), async (req, res) => {
  const eventId = req.params.id;

  try {
    // 1. Get event details
    const event = await getQuery('SELECT name, workload_hours FROM events WHERE id = ?', [eventId]);
    if (!event) return res.status(404).json({ error: 'Evento não encontrado' });

    // 2. Find all checked-in registrations that do NOT have certificates generated yet
    const checkedInNoCert = await allQuery(`
      SELECT r.user_id 
      FROM registrations r
      LEFT JOIN certificates c ON r.event_id = c.event_id AND r.user_id = c.user_id
      WHERE r.event_id = ? AND r.checked_in = 1 AND c.id IS NULL
    `, [eventId]);

    let generatedCount = 0;
    for (const reg of checkedInNoCert) {
      const code = `GTERCOA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const certId = crypto.randomUUID();
      await runQuery(`
        INSERT INTO certificates (id, event_id, user_id, verification_code, workload_hours, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [certId, eventId, reg.user_id, code, event.workload_hours, new Date().toISOString()]);
      generatedCount++;
    }

    res.json({ message: `Certificados gerados com sucesso para ${generatedCount} participantes.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar certificados' });
  }
});

// Emitir Certificado Individual/Customizado (Admin)
app.post('/api/events/:id/certificates/issue', authenticateToken, requireRole(['admin']), async (req, res) => {
  const eventId = req.params.id;
  const { user_email, type, workload_hours, presentation_title } = req.body;

  if (!user_email || !type) {
    return res.status(400).json({ error: 'E-mail do usuário e tipo do certificado são obrigatórios' });
  }

  const selectedType = ['participation', 'organization', 'presentation', 'guest'].includes(type) ? type : 'participation';

  try {
    // 1. Get user details
    const user = await getQuery('SELECT id FROM users WHERE email = ?', [user_email.trim()]);
    if (!user) return res.status(404).json({ error: 'Usuário não cadastrado com este e-mail' });

    // 2. Check if a certificate of this type already exists for this event and user
    const existing = await getQuery('SELECT id FROM certificates WHERE event_id = ? AND user_id = ? AND type = ?', [eventId, user.id, selectedType]);
    if (existing) {
      return res.status(400).json({ error: `Este usuário já possui um certificado de ${selectedType} emitido para este evento.` });
    }

    // 3. Issue certificate
    const code = `GTERCOA-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const certId = crypto.randomUUID();
    await runQuery(`
      INSERT INTO certificates (id, event_id, user_id, verification_code, workload_hours, type, presentation_title, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      certId, 
      eventId, 
      user.id, 
      code, 
      parseInt(workload_hours) || 20, 
      selectedType, 
      presentation_title || null, 
      new Date().toISOString()
    ]);

    res.status(201).json({ message: 'Certificado emitido com sucesso!', certificateId: certId, code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao emitir certificado' });
  }
});

// Listar todos os certificados emitidos de um Evento (Admin)
app.get('/api/events/:id/certificates', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const certs = await allQuery(`
      SELECT c.*, u.name as user_name, u.email as user_email
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      WHERE c.event_id = ?
      ORDER BY c.created_at DESC
    `, [req.params.id]);
    res.json(certs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar lista de certificados' });
  }
});

// Validar código de autenticidade (Público)
app.get('/api/certificates/verify/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const cert = await getQuery(`
      SELECT c.verification_code, c.workload_hours, c.created_at as issue_date,
             u.name as user_name, u.cpf as user_cpf,
             e.name as event_name, e.start_date, e.end_date
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN events e ON c.event_id = e.id
      WHERE c.verification_code = ?
    `, [code]);

    if (!cert) {
      return res.status(404).json({ error: 'Código de verificação inválido ou certificado inexistente' });
    }

    res.json(cert);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao validar código' });
  }
});

// Download do PDF do Certificado (Autenticado)
app.get('/api/certificates/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const cert = await getQuery(`
      SELECT c.verification_code, c.workload_hours, c.type as cert_type, c.presentation_title,
             u.name as user_name, u.cpf as user_cpf,
             e.name as event_name, e.start_date, e.end_date, e.type as event_type,
             e.cert_border_color, e.cert_signature_name, e.cert_signature_role, e.cert_text_template,
             e.cert_text_organization, e.cert_text_presentation, e.cert_text_guest,
             c.user_id as cert_user_id
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN events e ON c.event_id = e.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!cert) {
      return res.status(404).json({ error: 'Certificado não encontrado' });
    }

    // Access control: only owner or admin can view
    if (cert.cert_user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: você não tem permissão para visualizar este certificado' });
    }

    // Set response headers for inline browser preview
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=certificado-${cert.verification_code}.pdf`);

    // Generate PDF document in-memory and pipe to response
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0 });
    doc.pipe(res);

    // Styling properties
    const primaryColor = cert.cert_border_color || '#1A365D'; // Custom border / primary theme color
    const secondaryColor = '#D69E2E'; // Gold accents

    // 1. Draw elegant double borders
    doc.rect(20, 20, 802, 555).lineWidth(3).stroke(primaryColor);
    doc.rect(26, 26, 790, 543).lineWidth(1).stroke(secondaryColor);

    // 2. Dynamic event type logo / header text
    doc.fillColor(primaryColor)
       .font('Helvetica-Bold')
       .fontSize(28)
       .text('G-TERCOA', 0, 70, { align: 'center' });

    doc.fillColor('#4A5568')
       .font('Helvetica')
       .fontSize(12)
       .text('Grupo de Estudos e Pesquisa - Educação Matemática e Pedagogia', 0, 105, { align: 'center' });

    // Golden divisor line
    doc.moveTo(250, 125).lineTo(592, 125).lineWidth(1.5).stroke(secondaryColor);

    // Main Certificate title
    doc.fillColor(primaryColor)
       .font('Helvetica-Bold')
       .fontSize(36)
       .text('CERTIFICADO', 0, 150, { align: 'center' });

    // Body Text
    const startObj = new Date(cert.start_date);
    const endObj = new Date(cert.end_date);
    const formatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    const dateRange = startObj.getTime() === endObj.getTime()
      ? `no dia ${startObj.toLocaleDateString('pt-BR', formatOptions)}`
      : `no período de ${startObj.toLocaleDateString('pt-BR', formatOptions)} a ${endObj.toLocaleDateString('pt-BR', formatOptions)}`;

    let template = '';
    const certType = cert.cert_type || 'participation';

    if (certType === 'organization') {
      template = cert.cert_text_organization || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou da Comissão Organizadora do evento acadêmico {evento}, realizado {periodo}, com carga horária total de {carga_horaria} horas.';
    } else if (certType === 'presentation') {
      template = cert.cert_text_presentation || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, apresentou o trabalho intitulado "{titulo_trabalho}" no evento acadêmico {evento}, realizado {periodo}, com carga horária de {carga_horaria} horas.';
    } else if (certType === 'guest') {
      template = cert.cert_text_guest || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou como convidado(a)/palestrante especial no evento acadêmico {evento}, realizado {periodo}, ministrando atividades com carga horária de {carga_horaria} horas.';
    } else {
      template = cert.cert_text_template || 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou ativamente do evento acadêmico {evento}, realizado {periodo}, cumprindo carga horária total de {carga_horaria} horas.';
    }

    const customText = template
      .replace(/{nome}/g, cert.user_name)
      .replace(/{cpf}/g, cert.user_cpf)
      .replace(/{evento}/g, cert.event_name)
      .replace(/{periodo}/g, dateRange)
      .replace(/{carga_horaria}/g, cert.workload_hours)
      .replace(/{titulo_trabalho}/g, cert.presentation_title || 'N/A');

    const defaultTemplate = 'Certificamos para os devidos fins que {nome}, inscrito(a) sob o CPF nº {cpf}, participou ativamente do evento acadêmico {evento}, realizado {periodo}, cumprindo carga horária total de {carga_horaria} horas.';
    const isDefault = certType === 'participation' && (!cert.cert_text_template || cert.cert_text_template.trim() === '' || cert.cert_text_template.trim() === defaultTemplate);

    if (isDefault) {
      // Elegant structured layout
      doc.fillColor('#2D3748')
         .font('Helvetica')
         .fontSize(16)
         .text('Certificamos para os devidos fins que', 50, 230, { align: 'center', width: 742 });

      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .fontSize(22)
         .text(cert.user_name, 50, 265, { align: 'center', width: 742 });

      doc.fillColor('#2D3748')
         .font('Helvetica')
         .fontSize(16)
         .text(`inscrito(a) sob o CPF nº ${cert.user_cpf}, participou ativamente do evento acadêmico `, 50, 305, { align: 'center', width: 742 });

      doc.fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text(cert.event_name, 50, 335, { align: 'center', width: 742 });

      doc.fillColor('#2D3748')
         .font('Helvetica')
         .fontSize(16)
         .text(`realizado ${dateRange}, cumprindo carga horária total de `, 50, 365, { align: 'center', width: 742 });

      doc.fillColor(secondaryColor)
         .font('Helvetica-Bold')
         .text(`${cert.workload_hours} horas.`, 50, 395, { align: 'center', width: 742 });
    } else {
      // Dynamic paragraph layout
      doc.fillColor('#2D3748')
         .font('Helvetica')
         .fontSize(16)
         .text(customText, 60, 230, { align: 'center', width: 722, lineGap: 8 });
    }

    // Footer signatures and validation metadata
    const validationDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.fillColor('#4A5568')
       .font('Helvetica-Oblique')
       .fontSize(12)
       .text(`Fortaleza, ${validationDate}.`, 0, 440, { align: 'center' });

    // Signature Line
    doc.moveTo(321, 505).lineTo(521, 505).lineWidth(1).stroke('#A0AEC0');
    doc.fillColor('#2D3748')
       .font('Helvetica-Bold')
       .fontSize(10)
       .text(cert.cert_signature_name || 'Comissão Organizadora G-TERCOA', 0, 510, { align: 'center' });
    doc.fillColor('#4A5568')
       .font('Helvetica')
       .fontSize(9)
       .text(cert.cert_signature_role || 'Coordenador Geral', 0, 523, { align: 'center' });

    // Authenticity Box (Bottom Left)
    doc.rect(40, 500, 260, 45).lineWidth(1).stroke('#E2E8F0');
    doc.fillColor('#718096')
       .font('Helvetica')
       .fontSize(8)
       .text('Código de Autenticação:', 48, 505)
       .font('Helvetica-Bold')
       .fillColor(primaryColor)
       .text(cert.verification_code, 48, 517)
       .font('Helvetica')
       .fillColor('#718096')
       .text('Verifique a autenticidade deste documento no portal.', 48, 530);

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar o arquivo PDF' });
  }
});

// ==========================================
// 6. ATIVIDADES E PROGRAMAÇÃO
// ==========================================

// Listar Atividades de um Evento (Público)
app.get('/api/events/:id/activities', async (req, res) => {
  try {
    const activities = await allQuery('SELECT * FROM activities WHERE event_id = ? ORDER BY start_time ASC', [req.params.id]);
    const parsedActivities = activities.map(act => ({
      ...act,
      guests: JSON.parse(act.guests || '[]')
    }));
    res.json(parsedActivities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar atividades do evento' });
  }
});

// Cadastrar Atividade (Admin)
app.post('/api/events/:id/activities', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { title, type, start_time, end_time, location, description, guests } = req.body;

  if (!title || !type || !start_time || !end_time) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  try {
    const actId = crypto.randomUUID();
    await runQuery(`
      INSERT INTO activities (id, event_id, title, type, start_time, end_time, location, description, guests, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      actId,
      req.params.id,
      title,
      type,
      start_time,
      end_time,
      location || '',
      description || '',
      JSON.stringify(guests || []),
      new Date().toISOString()
    ]);

    res.status(201).json({ message: 'Atividade criada com sucesso!', activityId: actId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar atividade' });
  }
});

// Editar Atividade (Admin)
app.put('/api/activities/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { title, type, start_time, end_time, location, description, guests } = req.body;

  if (!title || !type || !start_time || !end_time) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
  }

  try {
    await runQuery(`
      UPDATE activities 
      SET title = ?, type = ?, start_time = ?, end_time = ?, location = ?, description = ?, guests = ?
      WHERE id = ?
    `, [
      title,
      type,
      start_time,
      end_time,
      location || '',
      description || '',
      JSON.stringify(guests || []),
      req.params.id
    ]);

    res.json({ message: 'Atividade atualizada com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar atividade' });
  }
});

// Remover Atividade (Admin)
app.delete('/api/activities/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    await runQuery('DELETE FROM activities WHERE id = ?', [req.params.id]);
    res.json({ message: 'Atividade excluída com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir atividade' });
  }
});

// Run server
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
