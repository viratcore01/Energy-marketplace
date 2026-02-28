const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM producers ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const {
    name,
    type,
    city,
    center_id,
    price_per_unit,
    units_available,
    earnings
  } = req.body;

  if (!name || !type || !city || !center_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const record = {
    id: uuidv4(),
    name,
    type,
    city,
    center_id,
    price_per_unit: Number(price_per_unit ?? 0),
    units_available: Number(units_available ?? 0),
    earnings: Number(earnings ?? 0),
    created_at: new Date().toISOString()
  };

  db.prepare(
    `INSERT INTO producers (
      id, name, type, city, center_id,
      price_per_unit, units_available, earnings, created_at
    ) VALUES (
      @id, @name, @type, @city, @center_id,
      @price_per_unit, @units_available, @earnings, @created_at
    )`
  ).run(record);

  return res.status(201).json(record);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM producers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Producer not found' });
  }

  const updated = {
    id,
    type: req.body.type ?? existing.type,
    city: req.body.city ?? existing.city,
    center_id: req.body.center_id ?? existing.center_id,
    price_per_unit: req.body.price_per_unit !== undefined ? Number(req.body.price_per_unit) : existing.price_per_unit,
    units_available: req.body.units_available !== undefined ? Number(req.body.units_available) : existing.units_available,
    earnings: req.body.earnings !== undefined ? Number(req.body.earnings) : existing.earnings
  };

  db.prepare(
    `UPDATE producers
     SET type = @type,
         city = @city,
         center_id = @center_id,
         price_per_unit = @price_per_unit,
         units_available = @units_available,
         earnings = @earnings
     WHERE id = @id`
  ).run(updated);

  const row = db.prepare('SELECT * FROM producers WHERE id = ?').get(id);
  return res.json(row);
});

module.exports = router;