const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
	const accessToken = req.cookies.accessToken;

	jwt.verify(
		accessToken,
		process.env.ACCESS_TOKEN_SECRET,
		(err, decodedToken) => {
			if (err) {
				return res.status(401).json({ error: err.name });
			}

			res.locals.userId = decodedToken.userId;
			res.locals.userRole = decodedToken.role;
			next();
		}
	);
};
