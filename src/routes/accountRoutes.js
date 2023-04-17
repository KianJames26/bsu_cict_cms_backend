const express = require("express");
const router = express.Router();

const {
	loginController,
	refreshTokenController,
	logoutController,
	createAccountController,
	editAccountController,
	deleteAccountController,
	restoreAccountController,
	getAccountsController,
	getAccountController,
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
//TokenExpiredError
router.post("/refresh-token", refreshTokenController);

// !Logout Route
router.post("/logout", loginAuth, logoutController);

// !Account Manipulation Route
router
	.get("/", loginAuth, verifyRoleOnly("ADMIN"), getAccountsController)
	.get("/:id", loginAuth, verifyBoth("ADMIN"), getAccountController);
router.post("/", loginAuth, verifyRoleOnly("ADMIN"), createAccountController);
router.put("/:id", loginAuth, verifyBoth("ADMIN"), editAccountController);
router.delete(
	"/:id",
	loginAuth,
	verifyRoleOnly("ADMIN"),
	deleteAccountController
);
router.put(
	"/restore/:id",
	loginAuth,
	verifyRoleOnly("ADMIN"),
	restoreAccountController
);

//*Export Route
module.exports = router;
