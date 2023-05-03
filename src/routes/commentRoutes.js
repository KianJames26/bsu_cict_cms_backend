//* PACKAGE IMPORTS
const express = require("express");
const router = express.Router();

//* CONTROLLER IMPORTS
const {
	addCommentController,
	getCommentsController,
	getCommentController,
} = require("../controllers/commentControllers");

//* MIDDLEWARE IMPORTS
const loginAuth = require("../middleware/loginAuth");
const { verifyRoles } = require("../middleware/roleAuth");
const { checkPublished } = require("../middleware/curriculumStatusCheck");

//* ROUTES

//! COMMENT MANIPULATION ROUTE
//? CREATE
router.post(
	"/:curriculumId",
	loginAuth,
	verifyRoles(["STAKEHOLDER"]),
	checkPublished,
	addCommentController
);
//? READ
router.get(
	"/:curriculumId",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER", "STAKEHOLDER"]),
	getCommentsController
);
router.get(
	"/:curriculumId/:commentId",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER", "STAKEHOLDER"]),
	getCommentController
);

module.exports = router;
