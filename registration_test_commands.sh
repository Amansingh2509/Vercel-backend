#!/bin/bash

# Test successful registration
echo "Testing successful registration..."
curl -X POST http://localhost:5001/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test User","email":"testuser@example.com","password":"password123","userType":"Property Owner"}'
echo -e "\n"

# Test duplicate email registration
echo "Testing duplicate email registration..."
curl -X POST http://localhost:5001/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test User","email":"testuser@example.com","password":"password123","userType":"Property Owner"}'
echo -e "\n"

# Test missing fields (error case)
echo "Testing registration with missing fields..."
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test User","email":"","password":"password123","userType":"Property Owner"}'
echo -e "\n"
