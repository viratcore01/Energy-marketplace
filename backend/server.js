const express = require('express');
const cors = require('cors');
const { createTables, seedEnergyCentersIfEmpty } = require('./db/database');

const consumersRoutes = require('./routes/consumers');
const producersRoutes = require('./routes/producers');
const centersRoutes = require('./routes/centers');

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: 'http://localhost:5173'
  })
);
app.use(express.json());

createTables();
seedEnergyCentersIfEmpty();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/consumers', consumersRoutes);
app.use('/api/producers', producersRoutes);
app.use('/api/centers', centersRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});