const axios = require("axios");

const getToken = async () => {
  try {
    const response = await axios.post("http://localhost:5002/api/auth/login", {
      email: "demo@gmail.com",
      password: "1234",
    });

    console.log("Token retrieved successfully:", response.data.token);
    return response.data.token;
  } catch (error) {
    console.error(
      "Error retrieving token:",
      error.response ? error.response.data : error.message
    );
  }
};

getToken();
