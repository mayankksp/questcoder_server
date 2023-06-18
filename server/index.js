const express = require('express');
const cors = require('cors');
const Problem = require('./models/problem');
const db = require('./config/mongoose');

const app = express();
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", '*'); // or '*' for any origin
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });
  
app.use(express.json());

app.get('/', (req, res) => res.send('Server is running!'));
app.use('/', require('./routes'));

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});