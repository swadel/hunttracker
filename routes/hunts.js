const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/hunts — list all hunts with sightings
router.get('/', (req, res) => {
  const hunts = db.prepare('SELECT * FROM hunts ORDER BY date DESC').all();
  const sightings = db.prepare('SELECT * FROM animal_sightings').all();

  const result = hunts.map(hunt => ({
    ...hunt,
    sightings: sightings.filter(s => s.hunt_id === hunt.id),
  }));

  res.json(result);
});

// GET /api/hunts/:id — single hunt with sightings
router.get('/:id', (req, res) => {
  const hunt = db.prepare('SELECT * FROM hunts WHERE id = ?').get(req.params.id);
  if (!hunt) return res.status(404).json({ error: 'Hunt not found' });

  const sightings = db.prepare('SELECT * FROM animal_sightings WHERE hunt_id = ?').all(req.params.id);
  res.json({ ...hunt, sightings });
});

// POST /api/hunts — create a hunt
router.post('/', (req, res) => {
  const { date, location, temperature, weather, notes, sightings = [] } = req.body;

  if (!date || !location) {
    return res.status(400).json({ error: 'date and location are required' });
  }

  const insertHunt = db.prepare(
    'INSERT INTO hunts (date, location, temperature, weather, notes) VALUES (?, ?, ?, ?, ?)'
  );
  const insertSighting = db.prepare(
    'INSERT INTO animal_sightings (hunt_id, animal_type, count) VALUES (?, ?, ?)'
  );

  const createHunt = db.transaction(() => {
    const { lastInsertRowid } = insertHunt.run(date, location, temperature ?? null, weather ?? null, notes ?? null);
    for (const s of sightings) {
      if (s.animal_type && s.count > 0) {
        insertSighting.run(lastInsertRowid, s.animal_type, s.count);
      }
    }
    return lastInsertRowid;
  });

  const id = createHunt();
  const hunt = db.prepare('SELECT * FROM hunts WHERE id = ?').get(id);
  const savedSightings = db.prepare('SELECT * FROM animal_sightings WHERE hunt_id = ?').all(id);
  res.status(201).json({ ...hunt, sightings: savedSightings });
});

// PUT /api/hunts/:id — update a hunt and its sightings
router.put('/:id', (req, res) => {
  const { date, location, temperature, weather, notes, sightings = [] } = req.body;

  const existing = db.prepare('SELECT id FROM hunts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Hunt not found' });

  if (!date || !location) {
    return res.status(400).json({ error: 'date and location are required' });
  }

  const updateHunt = db.prepare(
    'UPDATE hunts SET date = ?, location = ?, temperature = ?, weather = ?, notes = ? WHERE id = ?'
  );
  const deleteSightings = db.prepare('DELETE FROM animal_sightings WHERE hunt_id = ?');
  const insertSighting = db.prepare(
    'INSERT INTO animal_sightings (hunt_id, animal_type, count) VALUES (?, ?, ?)'
  );

  const doUpdate = db.transaction(() => {
    updateHunt.run(date, location, temperature ?? null, weather ?? null, notes ?? null, req.params.id);
    deleteSightings.run(req.params.id);
    for (const s of sightings) {
      if (s.animal_type && s.count > 0) {
        insertSighting.run(req.params.id, s.animal_type, s.count);
      }
    }
  });

  doUpdate();
  const hunt = db.prepare('SELECT * FROM hunts WHERE id = ?').get(req.params.id);
  const savedSightings = db.prepare('SELECT * FROM animal_sightings WHERE hunt_id = ?').all(req.params.id);
  res.json({ ...hunt, sightings: savedSightings });
});

// DELETE /api/hunts/:id — delete hunt (sightings cascade)
router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM hunts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Hunt not found' });

  db.prepare('DELETE FROM hunts WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

module.exports = router;
