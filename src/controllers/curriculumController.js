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

					const subjectInsert = (year, schoolYear, semester) => {
						for (const subject of year) {
							// const schoolYear = "1st Year";
							// const semester = "1st semester";
							const subjectCode = subject.subjectCode;
							const lectureUnits = subject.lectureUnits || 0;
							const laboratoryUnits = subject.laboratoryUnits || 0;
							const hoursPerWeek = subject.hoursPerWeek || 0;
							const prerequisites = subject.prerequisites || [];
							let prerequisiteId;
							const corequisites = subject.corequisites || [];
							let corequisiteId;

							if (prerequisites.length > 0) {
								prerequisiteId = uuidv4().replace(/-/g, "");
								for (const prereq of prerequisites) {
									pool.query(
										"INSERT INTO prerequisites(prerequisite_id, subject_code) VALUES(?, ?)",
										[prerequisiteId, prereq],
										(error, results) => {
											if (error) {
												console.log(error);
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
											}
										}
									);
								}
							}
							pool.query(
								"INSERT INTO curriculum_subjects(curriculum_id, school_year, semester, subject_code, lecture_units, laboratory_units, hours_per_week, prerequisites, corequisites) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)",
								[
									id,
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
									}
								}
							);
						}
					};
					//! 1ST YEAR
					if (firstYear.firstSemester.length > 0) {
						subjectInsert(firstYear.firstSemester, "1st Year", "1st Semester");
					}
					if (firstYear.secondSemester.length > 0) {
						subjectInsert(firstYear.secondSemester, "1st Year", "2nd Semester");
					}
					//! 2ND YEAR
					if (secondYear.firstSemester.length > 0) {
						subjectInsert(secondYear.firstSemester, "2nd Year", "1st Semester");
					}
					if (secondYear.secondSemester.length > 0) {
						subjectInsert(
							secondYear.secondSemester,
							"2nd Year",
							"2nd Semester"
						);
					}
					//! 3RD YEAR
					if (thirdYear.firstSemester.length > 0) {
						subjectInsert(thirdYear.firstSemester, "3rd Year", "1st Semester");
					}
					if (thirdYear.secondSemester.length > 0) {
						subjectInsert(thirdYear.secondSemester, "3rd Year", "2nd Semester");
					}
					//! 4TH YEAR
					if (fourthYear.firstSemester.length > 0) {
						subjectInsert(fourthYear.firstSemester, "4th Year", "1st Semester");
					}
					if (fourthYear.secondSemester.length > 0) {
						subjectInsert(
							fourthYear.secondSemester,
							"4th Year",
							"2nd Semester"
						);
					}
					return res
						.status(200)
						.json({ message: "Curriculum Successfully created" });
				}
			}
		);
	}
};

module.exports.getCurriculumsController = (req, res) => {
	const department = res.locals.userDepartment;
	pool.query(
		"SELECT * FROM curriculums WHERE department = ?",
		[department],
		(error, results) => {
			if (error) {
				return res.status(500).json({ error: "Internal Server Error" });
			} else {
				return res.status(200).json(results);
			}
		}
	);
};

module.exports.getCurriculumController = (req, res) => {
	const curriculumId = req.params.id;

	pool.query(
		"SELECT * FROM curriculums WHERE curriculum_id = ?",
		[curriculumId],
		(error, curriculum) => {
			if (error) {
				return res.status(500).json({ error: "Internal Server Error" });
			} else {
				pool.query(
					"SELECT * FROM curriculum_subjects WHERE curriculum_id = ?",
					[curriculumId],
					(error, subjects) => {
						if (error) {
							return res.status(500).json({ error: "Internal Server Error" });
						} else {
							let curriculumInfo = {
								curriculumTitle: curriculum[0].curriculum_title,
								curriculumVersion: curriculum[0].curriculum_version,
								curriculumStatus: curriculum[0].curriculum_status,
								department: curriculum[0].department,
								subjects: {
									firstYear: {
										firstSemester: [],
										secondSemester: [],
									},
									secondYear: {
										firstSemester: [],
										secondSemester: [],
									},
									thirdYear: {
										firstSemester: [],
										secondSemester: [],
									},
									fourthYear: {
										firstSemester: [],
										secondSemester: [],
									},
								},
							};
							for (const subject of subjects) {
								if (subject.school_year === "1st Year") {
									if (subject.semester === "1st Semester") {
										curriculumInfo.subjects.firstYear.firstSemester.push(
											subject
										);
									} else if (subject.semester === "2nd Semester") {
										curriculumInfo.subjects.firstYear.secondSemester.push(
											subject
										);
									}
								} else if (subject.school_year === "2nd Year") {
									if (subject.semester === "1st Semester") {
										curriculumInfo.subjects.secondYear.firstSemester.push(
											subject
										);
									} else if (subject.semester === "2nd Semester") {
										curriculumInfo.subjects.secondYear.secondSemester.push(
											subject
										);
									}
								} else if (subject.school_year === "3rd Year") {
									if (subject.semester === "1st Semester") {
										curriculumInfo.subjects.thirdYear.firstSemester.push(
											subject
										);
									} else if (subject.semester === "2nd Semester") {
										curriculumInfo.subjects.thirdYear.secondSemester.push(
											subject
										);
									}
								} else if (subject.school_year === "4th Year") {
									if (subject.semester === "1st Semester") {
										curriculumInfo.subjects.fourthYear.firstSemester.push(
											subject
										);
									} else if (subject.semester === "2nd Semester") {
										curriculumInfo.subjects.fourthYear.secondSemester.push(
											subject
										);
									}
								}
							}
							return res.status(200).json(curriculumInfo);
						}
					}
				);
			}
		}
	);
};

module.exports.updateCurriculumController = (req, res) => {
	const curriculumId = req.params.id;
	const { curriculumTitle, curriculumVersion, curriculumStatus } = req.body;
	const date = getCurrentDateTime();

	pool.query(
		"SELECT * FROM curriculums WHERE curriculum_id = ?",
		[curriculumId],
		(error, result) => {
			if (error) {
				console.log(error);
				return res.status(500).json({ error: "Internal Server Error" });
			} else {
				const newCurriculumInfo = {
					curriculumTitle: curriculumTitle || result[0].curriculum_title,
					curriculumVersion: curriculumVersion || result[0].curriculum_version,
					currciulumStatus:
						curriculumStatus.toUpperCase() || result[0].curriculum_status,
					dateUpdated: date,
				};
				pool.query(
					"UPDATE curriculums SET curriculum_title = ?, curriculum_version = ?, curriculum_status = ?, date_updated = ? WHERE curriculum_id = ?",
					[
						newCurriculumInfo.curriculumTitle,
						newCurriculumInfo.curriculumVersion,
						newCurriculumInfo.currciulumStatus,
						newCurriculumInfo.dateUpdated,
						curriculumId,
					],
					(error, result) => {
						if (error) {
							console.log(error);
							return res.status(500).json({ error: "Internal Server Error" });
						} else {
							return res.status(200).json({ message: "Successfully updated" });
						}
					}
				);
			}
		}
	);
};
