// Import the necessary packages
import { ethers } from "hardhat";
import { Contract } from "ethers";
import { expect } from "chai";

// Define a test suite for the HelloWorld contract
describe("HelloWorld", function () {
  let helloWorld: Contract;

  // Define a beforeEach hook to deploy the contract before each test
  beforeEach(async function () {
    const HelloWorld = await ethers.getContractFactory("HelloWorld");
    helloWorld = await HelloWorld.deploy();
    await helloWorld.deployed();
  });

  // Define a test case for the getMessage function
  describe("getMessage", function () {
    it("returns the message 'Hello, world!'", async function () {
      expect(await helloWorld.getMessage()).to.equal("Hello, world!");
    });
  });

  // Define a test case for the setMessage function
  describe("setMessage", function () {
    it("updates the message", async function () {
      const newMessage = "Hello, Hardhat!";
      await helloWorld.setMessage(newMessage);
      expect(await helloWorld.getMessage()).to.equal(newMessage);
    });
  });
});
