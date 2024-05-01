import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CommitReveal", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCommitRevealFixture() {
    const [acc1, acc2] = await ethers.getSigners();

    const CommitReveal = await ethers.getContractFactory("CommitReveal", acc1);
    const commitreveal = await CommitReveal.deploy();
    await commitreveal.deployed();

    return { acc1, acc2, commitreveal };
  }

  // add test for commitVote
    describe("commitVote", function () {
        it("Verify commitVote", async function () {
        const { acc1, commitreveal } = await loadFixture(deployCommitRevealFixture);
    
        // calculate the hash of the vote to include move, secret and acc1 address  the same way as revealVote method
        const secret = ethers.utils.formatBytes32String("supersecret");
        const address = await acc1.getAddress();
        const hash = ethers.utils.solidityKeccak256(["uint8", "bytes32", "address"], [1, secret, address]);

        console.log(hash);

        const commitTx = await commitreveal.commitVote(hash);
        // wait until the transaction is mined
        await commitTx.wait();
    
        expect(await commitreveal.getCommit(address)).to.equal(hash);

        // stop voting
        await commitreveal.stopVoting();

        // verify reveal
        const revealTx = await commitreveal.revealVote(1, secret);
        // wait until the transaction is mined  
        await revealTx.wait();
        // expect event to be emitted
        expect(revealTx).to.emit(commitreveal, "Reveal").withArgs(hash);
        });
    });

    it("Verify revealVote can only be called after voting ends", async function () {
        const { acc1, commitreveal } = await loadFixture(deployCommitRevealFixture);
    
        // calculate the hash of the vote to include move, secret and acc1 address  the same way as revealVote method
        const secret = ethers.utils.formatBytes32String("supersecret");
        const address = await acc1.getAddress();
        const hash = ethers.utils.solidityKeccak256(["uint8", "bytes32", "address"], [1, secret, address]);

        const commitTx = await commitreveal.commitVote(hash);
        // wait until the transaction is mined
        await commitTx.wait();
    
        expect(await commitreveal.getCommit(address)).to.equal(hash);

        // expect transaction to be reverted
        await expect(commitreveal.revealVote(1, secret)).to.be.revertedWithoutReason();
    });

    // verify that stopVoting can only be called by the owner
    it("Verify stopVoting can only be called by the owner", async function () {
        const { acc2, commitreveal } = await loadFixture(deployCommitRevealFixture);
    
        // expect transaction to be reverted
        await expect(commitreveal.connect(acc2).stopVoting()).to.be.revertedWith('Ownable: caller is not the owner');
    });

    // verify that commitVote can only be called before voting ends
    it("Verify commitVote can only be called before voting ends", async function () {
        const { acc1, commitreveal } = await loadFixture(deployCommitRevealFixture);
    
        // calculate the hash of the vote to include move, secret and acc1 address  the same way as revealVote method
        const secret = ethers.utils.formatBytes32String("supersecret");
        const address = await acc1.getAddress();
        const hash = ethers.utils.solidityKeccak256(["uint8", "bytes32", "address"], [1, secret, address]);

        const commitTx = await commitreveal.commitVote(hash);
        // wait until the transaction is mined
        await commitTx.wait();
    
        expect(await commitreveal.getCommit(address)).to.equal(hash);

        // expect transaction to be reverted
        await expect(commitreveal.commitVote(hash)).to.be.revertedWithoutReason();
    });

    // verify that commitVote can only be called once
    it("Verify commitVote can only be called once", async function () {
        const { acc1, commitreveal } = await loadFixture(deployCommitRevealFixture);
    
        // calculate the hash of the vote to include move, secret and acc1 address  the same way as revealVote method
        const secret = ethers.utils.formatBytes32String("supersecret");
        const address = await acc1.getAddress();
        const hash = ethers.utils.solidityKeccak256(["uint8", "bytes32", "address"], [1, secret, address]);

        const commitTx = await commitreveal.commitVote(hash);
        // wait until the transaction is mined
        await commitTx.wait();
    
        expect(await commitreveal.getCommit(address)).to.equal(hash);

        // expect transaction to be reverted
        await expect(commitreveal.commitVote(hash)).to.be.revertedWithoutReason();
    });

    // verify that commitVote can only be called before voting ends
    it("Verify commitVote can only be called once", async function () {
        const { acc1, commitreveal } = await loadFixture(deployCommitRevealFixture);
    
        // calculate the hash of the vote to include move, secret and acc1 address  the same way as revealVote method
        const secret = ethers.utils.formatBytes32String("supersecret");
        const address = await acc1.getAddress();
        const hash = ethers.utils.solidityKeccak256(["uint8", "bytes32", "address"], [1, secret, address]);

        const commitTx = await commitreveal.commitVote(hash);
        // wait until the transaction is mined
        await commitTx.wait();
    
        expect(await commitreveal.getCommit(address)).to.equal(hash);

        // stop voting
        await commitreveal.stopVoting();

        // expect transaction to be reverted
        await expect(commitreveal.commitVote(hash)).to.be.revertedWithoutReason();
    });

    // verify that stopvoting can only be called once
    it("Verify stopVoting can only be called once", async function () {
        const { acc1, commitreveal } = await loadFixture(deployCommitRevealFixture);
    
        // stop voting
        await commitreveal.stopVoting();

        // expect transaction to be reverted
        await expect(commitreveal.stopVoting()).to.be.revertedWithoutReason();
    });

     it("Verify revealVote verifies the hash", async function () {
        const { acc1, commitreveal } = await loadFixture(deployCommitRevealFixture);
    
        // calculate the hash of the vote to include move, secret and acc1 address  the same way as revealVote method
        const secret = ethers.utils.formatBytes32String("supersecret");
        const address = await acc1.getAddress();
        const hash = ethers.utils.solidityKeccak256(["uint8", "bytes32", "address"], [1, secret, address]);

        const commitTx = await commitreveal.commitVote(hash);
        // wait until the transaction is mined
        await commitTx.wait();
    
        expect(await commitreveal.getCommit(address)).to.equal(hash);

        // stop voting
        await commitreveal.stopVoting();

        // expect transaction to be reverted
        await expect(commitreveal.revealVote(2, secret)).to.be.revertedWithoutReason();
    });
   });
