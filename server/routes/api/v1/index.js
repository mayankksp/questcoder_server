const express = require('express');

const router = express.Router();

router.use('/problems', require('./problemRoutes'));

module.exports = router;