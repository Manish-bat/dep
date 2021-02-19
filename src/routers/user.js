const express = require("express");
const multer = require("multer");
const User = require("../models/user");
const auth = require("../middleware/auth");
const router = express.Router();

//! create user (Sign up)
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    const token = await user.generateAuthToken(); //* generate token
    //* 201 user created
    res.status(201).send({ user, token });
  } catch (error) {
    //* bad request
    res.status(400).send(error);
  }
});

//! find user to (Log in)
router.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByCredentials(email, password); //* find user
    const token = await user.generateAuthToken(); //* generate token
    await user.save();
    res.send({ user, token });
  } catch (error) {
    res.status(400).send("Unable to login");
  }
});

//! user (Log out - single session)
router.post("/users/logout", auth, async (req, res) => {
  try {
    const { user } = req;
    user.tokens = user.tokens.filter((token) => token.token !== req.token);
    await user.save();
    res.send("Successfully logged out");
  } catch (error) {
    res.status(500).send();
  }
});

//! user (Log out - All sessions)
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    const { user } = req;
    user.tokens = [];
    await user.save();
    res.status(200).send("Successfully logged out from all devices");
  } catch (error) {
    res.status(500).send();
  }
});

//! user profile
router.get("/users/me", auth, async (req, res) => {
  const { user } = req;
  res.send(user);
});

//! get user
router.get("/users/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    const user = await User.findById(_id);
    if (!user) {
      //* user not exists
      return res.status(404).send("user not found");
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

//! update user
router.patch("/users/me", auth, async (req, res) => {
  //* if user updates a property that doesn't exist
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age", "dob", "mobile", "gender"];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
  if (!isValidOperation) {
    return res.status(400).send("ERROR: Invalid Operation");
  }
  //*

  try {
    //* this change to able the hashing middleware to run (on save) on password if updated
    const { user } = req;
    updates.forEach((update) => (user[update] = req.body[update]));
    await user.save();
    //*
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

//! delete user
router.delete("/users/me", auth, async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (error) {
    req.status(404).send();
  }
});



module.exports = router;
