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

const setErrorField = (field, errorMessage) => {
	return {
		field: field,
		errorMessage: errorMessage,
	};
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
					errors.push(setErrorField("username", "Username already exists"));
				}

				if (result.email === email) {
					errors.push(setErrorField("email", "Email already exists"));
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

	pool.query(queryString, [loginName, loginName], (error, results) => {
		if (error) {
			console.error(error);
			return res.status(500).json({ error: "Internal Server Error" });
		}

		if (results.length === 0) {
			return res.status(401).json({ error: "Invalid Username or Password" });
		}

		const user = results[0];

		// check if the user is active
		if (!user.isActive) {
			return res.status(401).json({ error: "Account was disabled" });
		} else if (user.isArchive) {
			return res.status(401).json({ error: "Account was deleted by admin" });
		}

		// compare the password with the stored hash
		bcrypt.compare(password, user.password, (error, result) => {
			if (error) {
				console.error(error);
				return res.status(500).json({ error: "Internal Server Error" });
			}

			if (!result) {
				return res.status(401).json({ error: "Invalid Username or Password" });
			}

			// generate JWT and refresh token
			const accessToken = jwt.sign(
				{ userId: user.id, role: user.role, department: user.department },
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: "1s" }
			);

			const refreshToken = jwt.sign(
				{ userId: user.id },
				process.env.REFRESH_TOKEN_SECRET
			);

			// save the refresh token to the database
			const saveRefreshTokenQuery = `UPDATE accounts SET refresh_token = ? WHERE id = ?`;
			pool.query(
				saveRefreshTokenQuery,
				[refreshToken, user.id],
				(error, results) => {
					if (error) {
						console.error(error);
						return res.status(500).json({ error: "Internal Server Error" });
					} else {
						res
							.status(200)
							.cookie("accessToken", accessToken, {
								maxAge: null,
								httpOnly: true,
							})
							.cookie("refreshToken", refreshToken, {
								maxAge: null,
								httpOnly: true,
							})
							.json({ message: "Login successful", accessToken, refreshToken });
					}
				}
			);
		});
	});
};

module.exports.logoutController = (req, res) => {
	const userId = res.locals.userId;

	pool.query(
		"UPDATE accounts SET refresh_token = NULL WHERE id = ?",
		[userId],
		(error, results) => {
			if (error) {
				console.error(error);
				return res.status(500).json({ error: "Internal Server Error" });
			} else {
				res
					.clearCookie("accessToken")
					.clearCookie("refreshToken")
					.json({ message: "Logout successful" });
			}
		}

		// remove access token from client-side
	);
};

module.exports.refreshTokenController = (req, res) => {
	const refreshToken = req.cookies.refreshToken;

	jwt.verify(
		refreshToken,
		process.env.REFRESH_TOKEN_SECRET,
		(error, decodedToken) => {
			if (error) {
				return res.status(401).json({ error: "Session expired" });
			} else {
				pool.query(
					"SELECT * FROM accounts WHERE id = ?",
					[decodedToken.userId],
					(error, results) => {
						if (error) {
							return res.status(500).json({ error: "Internal Server Error" });
						} else {
							const user = results[0];

							if (!user.isActive) {
								return res.status(401).json({ error: "Account was disabled" });
							} else if (user.isArchive) {
								return res
									.status(401)
									.json({ error: "Account was deleted by admin" });
							} else {
								const accessToken = jwt.sign(
									{
										userId: user.id,
										role: user.role,
										department: user.department,
									},
									process.env.ACCESS_TOKEN_SECRET,
									{ expiresIn: "15m" }
								);

								res
									.status(200)
									.cookie("accessToken", accessToken, {
										maxAge: null,
										httpOnly: true,
									})
									.json({
										accessToken,
										message: "Access Token Successfully refreshed",
									});
							}
						}
					}
				);
			}
		}
	);
};

module.exports.createAccountController = (req, res) => {
	const { username, email, password, department, role } = req.body;
	let errors = [];
	if (!username) {
		errors.push(setErrorField("username", "Username must be provided."));
	}
	if (!email) {
		errors.push(setErrorField("email", "Email must be provided."));
	} else if (!/\S+@\S+\.\S+/.test(email)) {
		errors.push(setErrorField("email", "Enter a valid email address."));
	}
	if (!password) {
		errors.push(setErrorField("password", "Password must be provided."));
	}
	if (!department) {
		errors.push(setErrorField("department", "Department must be provided."));
	}
	if (!role) {
		errors.push(setErrorField("role", "Role must be provided."));
	}

	if (errors) {
		return res.status(400).json({ errors });
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
	const {
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
		"SELECT * FROM accounts WHERE username = ? AND id <> ?",
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
					"SELECT * FROM accounts WHERE email = ? AND id <> ?",
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
										if (!/\S+@\S+\.\S+/.test(email)) {
											return res
												.status(403)
												.json({ error: "Please enter a valid email address" });
										}

										const updatedData = {
											username: username || results[0].username,
											email: email || results[0].email,
											password:
												hashPassword(password) ||
												hashPassword(results[0].password),
											department: department || results[0].department,
											role: role || results[0].role,
											isActive:
												isActive === true ||
												isActive === false ||
												isActive === 1 ||
												isActive === 0
													? isActive
													: results[0].isActive,
											profilePicture:
												profilePicture || results[0].profilePicture,
											date: date,
										};

										// Update account
										pool.query(
											"UPDATE accounts SET username = ?, email = ?, password = ?, department = ?, role = ?, isActive = ?, profile_picture = ?, date_updated = ? WHERE id = ?",
											[
												updatedData.username,
												updatedData.email,
												updatedData.password,
												updatedData.department.toUpperCase(),
												updatedData.role.toUpperCase(),
												updatedData.isActive,
												updatedData.profilePicture,
												updatedData.date,
												req.params.id,
											],
											(error, result) => {
												if (error) {
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

module.exports.deleteAccountController = (req, res) => {
	const userId = req.params.id;
	const date = getCurrentDateTime();

	pool.query(
		"UPDATE accounts SET isArchive = ?, date_updated = ? WHERE id = ?",
		[true, date, userId],
		(error, result) => {
			if (error) {
				return res.status(500).json({ error: "Internal server error" });
			} else {
				return res
					.status(200)
					.json({ message: `Successfully deleted account ${userId}` });
			}
		}
	);
};

module.exports.restoreAccountController = (req, res) => {
	const userId = req.params.id;
	const date = getCurrentDateTime();
	pool.query(
		"UPDATE accounts SET isArchive = ?, date_updated = ? WHERE id = ?",
		[false, date, userId],
		(error, result) => {
			if (error) {
				return res.status(500).json({ error: "Internal server error" });
			} else {
				return res
					.status(200)
					.json({ message: `Successfully restored account ${userId}` });
			}
		}
	);
};

module.exports.getAccountsController = (req, res) => {
	pool.query("SELECT * FROM accounts", (error, result) => {
		if (error) {
			return res.status(500).json({ error: "Internal server error" });
		} else {
			return res.status(200).json(result);
		}
	});
};

module.exports.getAccountController = (req, res) => {
	const userId = req.params.id;

	pool.query(
		"SELECT * FROM accounts WHERE id = ?",
		[userId],
		(error, result) => {
			if (error) {
				return res.status(500).json({ error: "Internal server error" });
			} else {
				return res.status(200).json(result[0]);
			}
		}
	);
};
