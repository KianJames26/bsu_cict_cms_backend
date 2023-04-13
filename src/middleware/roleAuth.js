const jwt = require("jsonwebtoken");

const verifyRole = (role) => {
	return (req, res, next) => {
		const userId = res.locals.userId;
		const userRole = res.locals.userRole;

		if (userRole === role) {
			next();
		} else {
			return res
				.status(403)
				.send({ error: "User is not authorized to perform this action." });
		}
	};
};

module.exports = verifyRole;
