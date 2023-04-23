const multer = require("multer");

module.exports.initMulter = () => {
	const upload = multer({
		storage: multer.memoryStorage(),
	});
	return upload;
};
