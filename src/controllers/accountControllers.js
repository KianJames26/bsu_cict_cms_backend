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

const checkUserExists = (username, email, callback) => {
	pool.query(
		"SELECT COUNT(*) AS count FROM accounts WHERE username = ? OR email = ?",
		[username, email],
		(err, rows) => {
			if (err) {
				console.error(err);
				return callback(new Error("Internal server error"));
			}
			return callback(null, rows[0].count > 0);
		}
	);
};

// *Controllers
module.exports.login = (req, res) => {
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
			res.cookie("accessToken", accessToken, {
				maxAge: null,
				httpOnly: true,
			});
			res.cookie("refreshToken", refreshToken, {
				maxAge: null,
				httpOnly: true,
			});
			res.json({ accessToken, refreshToken });
		});
	});
};

module.exports.logout = (req, res) => {
	const userId = res.locals.userId;

	const removeRefreshTokenQuery = `UPDATE accounts SET refresh_token = NULL WHERE id = ?`;
	pool.query(removeRefreshTokenQuery, [userId], (err, results) => {
		if (err) {
			console.error(err);
			return res.status(500).json({ error: "Internal Server Error" });
		}

		// remove access token from client-side
		res.clearCookie("accessToken");
		res.clearCookie("refreshToken");

		res.json({ message: "Logout successful" });
	});
};

module.exports.create = (req, res) => {
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

		try {
			checkUserExists(username, email, (err, userExists) => {
				if (err) {
					return res.status(500).json({ error: "Internal server error" });
				}
				if (userExists) {
					return res
						.status(409)
						.json({ error: "Username or email already exists" });
				}
			});
			let id = uuidv4().replace(/-/g, "");
			let checkIdAvailability = [];

			while (checkIdAvailability.count > 0) {
				pool.query("SELECT COUNT(*) AS count FROM accounts WHERE id = ?", [id]);
				if (checkAvailability > 0) {
					id = uuidv4().replace(/-/g, "");
					checkAvailability = [];
				}
			}

			// Insert user data into the database
			pool.query(
				"INSERT INTO accounts (id, username, email, password, department, role, date_created) VALUES (?, ?, ?, ?, ?, ?, ?)",
				[
					id,
					username,
					email,
					hashPassword(password),
					department.toUpperCase(),
					role.toUpperCase(),
					date,
				]
			);
			return res.status(201).json({ message: "User created successfully" });
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: "Internal server error" });
		}
	}
};
