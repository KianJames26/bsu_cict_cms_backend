const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
	const accessToken = req.cookies.accessToken;

	jwt.verify(
		accessToken,
		process.env.ACCESS_TOKEN_SECRET,
		(err, decodedToken) => {
			if (err) {
				// if (err.name === "TokenExpiredError") {
				// 	const refreshToken = req.cookies.refreshToken;
				// 	jwt.verify(
				// 		refreshToken,
				// 		process.env.REFRESH_TOKEN_SECRET,
				// 		(err, decodedRefreshToken) => {
				// 			if (err) {
				// 				console.log(err);
				// 				return res.status(401).send({
				// 					message: "Please login first",
				// 				});
				// 			}

				// 			const accessToken = jwt.sign(
				// 				{
				// 					userId: decodedRefreshToken.userId,
				// 					role: decodedRefreshToken.Role,
				// 				},
				// 				process.env.ACCESS_TOKEN_SECRET,
				// 				{ expiresIn: "15m" }
				// 			);

				// 			res.cookie("accessToken", accessToken, {
				// 				maxAge: 900000,
				// 				httpOnly: true,
				// 			});
				// 		}
				// 	);
				// }
				return res.status(401).json({ message: err.name });
			}

			res.locals.userId = decodedToken.userId;
			res.locals.userRole = decodedToken.role;
			next();
		}
	);
};
