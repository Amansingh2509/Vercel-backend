const axios = require("axios");
const BASE_URL = "http://localhost:5002/api/properties";
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ODQ4YzUzMGEyMmEyY2UwMGNjY2RjNyIsImlhdCI6MTc1NjE1NDQwOCwiZXhwIjoxNzU2MjQwODA4fQ.9KVQKn3GvgSphomrCobSxRWQiRDThwGNJT-ewJXgWJ8";

const testPropertyWithAuth = async () => {
  console.log("Testing property creation with authentication...\n");

  const headers = {
    Authorization: `Bearer ${TOKEN}`,
  };

  try {
    // Test with valid data
    console.log("1. Testing with valid data:");
    let response = await axios.post(
      BASE_URL,
      {
        title: "Test Property with Auth",
        description: "A beautiful test property created with authentication.",
        type: "Flat",
        location: "Test Location City",
        price: 15000,
        bedrooms: 3,
        bathrooms: 2,
        area: 1200,
        amenities: ["WiFi", "Parking", "Air Conditioning"],
        furnished: "Furnished",
        parking: "Available",
      },
      { headers }
    );

    console.log("Success:", response.data);
  } catch (error) {
    if (error.response) {
      console.log(
        "Error response for valid data:",
        error.response.status,
        error.response.data
      );
    } else {
      console.log("Error for valid data:", error.message);
    }
  }

  console.log("\n2. Testing with missing required fields:");
  try {
    let response = await axios.post(
      BASE_URL,
      {
        // Missing required fields like title, type, location, etc.
        description: "A property with missing required fields",
        price: 10000,
      },
      { headers }
    );
    console.log("Unexpected success:", response.data);
  } catch (error) {
    if (error.response) {
      console.log(
        "Error response for missing fields:",
        error.response.status,
        error.response.data
      );
    } else {
      console.log("Error for missing fields:", error.message);
    }
  }

  console.log("\n3. Testing with invalid data types:");
  try {
    let response = await axios.post(
      BASE_URL,
      {
        title: 123, // Invalid type (should be string)
        description: "A beautiful test property.",
        type: "Flat",
        location: "Test Location",
        price: "not_a_number", // Invalid type (should be number)
        bedrooms: 2,
        bathrooms: 1,
        area: 1000,
        amenities: ["WiFi"],
      },
      { headers }
    );
    console.log("Unexpected success:", response.data);
  } catch (error) {
    if (error.response) {
      console.log(
        "Error response for invalid data types:",
        error.response.status,
        error.response.data
      );
    } else {
      console.log("Error for invalid data types:", error.message);
    }
  }
};

testPropertyWithAuth();
