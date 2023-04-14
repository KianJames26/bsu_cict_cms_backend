const express = require("express");
const router = express.Router();

const {
	loginController,
	refreshTokenController,
	logoutController,
	createAccountController,
	editAccountController,
} = require("../controllers/accountControllers");
const loginAuth = require("../middleware/loginAuth");
const roleAuth = require("../middleware/roleAuth");

// *Routes

// !Login Route
router.post("/login", loginController);

// !Refresh Token Route
router.post("/refresh-token", refreshTokenController);

// !Logout Route
router.post("/logout", loginAuth, logoutController);

// !Account Manipulation Route
router.post("/", loginAuth, roleAuth("ADMIN"), createAccountController);
router.put("/:id", loginAuth, roleAuth("ADMIN"), editAccountController);

//*Export Route
module.exports = router;
