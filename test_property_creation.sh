#!/bin/bash

# Test property creation with all fields
echo "Testing property creation with all fields..."
curl -X POST http://localhost:5001/api/properties -H "Content-Type: application/json" -d '{
  "owner": "605c72e4a81b9e0015c7d7d1",
  "title": "Test Property",
  "description": "A beautiful test property",
  "type": "Flat",
  "location": "123 Test Street, Test City, Test State, 12345",
  "price": 1500,
  "bedrooms": 2,
  "bathrooms": 2,
  "area": 1200,
  "image": "https://via.placeholder.com/400x200?text=Test+Property",
  "rating": 0,
  "amenities": ["WiFi", "Parking"],
  "securityDeposit": 2000,
  "maintenanceCharges": 200,
  "furnished": "Furnished",
  "parking": "Available"
}'
echo -e "\n"

echo "Test completed. Please check the response above to verify that the property was created successfully with all fields."
