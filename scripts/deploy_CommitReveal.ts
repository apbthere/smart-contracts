import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
  
    const balance = await deployer.getBalance();
    console.log("Account balance:", balance.toString());
    
    const commitRevealFactory = await ethers.getContractFactory("CommitReveal");
    const commitReveal = await commitRevealFactory.deploy();

    await commitReveal.deployed();

    console.log(`commitReveal deployed to ${commitReveal.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});