//* PACKAGE IMPORTS
const express = require("express");
const router = express.Router();

//* CONTROLLER IMPORTS
const {
	addSubjectController,
	removeSubjectController,
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
module.exports = router;
