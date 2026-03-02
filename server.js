const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/hunts', require('./routes/hunts'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hunt Tracker running at http://localhost:${PORT}`);
});
