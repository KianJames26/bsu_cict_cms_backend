const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const pool = mysql.createPool({
	connectionLimit: 10,
	host: process.env.DB_HOST,
	port: process.env.DB_HOST_PORT,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

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

const hashPassword = (password) => {
	const saltRounds = 10;
	const salt = bcrypt.genSaltSync(saltRounds);
	const hash = bcrypt.hashSync(password, salt);
	return hash;
};

const checkUsernameAndEmail = (username, email, callback) => {
	const query = "SELECT * FROM accounts WHERE username = ? OR email = ?";
	pool.query(query, [username, email], (error, results) => {
		if (error) {
			callback(error);
		} else {
			const errors = [];
			for (const result of results) {
				if (result.username === username) {
					errors.push({
						field: "username",
						message: "Username already exists",
					});
				}

				if (result.email === email) {
					errors.push({ field: "email", message: "Email already exists" });
				}
			}

			callback(null, errors);
		}
	});
};

// *Controllers
module.exports.loginController = (req, res) => {
	const { loginName, password } = req.body;

	const queryString = `SELECT * FROM accounts WHERE username = ? OR email = ?`;

	pool.query(queryString, [loginName, loginName], (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).json({ error: "Internal Server Error" });
		}

		if (results.length === 0) {
			return res.status(401).json({ error: "Invalid Username or Password" });
		}

		const user = results[0];

		// check if the user is active
		if (!user.isActive) {
			return res.status(401).json({ error: "Account is not active" });
		}

		// compare the password with the stored hash
		bcrypt.compare(password, user.password, (err, result) => {
			if (err) {
				console.error(err);
				return res.status(500).json({ error: "Internal Server Error" });
			}

			if (!result) {
				return res.status(401).json({ error: "Invalid Username or Password" });
			}

			// generate JWT and refresh token
			const accessToken = jwt.sign(
				{ userId: user.id, role: user.role },
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: "5h" }
			);

			const refreshToken = jwt.sign(
				{ userId: user.id, role: user.role },
				process.env.REFRESH_TOKEN_SECRET
			);

			// save the refresh token to the database
			const saveRefreshTokenQuery = `UPDATE accounts SET refresh_token = ? WHERE id = ?`;
			pool.query(
				saveRefreshTokenQuery,
				[refreshToken, user.id],
				(err, results) => {
					if (err) {
						console.error(err);
						return res.status(500).json({ error: "Internal Server Error" });
					}
				}
			);

			// return the JWT and refresh token
			res
				.cookie("accessToken", accessToken, {
					maxAge: null,
					httpOnly: true,
				})
				.cookie("refreshToken", refreshToken, {
					maxAge: null,
					httpOnly: true,
				})
				.json({ accessToken, refreshToken });
		});
	});
};

module.exports.logoutController = (req, res) => {
	const userId = res.locals.userId;

	pool.query(
		"UPDATE accounts SET refresh_token = NULL WHERE id = ?",
		[userId],
		(err, results) => {
			if (err) {
				console.error(err);
				return res.status(500).json({ error: "Internal Server Error" });
			}

			// remove access token from client-side
			res
				.clearCookie("accessToken")
				.clearCookie("refreshToken")
				.json({ message: "Logout successful" });
		}
	);
};

module.exports.refreshTokenController = (req, res) => {};

module.exports.createAccountController = (req, res) => {
	const { username, email, password, department, role } = req.body;
	const errorMessage = (message) => {
		return res.status(400).json({ error: message });
	};
	if (!username) {
		errorMessage("Username is required");
	} else if (!email) {
		errorMessage("Email is required");
	} else if (!/\S+@\S+\.\S+/.test(email)) {
		errorMessage("Please enter a valid email address");
	} else if (!password) {
		errorMessage("Password is required");
	} else if (!department) {
		errorMessage("Department is required");
	} else if (!role) {
		errorMessage("Role is required");
	} else {
		const date = getCurrentDateTime();
		checkUsernameAndEmail(username, email, (error, errors) => {
			if (error) {
				console.log(error);
				return res.status(500).json({ error: "Internal Server Error" });
			} else if (errors.length > 0) {
				return res.status(400).json({ errors });
			} else {
				const query =
					"INSERT INTO accounts (id, username, email, password, role, department, date_created) VALUES (?, ?, ?, ?, ?, ?, ?)";
				const hashedPassword = hashPassword(password);
				let id = uuidv4().replace(/-/g, "");
				let checkIdAvailability = [];

				while (checkIdAvailability.count > 0) {
					pool.query("SELECT COUNT(*) AS count FROM accounts WHERE id = ?", [
						id,
					]);
					if (checkIdAvailability > 0) {
						id = uuidv4().replace(/-/g, "");
						checkIdAvailability = [];
					}
				}

				pool.query(
					query,
					[
						id,
						username,
						email,
						hashedPassword,
						role.toUpperCase(),
						department.toUpperCase(),
						date,
					],
					(error, results) => {
						if (error) {
							console.log(error);
							return res.status(500).json({ error: "Internal server error" });
						} else {
							return res
								.status(201)
								.json({ message: `Account ${username} successfully created` });
						}
					}
				);
			}
		});
	}
};

