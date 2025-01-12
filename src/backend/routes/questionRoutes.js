const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');


//new implementation
router.get('/section/:sectionID', questionController.getQuestionsBySectionID);
router.get('/:questionID', questionController.getQuestionDetailsByID);
router.get('/correct-order/:questionID', questionController.getCorrectOrderDetailsByID);
router.get('/feedback/:questionID', questionController.getFeedbackByQuestionID);

module.exports = router;


