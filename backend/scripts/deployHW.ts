import { ethers } from "hardhat";

async function main() {
  const HW = await ethers.getContractFactory("HelloWorld");
  const hw = await HW.deploy();
  await hw.deployed();
  console.log(`HW deploy message: ${await hw.getMessage()}`);
  await hw.setMessage("Connectivity with smart contract successfull");
  console.log(`HW changed message: ${await hw.getMessage()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
