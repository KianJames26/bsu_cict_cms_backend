//* Package Imports
const mysql = require("mysql2");
const path = require("path");
const fetch = require("node-fetch");

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

module.exports.createSubjectController = (req, res) => {
	const file =
		req.files !== null &&
		req.files.syllabus !== null &&
		req.files !== undefined &&
		req.files.syllabus !== undefined
			? req.files.syllabus
			: null;
	const department = res.locals.userDepartment;
	const { subjectCode, subjectName } = req.body;
	const date = getCurrentDateTime();

	let errors = [];
	pool.query(
		"SELECT * FROM subjects where subject_code = ?",
		[subjectCode],
		(error, results) => {
			if (error) {
				return res.status(500).json(error);
			} else if (results.length > 0) {
				errors.push(
					setErrorField("subjectCode", "Subject Code already exists")
				);
				return res.status(400).json({
					field: "subjectCode",
					message: "Subject Code already exists",
				});
			} else {
				if (!subjectCode) {
					errors.push(
						setErrorField("subjectCode", "Subject Code must be provided.")
					);
				}
				if (!subjectName) {
					errors.push(
						setErrorField("subjectName", "Subject Name must be provided.")
					);
				}
				if (!department) {
					errors.push(
						setErrorField(
							"department",
							"Please provide the depeartment where the subject belongs to"
						)
					);
				}
				if (!file) {
					errors.push(
						setErrorField("syllabus", "Please upload a pdf file for syllabus")
					);
				} else {
					const fileExtension = path.extname(file.name);
					const fileSize = file.size;
					if (fileExtension !== ".pdf") {
						errors.push(
							setErrorField("syllabus", "Please upload pdf file only!")
						);
					} else if (fileSize > 5 * 1024 * 1024) {
						errors.push(
							setErrorField("syllabus", "File size must be less than 5mb!")
						);
					}
				}

				if (errors.length > 0) {
					return res.status(400).json(errors);
				} else {
					const fileName = `${subjectCode} Syllabus.pdf`;
					fetch(
						`https://www.filestackapi.com/api/store/S3?key=${process.env.FILESTACK_API_KEY}&filename=${fileName}`,
						{
							method: "POST",
							headers: { "Content-Type": "application/pdf" },
							body: file.data,
						}
					)
						.then((response) => response.json())
						.then((json) => {
							const fileDirectory = json.url;
							pool.query(
								"INSERT INTO subjects (subject_code, subject_name, syllabus, department, date_created) VALUES (?, ?, ?, ?, ?)",
								[subjectCode, subjectName, fileDirectory, department, date],
								(error, results) => {
									if (error) {
										console.error(error);
										return res
											.status(500)
											.json({ error: "Error while inserting into database" });
									} else {
										return res.status(200).json({ message: "Subject created" });
									}
								}
							);
						});
				}
			}
		}
	);
};

module.exports.getSubjectsController = (req, res) => {
	pool.query(
		"SELECT * FROM subjects WHERE department = ?",
		[res.locals.userDepartment],
		(error, result) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				return res.status(200).json(result);
			}
		}
	);
};

module.exports.getSubjectController = (req, res) => {
	const department = res.locals.userDepartment;
	const subjectCode = req.params.subjectCode;

	pool.query(
		"SELECT * FROM subjects WHERE department = ? AND subject_code = ?",
		[department, subjectCode],
		(error, result) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				return res.status(200).json(result);
			}
		}
	);
};

module.exports.updateSubjectController = (req, res) => {
	const subject = req.params.subjectCode;
	const file =
		req.files !== null && req.files.syllabus !== null
			? req.files.syllabus
			: null;
	const { subjectCode, subjectName } = req.body;
	const department = res.locals.userDepartment;

	const initFileUpload = (code, subjectName) => {
		if (!file) {
			pool.query(
				"UPDATE subjects SET subject_code = ?, subject_name = ? WHERE subject_code = ?",
				[code, subjectName, subject],
				(error, results) => {
					if (error) {
						console.error(error);
						return res
							.status(500)
							.json({ error: "Error while inserting into database" });
					} else {
						return res.status(200).json({ message: `${subject} updated` });
					}
				}
			);
		} else {
			const fileExtension = path.extname(file.originalname);
			const fileSize = req.file.size;
			if (fileExtension !== ".pdf") {
				return res.status(400).json({ error: "Please upload pdf file only!" });
			} else if (fileSize > 5 * 1024 * 1024) {
				return res
					.status(400)
					.json({ error: "File size must be less than 5mb!" });
			} else {
				const fileExtension = path.extname(file.originalname);

				const fileName = `${subjectCode} Syllabus.pdf`;
				fetch(
					`https://www.filestackapi.com/api/store/S3?key=${process.env.FILESTACK_API_KEY}&filename=${fileName}`,
					{
						method: "POST",
						headers: { "Content-Type": "application/pdf" },
						body: file.data,
					}
				)
					.then((response) => response.json())
					.then((json) => {
						const fileDirectory = json.url;
						pool.query(
							"UPDATE subjects SET subject_code = ?, subject_name = ?, syllabus = ? WHERE subject_code = ?",
							[code, subjectName, fileDirectory, subject],
							(error, results) => {
								if (error) {
									return res.status(500).json(error);
								} else {
									return res
										.status(200)
										.json({ message: `${subject} updated` });
								}
							}
						);
					});
			}
		}
	};

	pool.query(
		"SELECT * FROM subjects WHERE subject_code = ?",
		[subject],
		(error, result) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				const resultSubjectCode = result[0].subject_code;
				const resultSubjectName = result[0].subject_name;

				if (subjectCode === resultSubjectCode) {
					const newSubjectName = subjectName || resultSubjectName;
					const newSubjectCode = subjectCode;
					initFileUpload(newSubjectCode, newSubjectName);
				} else {
					pool.query(
						"SELECT * FROM subjects WHERE subject_code = ?",
						[subjectCode],
						(error, results) => {
							if (error) {
								return res.status(500).json(error);
							} else if (results > 0) {
								return res
									.status(400)
									.json({ error: "Subject Code already exists" });
							} else {
								const newSubjectCode = subjectCode || resultSubjectCode;
								const newSubjectName = subjectName || resultSubjectName;

								initFileUpload(newSubjectCode, newSubjectName);
							}
						}
					);
				}
			}
		}
	);
};

module.exports.deleteSubjectController = (req, res) => {
	const subjectCode = req.params.subjectCode;
	pool.query(
		"UPDATE subjects SET isArchive = ? WHERE id = ?",
		[true, subjectCode],
		(error, result) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				return res
					.status(200)
					.json({ message: `Successfully deleted ${subejctCode}` });
			}
		}
	);
};

module.exports.restoreSubjectController = (req, res) => {
	const subjectCode = req.params.subjectCode;
	pool.query(
		"UPDATE subjects SET isArchive = ? WHERE id = ?",
		[false, subjectCode],
		(error, result) => {
			if (error) {
				return res.status(500).json(error);
			} else {
				return res
					.status(200)
					.json({ message: `Successfully deleted ${subejctCode}` });
			}
		}
	);
};
