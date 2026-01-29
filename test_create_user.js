const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./modules/user");

const createTestUser = async () => {
  const email = "demo@gmail.com";
  const password = "1234";
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name: "Demo User",
    email,
    password: hashedPassword,
    userType: "Property Seeker",
  });

  try {
    await newUser.save();
    console.log("Test user created successfully");
  } catch (error) {
    console.error("Error creating test user:", error);
  } finally {
    mongoose.connection.close();
  }
};

mongoose
  .connect("mongodb://localhost:27017/database", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(createTestUser)
  .catch((err) => console.error("MongoDB connection error:", err));
