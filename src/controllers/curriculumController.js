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

module.exports.createCurriculumController = (req, res) => {
	const department = res.locals.userDepartment;
	const { curriculumTitle, curriculumVersion, subjects } = req.body;
	const date = getCurrentDateTime();

	let id = uuidv4().replace(/-/g, "");
	let checkIdAvailability = [];

	while (checkIdAvailability.count > 0) {
		pool.query("SELECT COUNT(*) AS count FROM accounts WHERE id = ?", [id]);
		if (checkIdAvailability > 0) {
			id = uuidv4().replace(/-/g, "");
			checkIdAvailability = [];
		}
	}

	let errors = [];

	if (!curriculumTitle)
		[
			errors.push(
				setErrorField("curriculumTitle", "Please provide the curriculum title")
			),
		];
	if (!curriculumVersion) {
		errors.push(
			setErrorField(
				"curriculumVersion",
				"Please provide the curriculum version"
			)
		);
	}

	if (errors.length > 0) {
		return res.status(400).json(errors);
	} else {
		pool.query(
			"INSERT INTO curriculums (curriculum_id, curriculum_title, curriculum_version, department, date_created) VALUES(?, ?, ?, ?, ?)",
			[id, curriculumTitle, curriculumVersion, department, date],
			(error, result) => {
				if (error) {
					return res.status(500).json({ error: "Internal server error" });
				} else {
					const firstYear = subjects.firstYear;
					const secondYear = subjects.secondYear;
					const thirdYear = subjects.thirdYear;
					const fourthYear = subjects.fourthYear;

					if (firstYear.firstSemester.length > 0) {
						for (const subject of firstYear.firstSemester) {
							const schoolYear = "1st Year";
							const semester = "1st semester";
							const subjectCode = subject.subjectCode;
							const lectureUnits = subject.lectureUnits || 0;
							const laboratoryUnits = subject.laboratoryUnits || 0;
							const hoursPerWeek = subject.hoursPerWeek || 0;
							const prerequisites = subject.prerequisites;
							const corequisites = subject.corequisites;
						}
					}
				}
			}
		);
	}
};
