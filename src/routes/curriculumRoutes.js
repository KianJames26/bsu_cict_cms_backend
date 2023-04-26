//* PACKAGE IMPORTS
const express = require("express");
const router = express.Router();

//* CONTROLLER IMPORTS
const {
	createCurriculumController,
} = require("../controllers/curriculumController");

//* MIDDLEWARE IMPORTS
const loginAuth = require("../middleware/loginAuth");
const { verifyRoles } = require("../middleware/roleAuth");

//* ROUTES

//! CURRICULUM MANIPULATION ROUTES
//? CREATE
router.post("/", loginAuth, verifyRoles(["CHAIR"]), createCurriculumController);

module.exports = router;
