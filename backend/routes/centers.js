const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../db/database');

const router = express.Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM energy_centers ORDER BY id').all();
  res.json(rows);
});

router.post('/transfer', (req, res) => {
  const { from_center, to_center, amount } = req.body;
  const transferAmount = Number(amount);

  if (!from_center || !to_center || !Number.isFinite(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ error: 'Invalid transfer payload' });
  }

  if (from_center === to_center) {
    return res.status(400).json({ error: 'Source and destination centers must differ' });
  }

  const from = db.prepare('SELECT * FROM energy_centers WHERE id = ?').get(from_center);
  const to = db.prepare('SELECT * FROM energy_centers WHERE id = ?').get(to_center);

  if (!from || !to) {
    return res.status(404).json({ error: 'One or both centers not found' });
  }

  if (from.stored < transferAmount) {
    return res.status(400).json({ error: 'Insufficient stored energy in source center' });
  }

  const availableCapacity = to.capacity - to.stored;
  if (availableCapacity < transferAmount) {
    return res.status(400).json({ error: 'Destination center capacity is insufficient' });
  }

  const transfer = {
    id: uuidv4(),
    from_center,
    to_center,
    amount: transferAmount,
    created_at: new Date().toISOString()
  };

  const tx = db.transaction(() => {
    db.prepare('UPDATE energy_centers SET stored = stored - ? WHERE id = ?').run(transferAmount, from_center);
    db.prepare('UPDATE energy_centers SET stored = stored + ? WHERE id = ?').run(transferAmount, to_center);
    db.prepare(
      'INSERT INTO transfers (id, from_center, to_center, amount, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(transfer.id, transfer.from_center, transfer.to_center, transfer.amount, transfer.created_at);
  });

  tx();

  const updatedCenters = {
    from: db.prepare('SELECT * FROM energy_centers WHERE id = ?').get(from_center),
    to: db.prepare('SELECT * FROM energy_centers WHERE id = ?').get(to_center)
  };

  return res.status(201).json({ transfer, centers: updatedCenters });
});

router.get('/transfers', (req, res) => {
  const rows = db.prepare('SELECT * FROM transfers ORDER BY created_at DESC').all();
  res.json(rows);
});

module.exports = router;