const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const User = require("../models/userModel");
const generateOTP = require("../utils/generateOTP");
const Mailer = require("../utils/sendMail");
const signUp = async (req, res, next) => {
  try {
    const { email } = req.body;
    const oldUser = await User.findOne({ email: email });
    if (oldUser) {
      return next("Email already exists.");
    }
    let userObj;
    userObj = { ...req.body };
    const otpVal = generateOTP();
    const emailVerificationMssg = `<h3>Please enter the otp for logging in.</h3>
    <h3>${otpVal}</h3>
    `;
    userObj.otp = otpVal;
    userObj.otpExpiry = Date.now() + 5 * 60 * 1000;
    await Mailer(email, emailVerificationMssg, "Email verification");
    const user = await User.create(userObj);
    res.status(200).json({
      status: "success",
      user,
    });
  } catch (error) {
    return next(error.message);
  }
};

const verifyOTP = async (req, res, next) => {
  const { otp } = req.body;
  const user = await User.findOne({
    otp: otp,
    otpExpiry: { $gt: Date.now() },
  });
  try {
    if (!user) {
      return next("OTP is invalid or expired");
    }
    user.verified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.save({ validateBeforeSave: false });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });
    res
      .status(200)
      .cookie("jwt_auth", token, {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: false,
      })
      .json({
        status: "success",
        otp,
      });
  } catch (error) {
    user.verified = false;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.save({ validateBeforeSave: false });
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return next("Account does not exist, please create an account.");
    }
    if (!user.verified) {
      return next("Please verify your email account");
    }
    if (!user.correctPassword(password)) {
      return next("Invalid email or password");
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRY,
    });
    // res.cookie("jwt", token, {
    //   expires: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    //   httpOnly: true,
    //   secure: false,
    // });
    res
      .status(200)
      .cookie("jwt_auth", token, {
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      })
      .json({
        status: "success",
        token,
      });
  } catch (error) {
    return next(error.message);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.status(200).json({
      status: "success",
      users,
    });
  } catch (error) {
    return next(error);
  }
};

const protect = async (req, res, next) => {
  try {
    const { jwt_auth } = req.cookies;
    // console.log(jwt_auth, "welcome to my website");
    // const { token } = req.headers;
    // if (!token) {
    //   return next("You need to login!");
    // }
    // const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    if (!jwt_auth) {
      return next("You need to login!");
    }
    const decoded = await promisify(jwt.verify)(
      jwt_auth,
      process.env.JWT_SECRET
    );

    if (!decoded) {
      return next("Something went wrong, please try again later.");
    }

    const currentUser = await User.findOne({ _id: decoded.id });
    if (!currentUser) {
      return next("The user with this token does not exist");
    }
    // console.log(currentUser.jwtExpired(decoded.iat));
    if (currentUser.jwtExpired(decoded.iat)) {
      return next("User recently changed password, please log in again.");
    }
    req.user = currentUser;
    next();
  } catch (error) {
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email });
  try {
    if (!user) {
      return next("This accout does not exist, please create an account");
    }
    const token = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetPasswordUrl = `<a href="http://localhost:3000/resetPassword/${token}">Click here to reset password</a>
      <h4>If this above link doesn't work then copy this url to your browser.</h4>
      <h4>http://localhost:3000/resetPassword/${token}</h4>
    `;
    await Mailer(email, resetPasswordUrl, "Reset password");
    res.status(200).json({
      status: "success",
      message: "Password reset link has been sent to your email",
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;
    const hashToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashToken,
      resetPasswordTokenExpiry: { $gt: Date.now() },
    });
    if (!user) {
      return next("Token is invalid or expired");
    }
    user.password = password;
    user.confirmPassword = confirmPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;
    await user.save();
    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res, next) => {
  try {
    // console.log(req.cookies, "logout");
    // res.clearCookie("jwt_auth");
    res.cookie("jwt_auth", "loggedOut", {
      expires: new Date(Date.now() + 60 * 1000),
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    // console.log(req.cookies);
    res.status(200).json({
      status: "success",
      message: "user is logged out",
    });
  } catch (error) {
    return next(error);
  }
};

const getInfo = (req, res, next) => {
  res.status(200).json({
    status: "success",
    message: "conntected successfully",
  });
};

module.exports = {
  signUp,
  login,
  getAllUsers,
  protect,
  forgotPassword,
  resetPassword,
  logout,
  verifyOTP,
  getInfo,
};
