const jwt = require("jsonwebtoken");

module.exports.verifyRoleOnly = (role) => {
	return (req, res, next) => {
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

module.exports.verifyIdOnly = () => {
	return (req, res, next) => {
		const userId = res.locals.userId;

		if (userId === req.params.id) {
			next();
		} else {
			return res
				.status(403)
				.send({ error: "User is not authorized to perform this action." });
		}
	};
};

module.exports.verifyBoth = (role) => {
	return (req, res, next) => {
		const userRole = res.locals.userRole;
		const userId = res.locals.userId;
		if (userRole === role || userId === req.params.id) {
			next();
		} else if (userRole) {
			return res
				.status(403)
				.send({ error: "User is not authorized to perform this action." });
		}
	};
};

module.exports.verifyRoles = (roles) => {
	return (req, res, next) => {
		const userRole = res.locals.userRole;

		if (roles.includes(userRole)) {
			next();
		} else {
			return res
				.status(403)
				.send({ error: "User is not authorized to perform this action." });
		}
	};
};
