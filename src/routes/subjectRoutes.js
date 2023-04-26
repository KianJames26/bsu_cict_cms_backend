//* PACKAGE IMPORTS
const express = require("express");
const router = express.Router();

//* CONTROLLER IMPORTS

const {
	createSubjectController,
	getSubjectController,
	getSubjectsController,
	updateSubjectController,
	deleteSubjectController,
	restoreSubjectController,
} = require("../controllers/subjectControllers");

//* MIDDLEWARE IMPORTS
const loginAuth = require("../middleware/loginAuth");
const { verifyRoles } = require("../middleware/roleAuth");

//* HELPER IMPORTS

//* ROUTES

//! Subject Manipulation Routes
//? Create
router.post(
	"/",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	createSubjectController
);

//? Read
router
	.get("/", loginAuth, verifyRoles(["CHAIR", "MEMBER"]), getSubjectsController)
	.get(
		"/:subjectCode",
		loginAuth,
		verifyRoles(["CHAIR", "MEMBER"]),
		getSubjectController
	);

//? Update
router.put(
	"/:subjectCode",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	updateSubjectController
);

//? Delete
router.delete(
	"/:subjectCode",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	deleteSubjectController
);

//? Restore
router.put(
	"restore/:subjectCode",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	restoreSubjectController
);

module.exports = router;
