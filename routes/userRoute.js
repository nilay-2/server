const express = require("express");
const userController = require("../controller/userController");
const router = express.Router();

router.route("/signUp").post(userController.signUp);
router.route("/login").post(userController.login);
router.route("/forgotPassword").post(userController.forgotPassword);
router.route("/resetPassword/:token").patch(userController.resetPassword);
router.route("/logout").post(userController.logout);
router.route("/verifyOTP").post(userController.verifyOTP);
router.route("/").get(userController.getInfo);
module.exports = router;
