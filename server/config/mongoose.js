const mongoose = require('mongoose');

// const MONGODB_URI = 'mongodb://localhost:27017/ProblemsDatabase';
const MONGODB_URI = 'mongodb+srv://mayankksp:Rnw%4008564@cluster0.lmp4ptj.mongodb.net/ProblemsDatabase?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;

db.on('error', (err) => {
    console.error("Error connecting to the database :: MongoDB");
});

db.once('open', () => {
    console.log("Connected to the database :: MongoDB");
});

module.exports = db;