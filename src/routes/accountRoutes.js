const express = require("express");
const router = express.Router();

const accountController = require("../controllers/accountControllers");
const loginAuth = require("../middleware/loginAuth");
const roleAuth = require("../middleware/roleAuth");

// *Routes

// !Login Route
router.post("/login", accountController.login);

// !Logout Route
router.post("/logout", loginAuth, accountController.logout);

// !Account Manipulation Route
router.post("/", loginAuth, roleAuth("ADMIN"), accountController.create);

//*Export Route
module.exports = router;
