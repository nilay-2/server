const User = require("../models/userModel");

const getClientDetails = async (req, res, next) => {
  try {
    res.status(200).json({
      status: "success",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getAllUserOnQuery = async (req, res, next) => {
  try {
    const { username } = req.query;
    const regex = new RegExp(`${username}`);
    const users = await User.find({
      username: { $regex: regex, $options: "i" },
    });
    res.status(200).json({
      status: "success",
      data: {
        results: users.length + 1,
        users,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getClientDetails, getAllUserOnQuery };
