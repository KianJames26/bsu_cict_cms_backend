//* PACKAGE IMPORTS
const express = require("express");
const router = express.Router();

//* CONTROLLER IMPORTS
const {
	createCurriculumController,
	getCurriculumsController,
	getCurriculumController,
	updateCurriculumController,
} = require("../controllers/curriculumController");

//* MIDDLEWARE IMPORTS
const loginAuth = require("../middleware/loginAuth");
const { verifyRoles } = require("../middleware/roleAuth");

//* ROUTES

//! CURRICULUM MANIPULATION ROUTES
//? CREATE
router.post("/", loginAuth, verifyRoles(["CHAIR"]), createCurriculumController);

//? READ
router.get(
	"/",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	getCurriculumsController
);
router.get(
	"/:id",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	getCurriculumController
);

//? UPDATE
router.put(
	"/:id",
	loginAuth,
	verifyRoles(["CHAIR", "MEMBER"]),
	updateCurriculumController
);
module.exports = router;
