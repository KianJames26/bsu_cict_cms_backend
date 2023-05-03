const mysql = require("mysql2");
//* Database Pool
const pool = mysql.createPool({
	connectionLimit: 10,
	host: process.env.DB_HOST,
	port: process.env.DB_HOST_PORT,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

module.exports.checkOngoing = (req, res, next) => {
	const curriculumId = req.params.curriculumId;
	pool.query(
		"SELECT curriculum_status FROM curriculums WHERE curriculum_id = ?",
		[curriculumId],
		(error, result) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				const curriculumStatus = result[0].curriculum_status;
				if (curriculumStatus !== "ONGOING") {
					return res.status(409).json({
						message:
							"You can't edit or add subjects to this curriculum for it is already published or under revision",
					});
				} else {
					next();
				}
			}
		}
	);
};

module.exports.checkPublished = (req, res, next) => {
	const curriculumId = req.params.curriculumId;

	pool.query(
		"SELECT curriculum_status FROM curriculums WHERE curriculum_id = ?",
		[curriculumId],
		(error, result) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				const curriculumStatus = result[0].curriculum_status;
				if (curriculumStatus === "ONGOING") {
					return res.status(409).json({
						message:
							"Curriculum is still ongoing. You can't add comment for now.",
					});
				} else if (curriculumStatus === "APPROVED") {
					return res.status(409).json({
						message: "Curriculum is already approved. You can't add comment",
					});
				} else {
					next();
				}
			}
		}
	);
};
