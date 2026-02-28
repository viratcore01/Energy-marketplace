const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM consumers ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const {
    name,
    type,
    city,
    address,
    center_id,
    price_per_unit,
    monthly_usage,
    monthly_bill,
    connection_cost
  } = req.body;

  if (!name || !type || !city || !address || !center_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const record = {
    id: uuidv4(),
    name,
    type,
    city,
    address,
    center_id,
    price_per_unit: Number(price_per_unit ?? 0),
    monthly_usage: Number(monthly_usage ?? 0),
    monthly_bill: Number(monthly_bill ?? 0),
    connection_cost: Number(connection_cost ?? 0),
    created_at: new Date().toISOString()
  };

  db.prepare(
    `INSERT INTO consumers (
      id, name, type, city, address, center_id,
      price_per_unit, monthly_usage, monthly_bill, connection_cost, created_at
    ) VALUES (
      @id, @name, @type, @city, @address, @center_id,
      @price_per_unit, @monthly_usage, @monthly_bill, @connection_cost, @created_at
    )`
  ).run(record);

  return res.status(201).json(record);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { monthly_usage, monthly_bill } = req.body;

  const existing = db.prepare('SELECT * FROM consumers WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Consumer not found' });
  }

  const updated = {
    monthly_usage: monthly_usage !== undefined ? Number(monthly_usage) : existing.monthly_usage,
    monthly_bill: monthly_bill !== undefined ? Number(monthly_bill) : existing.monthly_bill,
    id
  };

  db.prepare(
    'UPDATE consumers SET monthly_usage = @monthly_usage, monthly_bill = @monthly_bill WHERE id = @id'
  ).run(updated);

  const row = db.prepare('SELECT * FROM consumers WHERE id = ?').get(id);
  return res.json(row);
});

module.exports = router;