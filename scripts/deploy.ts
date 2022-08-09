import { ethers } from "hardhat";

async function main() {
  const VoterToken = await ethers.getContractFactory("VoterToken");
  const voterToken = await VoterToken.deploy();

  await voterToken.deployed();

  console.log(`VoterToken deployed to ${voterToken.address}`);

  const startTime = (await ethers.provider.getBlock("latest")).timestamp;
    const endTime = (await ethers.provider.getBlock("latest")).timestamp + 60*60*24;

    const Vote = await ethers.getContractFactory("Vote");
    const voter = await Vote.deploy(voterToken.address, startTime, endTime);
    await voter.deployed();

    console.log(`Vote deployed to ${voter.address} with ${voterToken.address}, ${startTime}, ${endTime}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});