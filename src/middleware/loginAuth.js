const jwt = require("jsonwebtoken");
const LocalStorage = require("node-localstorage").LocalStorage;

localStorage = new LocalStorage("./scratch");

module.exports = (req, res, next) => {
	const accessToken =
		localStorage.getItem("accessToken") || req.cookies.accessToken;

	jwt.verify(
		accessToken,
		process.env.ACCESS_TOKEN_SECRET,
		(error, decodedToken) => {
			if (error) {
				if (error.name === "TokenExpiredError") {
					return res.status(401).json({ error: "Access token has expired" });
				} else {
					return res.status(401).json({ error: "Please login first" });
				}
			} else {
				res.locals.userId = decodedToken.userId;
				res.locals.userRole = decodedToken.role;
				res.locals.userDepartment = decodedToken.department;
				next();
			}
		}
	);
};
