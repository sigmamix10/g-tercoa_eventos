const assert = require('assert');
const { runQuery, getQuery, allQuery } = require('./db');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('--- Starting Relational Database Integration Tests ---');

  try {
    // Test 1: Verify Default Administrator was Seeded
    console.log('Test 1: Verifying default admin seed...');
    const admin = await getQuery('SELECT * FROM users WHERE email = ?', ['tercoa.monitoria@gmail.com']);
    assert.ok(admin, 'Admin should exist in the database');
    assert.strictEqual(admin.role, 'admin', 'Admin user should have admin role');
    assert.strictEqual(admin.cpf, '000.000.000-00', 'Admin user should have default CPF');
    
    // Verify password hash
    const isPasswordCorrect = await bcrypt.compare('G-tercoaufc@2024', admin.password_hash);
    assert.ok(isPasswordCorrect, 'Admin password hash should match password "G-tercoaufc@2024"');
    console.log('✓ Test 1 Passed: Default administrator exists and password hashes match.');

    // Test 2: Insert and Retrieve an Event (Event Builder simulation)
    console.log('Test 2: Simulating event creation (Event Builder)...');
    const testEventId = 'test-event-uuid-9999';
    await runQuery(`
      INSERT OR REPLACE INTO events (
        id, slug, name, type, description, banner_url, start_date, end_date,
        thematic_axes, registration_categories, submission_rules, workload_hours, transmission_link, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testEventId,
      'test-workshop-2026',
      'Workshop de Testes G-TERCOA',
      'workshop',
      'Um evento para validar a suite de testes.',
      'http://banner.url',
      '2026-06-25',
      '2026-06-27',
      JSON.stringify(['Eixo 1', 'Eixo 2']),
      JSON.stringify([{ name: 'Participante', price: 0 }]),
      'Formate segundo a ABNT.',
      24,
      'http://youtube.com/live',
      new Date().toISOString()
    ]);

    const event = await getQuery('SELECT * FROM events WHERE id = ?', [testEventId]);
    assert.ok(event, 'Event should be successfully created');
    assert.strictEqual(event.slug, 'test-workshop-2026');
    assert.strictEqual(event.workload_hours, 24);
    assert.deepStrictEqual(JSON.parse(event.thematic_axes), ['Eixo 1', 'Eixo 2']);
    console.log('✓ Test 2 Passed: Event created and retrieved successfully with parsed JSON fields.');

    // Test 3: Insert and Retrieve User Registration and Check-in
    console.log('Test 3: Simulating user registration and check-in...');
    const testUserId = 'test-user-participant-888';
    // Create participant user first
    await runQuery(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, cpf, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      testUserId,
      'Ana Silva',
      'ana@silva.com',
      'dummyhash',
      '123.456.789-00',
      'participant',
      new Date().toISOString()
    ]);

    // Register user to event
    const regId = 'test-reg-uuid-777';
    await runQuery(`
      INSERT OR REPLACE INTO registrations (id, event_id, user_id, category, checked_in, checked_in_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [regId, testEventId, testUserId, 'Participante', 0, null, new Date().toISOString()]);

    let reg = await getQuery('SELECT * FROM registrations WHERE id = ?', [regId]);
    assert.ok(reg, 'Registration should exist');
    assert.strictEqual(reg.checked_in, 0, 'Should start unchecked-in');

    // Trigger check-in
    await runQuery('UPDATE registrations SET checked_in = 1, checked_in_at = ? WHERE id = ?', [new Date().toISOString(), regId]);
    reg = await getQuery('SELECT * FROM registrations WHERE id = ?', [regId]);
    assert.strictEqual(reg.checked_in, 1, 'Should now be checked-in');
    console.log('✓ Test 3 Passed: Participant registration and check-in toggle tested successfully.');

    // Test 4: Work Submission & Review Assignment
    console.log('Test 4: Simulating submission and reviewer assignment...');
    const testSubId = 'test-sub-uuid-666';
    await runQuery(`
      INSERT OR REPLACE INTO submissions (id, event_id, user_id, title, authors, affiliation, thematic_axis, file_path, file_name, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testSubId,
      testEventId,
      testUserId,
      'Aritmética na Pedagogia',
      'Ana Silva, Roberto Souza',
      'UFC',
      'Eixo 1',
      '/uploads/test.pdf',
      'artigo.pdf',
      'under_review',
      new Date().toISOString()
    ]);

    let sub = await getQuery('SELECT * FROM submissions WHERE id = ?', [testSubId]);
    assert.ok(sub, 'Submission should exist');
    assert.strictEqual(sub.status, 'under_review', 'Should be under review by default');

    // Allocate reviewer
    const reviewerId = 'reviewer-dummy-uuid';
    await runQuery(`
      INSERT OR REPLACE INTO users (id, name, email, password_hash, cpf, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [reviewerId, 'Dr. Roberto', 'roberto@gtercoa.org', 'dummyhash2', '111.111.111-11', 'evaluator', new Date().toISOString()]);

    await runQuery('UPDATE submissions SET reviewer_id = ? WHERE id = ?', [reviewerId, testSubId]);
    sub = await getQuery('SELECT * FROM submissions WHERE id = ?', [testSubId]);
    assert.strictEqual(sub.reviewer_id, reviewerId, 'Reviewer should be assigned');

    // Submit review opinion
    await runQuery("UPDATE submissions SET status = 'accepted_with_remarks', review_comments = 'Corrigir as referências conforme NBR 6023' WHERE id = ?", [testSubId]);
    sub = await getQuery('SELECT * FROM submissions WHERE id = ?', [testSubId]);
    assert.strictEqual(sub.status, 'accepted_with_remarks');
    assert.ok(sub.review_comments.includes('NBR 6023'));
    console.log('✓ Test 4 Passed: Submission workflow, peer reviewer assignment, and comments update succeed.');

    // Test 5: Certificate Generation & Public Verification
    console.log('Test 5: Simulating certificate generation and validation...');
    const certId = 'test-cert-uuid-555';
    const verificationCode = 'GTERCOA-ABC1234';
    await runQuery(`
      INSERT OR REPLACE INTO certificates (id, event_id, user_id, verification_code, workload_hours, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [certId, testEventId, testUserId, verificationCode, 24, new Date().toISOString()]);

    const cert = await getQuery(`
      SELECT c.verification_code, c.workload_hours, u.name as user_name, e.name as event_name
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN events e ON c.event_id = e.id
      WHERE c.verification_code = ?
    `, [verificationCode]);

    assert.ok(cert, 'Certificate validation query should return a record');
    assert.strictEqual(cert.user_name, 'Ana Silva');
    assert.strictEqual(cert.event_name, 'Workshop de Testes G-TERCOA');
    assert.strictEqual(cert.workload_hours, 24);
    console.log('✓ Test 5 Passed: Certificate verification code cross-queries succeed.');

    // Test 6: Activity Creation and Guest Configuration
    console.log('Test 6: Simulating activity creation and guest configuration...');
    const testActivityId = 'test-activity-uuid-444';
    const mockGuests = [
      { name: 'Dr. Rogerio', role: 'palestrante', institution: 'UFC' },
      { name: 'Prof. Carlos', role: 'mediador', institution: 'UECE' }
    ];
    await runQuery(`
      INSERT OR REPLACE INTO activities (id, event_id, title, type, start_time, end_time, location, description, guests, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testActivityId,
      testEventId,
      'Palestra de Geometria',
      'palestra',
      '2026-06-25T14:00',
      '2026-06-25T16:00',
      'Auditório Principal',
      'Discussão sobre tópicos avançados de geometria espacial.',
      JSON.stringify(mockGuests),
      new Date().toISOString()
    ]);

    const activity = await getQuery('SELECT * FROM activities WHERE id = ?', [testActivityId]);
    assert.ok(activity, 'Activity should be successfully created');
    assert.strictEqual(activity.title, 'Palestra de Geometria');
    assert.strictEqual(activity.type, 'palestra');
    const parsedGuests = JSON.parse(activity.guests);
    assert.strictEqual(parsedGuests.length, 2);
    assert.strictEqual(parsedGuests[0].name, 'Dr. Rogerio');
    assert.strictEqual(parsedGuests[1].role, 'mediador');
    console.log('✓ Test 6 Passed: Activity and guest configuration parsed and verified successfully.');

    console.log('\n--- All Database Relational Schema Tests Passed Successfully! ---');
  } catch (err) {
    console.error('Test Suite Failed with error:', err);
    process.exit(1);
  }
}

runTests();
