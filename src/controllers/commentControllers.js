//* Package Imports
const mysql = require("mysql2");
const { v4: uuidv4 } = require("uuid");

//* Database Pool
const pool = mysql.createPool({
	connectionLimit: 10,
	host: process.env.DB_HOST,
	port: process.env.DB_HOST_PORT,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

//* Helper Functions
const getCurrentDateTime = () => {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const setErrorField = (field, errorMessage) => {
	return {
		field: field,
		errorMessage: errorMessage,
	};
};

module.exports.addCommentController = (req, res) => {
	const curriculumId = req.params.curriculumId;
	const authorId = res.locals.userId;
	const { comment } = req.body;
	const date = getCurrentDateTime();

	let id = uuidv4().replace(/-/g, "");

	let errors = [];

	if (!comment) {
		errors.push("comment", "Please Add Comment");
	}

	if (errors.length > 0) {
		return res.status(400).json(errors);
	} else {
		pool.query(
			"INSERT INTO comments (comment_id, curriculum_id, comment, date_created, author_id) VALUES (?, ?, ?, ?, ?)",
			[id, curriculumId, comment, date, authorId],
			(error, result) => {
				if (error) {
					return res.status(500).json(error);
				} else {
					return res
						.status(200)
						.json({ message: "Comment added successfully" });
				}
			}
		);
	}
};
module.exports.getCommentsController = (req, res) => {
	const curriculumId = req.params.curriculumId;

	pool.query(
		"SELECT * FROM comments WHERE curriculum_id = ?",
		[curriculumId],
		(error, results) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				return res.status(200).json(results);
			}
		}
	);
};
module.exports.getCommentController = (req, res) => {
	const curriculumId = req.params.curriculumId;
	const commentId = req.params.commentId;

	pool.query(
		"SELECT * FROM comments WHERE comment_id = ? AND curriculum_id = ?",
		[commentId, curriculumId],
		(error, result) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				return res.status(200).json(result);
			}
		}
	);
};
