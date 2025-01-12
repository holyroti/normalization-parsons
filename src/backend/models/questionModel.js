const oracledb = require('oracledb');
const dbConfig = require('../config/dbConfig');

async function fetchQuestionsBySectionID(sectionID) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT question_id, question, hints, html_content 
             FROM parsons.questions 
             WHERE section_id = :sectionID
             ORDER BY question_id ASC `,
            [sectionID],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        console.log(`Questions fetched for sectionID ${sectionID}:`, result.rows.length);
        return result.rows;
    } catch (err) {
        console.error('Error fetching questions by section:', err);
        throw err;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function fetchQuestionDetailsByID(questionID) {
    let connection;
    if (isNaN(questionID)) {
        throw new Error(`Invalid questionID: ${questionID}`);
    }
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT q.question_id, q.question, q.hints, q.html_content, cl.code_line_id, cl.text AS code_line_text
             FROM parsons.questions q
             JOIN parsons.code_lines cl ON q.question_id = cl.question_id
             WHERE q.question_id = :questionID`,
            [Number(questionID)], // Ensure the questionID is cast to a number
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return result.rows;
    } catch (err) {
        console.error('Error fetching question details:', err);
        throw err;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function fetchCorrectOrderDetails(questionID) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT cqo.code_line_id, cqo.explanation
             FROM parsons.correct_question_order cqo
             WHERE cqo.question_id = :questionID
             ORDER BY cqo.correct_question_order_id ASC`,
            [Number(questionID)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Map the results to include codeLineId and explanation
        return result.rows.map(row => ({
            codeLineId: row.CODE_LINE_ID,
            explanation: row.EXPLANATION
        }));
    } catch (err) {
        console.error('Error fetching correct order details:', err);
        throw err;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function fetchFeedbackByQuestionID(questionID) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT f.code_line_id, f.feedback_text
             FROM parsons.feedback f
             WHERE f.question_id = :questionID`,
            [Number(questionID)],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Map the results to an array of feedback objects
        return result.rows.map(row => ({
            codeLineId: row.CODE_LINE_ID,
            feedbackText: row.FEEDBACK_TEXT
        }));
    } catch (err) {
        console.error('Error fetching feedback details:', err);
        throw err;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}



module.exports = {
    fetchQuestionsBySectionID,
    fetchQuestionDetailsByID,
    fetchCorrectOrderDetails,
    fetchFeedbackByQuestionID
};
