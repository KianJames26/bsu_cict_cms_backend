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

module.exports.addSubjectController = (req, res) => {
	const {
		schoolYear,
		semester,
		subjectCode,
		lectureUnits,
		laboratoryUnits,
		hoursPerWeek,
		prerequisites,
		corequisites,
	} = req.body;

	const curriculumId = req.params.curriculumId;

	let prerequisiteId;
	let corequisiteId;

	let errors = [];

	if (prerequisites.length > 0) {
		prerequisiteId = uuidv4().replace(/-/g, "");
		for (const prereq of prerequisites) {
			pool.query(
				"INSERT INTO prerequisites(prerequisite_id, subject_code) VALUES(?, ?)",
				[prerequisiteId, prereq],
				(error, results) => {
					if (error) {
						console.log(error);
						errors.push(error.message);
					}
				}
			);
		}
	}
	if (corequisites.length > 0) {
		corequisiteId = uuidv4().replace(/-/g, "");
		for (const coreq of corequisites) {
			pool.query(
				"INSERT INTO corequisites(corequisite_id, subject_code) VALUES(?, ?)",
				[corequisiteId, coreq],
				(error, results) => {
					if (error) {
						console.log(error);
						errors.push(error.message);
					}
				}
			);
		}
	}
	if (errors.length > 0) {
		return res.status(500).json(errors);
	} else {
		pool.query(
			"INSERT INTO curriculum_subjects(curriculum_id, school_year, semester, subject_code, lecture_units, laboratory_units, hours_per_week, prerequisites, corequisites) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)",
			[
				curriculumId,
				schoolYear,
				semester,
				subjectCode,
				lectureUnits,
				laboratoryUnits,
				hoursPerWeek,
				prerequisiteId,
				corequisiteId,
			],
			(error, results) => {
				if (error) {
					console.log(error);
					return res.status(500).json(error);
				} else {
					return res
						.status(200)
						.json({ message: "Successfully Added subject" });
				}
			}
		);
	}
};
module.exports.removeSubjectController = (req, res) => {
	const curriculumId = req.params.curriculumId;
	const subjectCode = req.params.subjectCode;

	pool.query(
		"SELECT prerequisites, corequisites FROM curriculum_subjects WHERE curriculum_id = ? AND subject_code = ?",
		[curriculumId, subjectCode],
		(error, results) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				const prerequisites = results[0].prerequisites;
				const corequisites = results[0].corequisites;
				let errors = [];

				if (prerequisites !== null) {
					pool.query(
						"DELETE FROM prerequisites WHERE prerequisite_id = ?",
						[prerequisites],
						(error, results) => {
							if (error) {
								errors.push(error);
							}
						}
					);
				}
				if (corequisites !== null) {
					pool.query(
						"DELETE FROM corequisites WHERE corequisite_id = ?",
						[corequisites],
						(error, results) => {
							if (error) {
								errors.push(error);
							}
						}
					);
				}

				if (errors.length > 0) {
					return res.status(500).json(errors);
				} else {
					pool.query(
						"DELETE FROM curriculum_subjects WHERE curriculum_id = ? AND subject_code = ?",
						[curriculumId, subjectCode],
						(error, results) => {
							if (error) {
								return res.status(500).json(error);
							} else {
								return res
									.status(200)
									.json({ message: "Subject Removed Successfully" });
							}
						}
					);
				}
			}
		}
	);
};

module.exports.getPrerequisiteController = (req, res) => {
	const prerequisiteId = req.params.prerequisiteId;

	pool.query(
		"SELECT subject_code FROM prerequisites WHERE prerequisite_id = ?",
		[prerequisiteId],
		(error, results) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				let prerequisites = [];
				for (const result of results) {
					prerequisites.push(result.subject_code);
				}
				return res.status(200).json(prerequisites);
			}
		}
	);
};

module.exports.getCorequisiteController = (req, res) => {
	const corequisiteId = req.params.corequisiteId;

	pool.query(
		"SELECT subject_code FROM corequisites WHERE corequisite_id = ?",
		[corequisiteId],
		(error, results) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				let corequisites = [];
				for (const result of results) {
					corequisites.push(result.subject_code);
				}
				return res.status(200).json(corequisites);
			}
		}
	);
};
