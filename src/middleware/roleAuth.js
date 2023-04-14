const jwt = require("jsonwebtoken");

const verifyRole = (role) => {
	return (req, res, next) => {
		const requestId = req.params.id;
		const userId = res.locals.userId;
		const userRole = res.locals.userRole;

		if (userRole === role || userId === requestId) {
			next();
		} else if (userRole) {
			return res
				.status(403)
				.send({ error: "User is not authorized to perform this action." });
		}
	};
};

module.exports = verifyRole;
