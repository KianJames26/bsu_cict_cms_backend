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
const curriculumStatusCheck = require("../middleware/curriculumStatusCheck");

//* ROUTES

//! Curriculum Subject Manipulation
//? Add Subject
router.post(
	"/:curriculumId",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	curriculumStatusCheck,
	addSubjectController
);

//? Remove Subject
router.delete(
	"/:curriculumId/:subjectCode",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	curriculumStatusCheck,
	removeSubjectController
);
module.exports = router;
