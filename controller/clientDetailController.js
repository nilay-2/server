const User = require("../models/userModel");
const multer = require("multer");
const sharp = require("sharp");
exports.getClientDetails = async (req, res, next) => {
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

exports.getAllUserOnQuery = async (req, res, next) => {
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

const multerStorage = multer.memoryStorage();
const upload = multer({
  storage: multerStorage,
});

exports.fileParser = upload.single("file");

exports.resizeUserPhoto = async (req, res, next) => {
  console.log(req.file);
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  const file = await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 });
  // .toFile(`public/img/users/${req.file.filename}`);
  console.log(file);
  next();
};

exports.fileUploader = (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "file uploaded successfully",
    file: req.file,
  });
};
