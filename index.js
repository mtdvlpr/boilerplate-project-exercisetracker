const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const crypto = require("crypto");

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const users = [];

const generateId = () => {
  return crypto.randomBytes(16).toString("hex");
};

app.get("/api/users", (req, res) => {
  res.json(users.map((user) => ({ username: user.username, _id: user._id })));
});

app.post("/api/users", (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  const newUser = { username, _id: generateId() };
  users.push(newUser);
  res.status(201).json(newUser);
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  const user = users.find((user) => user._id === _id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!description || !duration) {
    return res
      .status(400)
      .json({ error: "Description and duration are required" });
  }
  const newExercise = {
    description,
    duration: Number(duration),
    date: date ? new Date(date) : new Date(),
  };
  user.exercises = user.exercises || [];
  user.exercises.push(newExercise);
  res.status(201).json({ ...user, ...newExercise });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  const user = users.find((user) => user._id === _id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const logs = user.exercises || [];
  let filteredLogs = logs;
  if (from) {
    try {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.date) >= new Date(from)
      );
    } catch (e) {
      return res.status(400).json({ error: "Invalid date format for from" });
    }
  }
  if (to) {
    try {
      filteredLogs = filteredLogs.filter(
        (log) => new Date(log.date) <= new Date(to)
      );
    } catch (e) {
      return res.status(400).json({ error: "Invalid date format for to" });
    }
  }
  if (limit) {
    if (isNaN(+limit) || Number(limit) <= 0) {
      return res.status(400).json({ error: "Limit must be a positive number" });
    }
    filteredLogs = filteredLogs.slice(0, Number(limit));
  }
  res.json({
    _id: user._id,
    username: user.username,
    count: filteredLogs.length,
    log: filteredLogs.map((log) => ({
      description: log.description,
      duration: log.duration,
      date: log.date.toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
