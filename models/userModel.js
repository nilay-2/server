const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please enter a name"],
    minlength: 3,
  },
  email: {
    type: String,
    required: [true, "Please enter an email"],
    validate: [validator.isEmail, "Please enter a valid email address"],
    unique: [true, "Email already exists"],
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: 8,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please enter this field"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords do not match",
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordTokenExpiry: {
    type: Date,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
});

userSchema.methods.correctPassword = function (currentPassword) {
  return this.password === currentPassword;
};

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now();
  next();
});

userSchema.methods.jwtExpired = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const passChangeTime = this.passwordChangedAt.getTime() / 1000;
    // console.log("jwt", jwtTimeStamp, "pass", passChangeTime);
    return jwtTimeStamp < passChangeTime;
  }
};

userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
  this.resetPasswordTokenExpiry = Date.now() + 10 * 60 * 1000;
  return token;
};

const User = new mongoose.model("User", userSchema);
module.exports = User;
