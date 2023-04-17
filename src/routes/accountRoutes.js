const express = require("express");
const router = express.Router();

const {
	loginController,
	refreshTokenController,
	logoutController,
	createAccountController,
	editAccountController,
	inactivateAccountController,
} = require("../controllers/accountControllers");
const loginAuth = require("../middleware/loginAuth");
const {
	verifyRoleOnly,
	verifyIdOnly,
	verifyBoth,
} = require("../middleware/roleAuth");

// *Routes

// !Login Route
router.post("/login", loginController);

// !Refresh Token Route
router.post("/refresh-token", refreshTokenController);

// !Logout Route
router.post("/logout", loginAuth, logoutController);

// !Account Manipulation Route
router.post("/", loginAuth, verifyRoleOnly("ADMIN"), createAccountController);
router.put("/:id", loginAuth, verifyBoth("ADMIN"), editAccountController);
router.delete(
	"/:id",
	loginAuth,
	verifyRoleOnly("ADMIN"),
	inactivateAccountController
);

//*Export Route
module.exports = router;
