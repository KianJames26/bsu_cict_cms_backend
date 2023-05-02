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

module.exports = (req, res, next) => {
	const curriculumId = req.params.curriculumId;
	pool.query(
		"SELECT curriculum_status FROM curriculums WHERE curriculum_id = ?",
		[curriculumId],
		(error, result) => {
			if (error) {
				console.log(error);
				return res.status(500).json({ error: "Internal Server Error" });
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
