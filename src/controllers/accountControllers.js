const mysql = require("mysql2");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const pool = mysql.createPool({
	connectionLimit: 10,
	host: process.env.DB_HOST,
	port: process.env.DB_HOST_PORT,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
});

// *Controllers
module.exports.login = (req, res) => {
	const { emailOrUsername, password } = req.body;

	const queryString = `SELECT * FROM accounts WHERE username = ? OR email = ?`;

	pool.query(
		queryString,
		[emailOrUsername, emailOrUsername],
		(err, results) => {
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
					return res
						.status(401)
						.json({ error: "Invalid Username or Password" });
				}

				// generate JWT and refresh token
				const accessToken = jwt.sign(
					{ userId: user.id, role: user.role },
					process.env.ACCESS_TOKEN_SECRET,
					{ expiresIn: "15m" }
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
					maxAge: 900000,
					httpOnly: true,
				});
				res.cookie("refreshToken", refreshToken, {
					maxAge: 900000,
					httpOnly: true,
				});
				res.json({ accessToken, refreshToken });
			});
		}
	);
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
	const userId = res.locals.userId;
	const userRole = res.locals.userRole;

	if (userRole !== "ADMIN") {
		return res
			.status(403)
			.json({ error: "Only admins can access this resource" });
	}
};
