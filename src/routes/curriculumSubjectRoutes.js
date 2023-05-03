//* PACKAGE IMPORTS
const express = require("express");
const router = express.Router();

//* CONTROLLER IMPORTS
const {
	addSubjectController,
	removeSubjectController,
	getPrerequisiteController,
	getCorequisiteController,
} = require("../controllers/curriculumSubjectControllers");

//* MIDDLEWARE IMPORTS
const loginAuth = require("../middleware/loginAuth");
const { verifyRoles } = require("../middleware/roleAuth");
const { checkOngoing } = require("../middleware/curriculumStatusCheck");

//* ROUTES

//! Curriculum Subject Manipulation
//? Add Subject
router.post(
	"/:curriculumId",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	checkOngoing,
	addSubjectController
);

//? Remove Subject
router.delete(
	"/:curriculumId/:subjectCode",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	checkOngoing,
	removeSubjectController
);

//! Prerequisites and Corequisites
//? Get prerequisites
router.get(
	"/prerequisites/:prerequisiteId",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	getPrerequisiteController
);

//? Get corequisites
router.get(
	"/corequisites/:corequisiteId",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	getCorequisiteController
);
module.exports = router;
