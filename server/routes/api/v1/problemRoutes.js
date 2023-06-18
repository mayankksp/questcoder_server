const express = require('express');

const problemControllers = require('../../../controllers/api/v1/problemControllers');

const router = express.Router();

router.get('/', problemControllers.getAllProblems);
router.get('/search-term-info', problemControllers.getSearchTermInfo);

module.exports = router;