module.exports.editAccountController = (req, res) => {
	let {
		username,
		email,
		password,
		department,
		role,
		isActive,
		profilePicture,
	} = req.body;
	const date = getCurrentDateTime();

	// Check if username exists
	pool.query(
		"SELECT * FROM accounts WHERE username = ?",
		[username, req.params.id],
		(error, usernameResults) => {
			if (error) {
				return res.status(500).json({ error: "Internal server error" });
			}
			if (usernameResults.length > 0) {
				return res.status(403).json({ error: "Username already exists" });
			} else {
				// Check if email exists
				pool.query(
					"SELECT * FROM accounts WHERE email = ?",
					[email, req.params.id],
					(error, emailResults) => {
						if (error) {
							return res.status(500).json({ error: "Internal server error" });
						}
						if (emailResults.length > 0) {
							return res.status(403).json({ error: "Email already exists" });
						} else {
							pool.query(
								"SELECT * FROM accounts WHERE id = ?",
								[req.params.id],
								(error, results) => {
									if (error) {
										return res
											.status(500)
											.json({ error: "Internal server error" });
									} else {
										// Set default values if not provided
										if (!username) {
											username = results[0].username;
										}
										if (!email) {
											email = results[0].email;
										}
										if (!/\S+@\S+\.\S+/.test(email)) {
											return res
												.status(403)
												.json({ error: "Please enter a valid email address" });
										}
										if (!role) {
											role = results[0].role;
										}
										if (!department) {
											department = results[0].department;
										}
										if (isActive === "") {
											isActive = results[0].isActive;
										}
										if (!profilePicture) {
											profilePicture = results[0].profilePicture;
										}
										if (!password) {
											password = results[0].password;
										}

										// Update account
										pool.query(
											"UPDATE accounts SET username = ?, email = ?, password = ?, department = ?, role = ?, isActive = ?, profile_picture = ?, date_updated = ? WHERE id = ?",
											[
												username,
												email,
												hashPassword(password),
												department.toUpperCase(),
												role.toUpperCase(),
												isActive,
												profilePicture,
												date,
												req.params.id,
											],
											(error, result) => {
												if (error) {
													console.log(error);
													return res
														.status(500)
														.json({ error: "Internal server error" });
												}
												return res.status(200).json({
													message: `Successfully updated ${results[0].username} account`,
												});
											}
										);
									}
								}
							);
						}
					}
				);
			}
		}
	);
};

// if (!username) {
// 	username = results[0].username;
// }
// if (!email) {
// 	email = results[0].email;
// }
// if (!/\S+@\S+\.\S+/.test(email)) {
// 	return res
// 		.status(403)
// 		.json({ error: "Please enter a valid email address" });
// }
// if (!role) {
// 	role = results[0].role;
// }
// if (!department) {
// 	department = results[0].department;
// }
// if (isActive === "") {
// 	isActive = results[0].isActive;
// }
// if (!profilePicture) {
// 	profilePicture = results[0].profilePicture;
// }
// console.log({
// 	username,
// 	email,
// 	password,
// 	department,
// 	role,
// 	isActive,
// 	profilePicture,
// });
// Update user data into the database
// pool.query(
// 	"UPDATE accounts SET username = ?, email = ?, password = ?, department = ?, role = ?, isActive = ?, profile_picture = ?, date_updated = ? WHERE id = ?",
// 	[
// 		username,
// 		email,
// 		hashPassword(password),
// 		department,
// 		role,
// 		isActive,
// 		profilePicture,
// 		date,
// 		req.params.id,
// 	],
// 	(error, results) => {
// 		if (error) {
// 			console.log(error);
// 			return res
// 				.status(500)
// 				.json({ error: "Failed to update account" });
// 		}
// 		return res.status(201).json({
// 			message: `Account ${username} updated successfully`,
// 		});
// 	}
// );
