const questionModel = require('../models/questionModel');

// Fetch questions by section ID
exports.getQuestionsBySectionID = async (req, res) => {
  const { sectionID } = req.params;
  try {
      const questions = await questionModel.fetchQuestionsBySectionID(sectionID);
      if (questions.length === 0) {
          return res.status(404).send('No questions found for the given section.');
      }
      res.json(questions);
  } catch (err) {
      console.error('Failed to fetch questions by section:', err);
      res.status(500).send('Failed to fetch questions by section.');
  }
};

exports.getQuestionDetailsByID = async (req, res) => {
  const { questionID } = req.params;
  if (isNaN(questionID)) {
    return res.status(400).json({ error: 'Invalid question ID' });
}
  try {
      const questionDetails = await questionModel.fetchQuestionDetailsByID(questionID);
      if (!questionDetails || questionDetails.length === 0) {
          return res.status(404).send('No question details found.');
      }
      res.json(questionDetails);
  } catch (err) {
      console.error('Failed to fetch question details:', err);
      res.status(500).send('Failed to fetch question details.');
  }
};

exports.getCorrectOrderDetailsByID = async (req, res) => {
  const { questionID } = req.params;
  try {
      const correctOrderDetails = await questionModel.fetchCorrectOrderDetails(questionID);
      if (!correctOrderDetails || correctOrderDetails.length === 0) {
          return res.status(404).send('No correct order details found.');
      }
      res.json(correctOrderDetails);
  } catch (err) {
      console.error('Failed to fetch correct order details:', err);
      res.status(500).send('Failed to fetch correct order details.');
  }
};


exports.getFeedbackByQuestionID = async (req, res) => {
  const { questionID } = req.params;
  try {
      const feedback = await questionModel.fetchFeedbackByQuestionID(questionID);
      if (!feedback || feedback.length === 0) {
          return res.status(404).send('No feedback found for the given question.');
      }
      res.json(feedback);
  } catch (err) {
      console.error('Failed to fetch feedback details:', err);
      res.status(500).send('Failed to fetch feedback details.');
  }
};
