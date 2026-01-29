const axios = require("axios");
const BASE_URL = "http://localhost:5002/api/properties";

const testPropertyValidation = async () => {
  console.log("Testing property creation validation...\n");

  try {
    // Test with missing required fields
    console.log("1. Testing with missing required fields:");
    let response = await axios.post(BASE_URL, {});
    console.log("Unexpected success:", response.data);
  } catch (error) {
    if (error.response) {
      console.log(
        "Error response:",
        error.response.status,
        error.response.data
      );
    } else {
      console.log("Error:", error.message);
    }
  }

  console.log("\n2. Testing with invalid data types:");
  try {
    let response = await axios.post(BASE_URL, {
      title: 123, // Invalid type
      description: "A beautiful test property.",
      type: "Flat",
      location: "Test Location",
      price: "not_a_number", // Invalid type
      bedrooms: 2,
      bathrooms: 1,
      area: 1000,
      amenities: ["WiFi"],
    });
    console.log("Unexpected success:", response.data);
  } catch (error) {
    if (error.response) {
      console.log(
        "Error response:",
        error.response.status,
        error.response.data
      );
    } else {
      console.log("Error:", error.message);
    }
  }

  console.log("\n3. Testing with authentication (should work):");
  try {
    // This will fail without auth token, but let's see the response
    let response = await axios.post(BASE_URL, {
      title: "Test Property",
      description: "A beautiful test property.",
      type: "Flat",
      location: "Test Location",
      price: 10000,
      bedrooms: 2,
      bathrooms: 1,
      area: 1000,
      amenities: ["WiFi", "Parking"],
    });
    console.log("Success:", response.data);
  } catch (error) {
    if (error.response) {
      console.log(
        "Auth error (expected):",
        error.response.status,
        error.response.data
      );
    } else {
      console.log("Error:", error.message);
    }
  }
};

testPropertyValidation();
