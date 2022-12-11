const express = require("express");
const clientDetailController = require("../controller/clientDetailController");
const userController = require("../controller/userController");
const router = express.Router();

router
  .route("/getClientDetails")
  .get(userController.protect, clientDetailController.getClientDetails);

router.route("/getUsers").get(clientDetailController.getAllUserOnQuery);
module.exports = router;
