module.exports = (err, req, res, next) => {
  console.log(err);
  res.status(404).json({
    status: "failed",
    message: err,
  });
};
