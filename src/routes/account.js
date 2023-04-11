const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

function accountRoutes(pool) {
	// *ROUTES GOES INSIDE HERE

	// !Login Route
	router.post("/login", (req, res) => {
		const { emailOrUsername, password } = req.body;

		// check if the request body has username or email
		const isEmail = emailOrUsername.includes("@");

		const queryString = isEmail
			? `SELECT * FROM accounts WHERE email = ?`
			: `SELECT * FROM accounts WHERE username = ?`;

		pool.query(queryString, emailOrUsername, (err, results) => {
			if (err) {
				console.error(err);
				return res.status(500).json({ error: "Internal Server Error" });
			}

			if (results.length === 0) {
				return res.status(401).json({ error: "Invalid Credentials" });
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
					return res.status(401).json({ error: "Invalid Password" });
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
				res.json({ accessToken, refreshToken });
			});
		});
	});
	// !Logout Route

	return router;
}

module.exports = accountRoutes;
