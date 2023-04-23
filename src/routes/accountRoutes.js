//* PACKAGE IMPORTS
const express = require("express");
const router = express.Router();

//* CONTROLLER IMPORTS
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

//* MIDDLEWARE IMPORTS
const loginAuth = require("../middleware/loginAuth");
const {
	verifyRoleOnly,
	verifyIdOnly,
	verifyBoth,
} = require("../middleware/roleAuth");

//* HEHLPER IMPORTS

const { initMulter } = require("../helpers/multerHelper");
const upload = initMulter();

//* ROUTES
//! Login Route
router.post("/login", upload.none(), loginController);

//! Refresh Token Route
//TokenExpiredError
router.post("/refresh-token", refreshTokenController);

//! Logout Route
router.post("/logout", loginAuth, logoutController);

//! Account Manipulation Route
//? Create
router.post(
	"/",
	loginAuth,
	verifyRoleOnly("ADMIN"),
	upload.none(),
	createAccountController
);

//? Read
router
	.get("/", loginAuth, verifyRoleOnly("ADMIN"), getAccountsController)
	.get("/:id", loginAuth, verifyBoth("ADMIN"), getAccountController);

//? Update
router.put(
	"/:id",
	loginAuth,
	verifyBoth("ADMIN"),
	upload.none(),
	editAccountController
);

//? Delete
router.delete(
	"/:id",
	loginAuth,
	verifyRoleOnly("ADMIN"),
	deleteAccountController
);

//? Restore
router.put(
	"/restore/:id",
	loginAuth,
	verifyRoleOnly("ADMIN"),
	restoreAccountController
);

//* Export Route
module.exports = router;
