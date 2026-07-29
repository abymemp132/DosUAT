import { test as base } from "@playwright/test";

interface User {
  email: string;
  password?: string;
  name?: string;
}

interface City {
  name: string;
  code: string;
}

interface TestQuery {
  name: string;
  code: string;
}

interface TestData {
  users: User[];
  cities: City[];
  testQueries: TestQuery[];
  defaultCity: string;
  defaultUser: User;
}

export const testData: TestData = {
  users: [
    {
      email: process.env.LOGIN_EMAIL || "twkxl.test@inbox.testmail.app",
      name: "Test User"
    }
  ],
  cities: [
    { name: "Delhi", code: "DEL" },
    { name: "Mumbai", code: "MUM" },
    { name: "Bangalore", code: "BLR" },
    { name: "Chennai", code: "CHE" },
    { name: "Hyderabad", code: "HYD" },
    { name: "Kolkata", code: "CCU" },
    { name: "Pune", code: "PNQ" },
    { name: "Ahmedabad", code: "AMD" }
  ],
  testQueries: [
    { name: "Blood Test", code: "CBC" },
    { name: "Thyroid Profile", code: "T3" },
    { name: "Diabetes Screening", code: "HbA1c" },
    { name: "Lipid Profile", code: "LIPID" },
    { name: "Liver Function Test", code: "LFT" },
    { name: "Kidney Function Test", code: "KFT" },
    { name: "Vitamin D", code: "VITD" },
    { name: "Iron Studies", code: "FERRITIN" }
  ],
  defaultCity: "Delhi",
  defaultUser: {
    email: process.env.LOGIN_EMAIL || "twkxl.test@inbox.testmail.app",
    name: "Test User"
  }
};

// Helper functions
export function getUser(): User {
  return testData.defaultUser;
}

export function getCity(cityName?: string): City {
  const name = cityName || testData.defaultCity;
  return testData.cities.find(c => c.name.toLowerCase() === name.toLowerCase()) 
    || testData.cities[0];
}

export function getRandomCity(): City {
  const index = Math.floor(Math.random() * testData.cities.length);
  return testData.cities[index];
}

export function getTestQuery(name?: string): TestQuery {
  if (name) {
    return testData.testQueries.find(t => t.name.toLowerCase().includes(name.toLowerCase()))
      || testData.testQueries[0];
  }
  const index = Math.floor(Math.random() * testData.testQueries.length);
  return testData.testQueries[index];
}

// Extended test fixture with test data
export const test = base.extend<{
  testData: TestData;
  user: User;
  city: City;
  testQuery: TestQuery;
}>({
  testData: [testData, { option: true }],
  user: [testData.defaultUser, { option: true }],
  city: [getCity(), { option: true }],
  testQuery: [getTestQuery(), { option: true }]
});
