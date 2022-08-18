import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { Vote } from "../typechain/Vote";
import { VoterToken } from "../typechain/VoterToken";

describe("Vote", function () {
  let acc1: Signer
  let acc2: Signer
  let voter: Vote
  let votertoken: VoterToken

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();

    const VoterToken = await ethers.getContractFactory("VoterToken", acc1);
    votertoken = await VoterToken.deploy();
    await votertoken.deployed();

    const mintTx = await votertoken.safeMint(await acc1.getAddress());
    // wait until the transaction is mined
    await mintTx.wait();

    const startTime = (await ethers.provider.getBlock("latest")).timestamp - 1;
    const endTime = (await ethers.provider.getBlock("latest")).timestamp + 60 * 60 * 24;

    const Vote = await ethers.getContractFactory("Vote", acc1);
    voter = await Vote.deploy(votertoken.address, startTime, endTime);
    await voter.deployed();

    const choice1Tx = await voter.addChoice("Election", "Bob");
    // wait until the transaction is mined
    await choice1Tx.wait();

    const choice2Tx = await voter.addChoice("Election", "Dick");
    // wait until the transaction is mined
    await choice2Tx.wait();

    const choice3Tx = await voter.addChoice("Election", "Alex");
    // wait until the transaction is mined
    await choice3Tx.wait();
  })

  describe("Contract", function () {
    it("Verify contract can't be deploy if end time is before start time", async function () {
      const startTime = (await ethers.provider.getBlock("latest")).timestamp - 60 * 60 * 23;
      const endTime = (await ethers.provider.getBlock("latest")).timestamp - 60 * 60 * 24;

      const Vote = await ethers.getContractFactory("Vote", acc1);
      await expect(Vote.deploy(votertoken.address, startTime, endTime)).to.be
        .revertedWith("startTime must be before endTime");
    });
  });

  it("Verify only admin can add choices", async function () {
    await expect(voter.connect(acc2).addChoice("Election", "Bob")).to.be
      .revertedWith('Unathorized');
  })

  it("Verify choices are unique", async function () {
    await expect(voter.addChoice("Election", "Bob")).to.be
      .revertedWith('Duplicate choice');
  })

  describe("vote", function () {
    it("Verify voter can only vote after the election begins", async function () {
      const startTime = (await ethers.provider.getBlock("latest")).timestamp + 60 * 10;
      const endTime = (await ethers.provider.getBlock("latest")).timestamp + 60 * 60 * 24;

      const Vote = await ethers.getContractFactory("Vote", acc1);
      voter = await Vote.deploy(votertoken.address, startTime, endTime);
      await voter.deployed();

      await expect(voter.vote("Election", "Alex")).to.be
        .revertedWith('Election has not started yet.');
    });

    it("Verify voter can only vote before the election ends", async function () {
      const startTime = (await ethers.provider.getBlock("latest")).timestamp - 60 * 60 * 23;
      const endTime = (await ethers.provider.getBlock("latest")).timestamp - 60 * 60 * 22;

      const Vote = await ethers.getContractFactory("Vote", acc1);
      voter = await Vote.deploy(votertoken.address, startTime, endTime);
      await voter.deployed();

      await expect(voter.vote("Election", "Alex")).to.be
        .revertedWith('Election has ended.');
    });

    it("verify vote emits event", async function () {
      await expect(voter.connect(acc1).vote("Election", "Alex"))
        .to.emit(voter, 'Voted')
        .withArgs("Election", "Alex");
    });

    it("verify registered voters can vote", async function () {
      expect(await voter.getCurrentVotes("Election", "Alex")).to.equal(0);

      const voteTx = await voter.connect(acc1).vote("Election", "Alex");
      await voteTx.wait();

      expect(await voter.getCurrentVotes("Election", "Alex")).to.equal(1);
    });

    it("verify only registered voters can vote 1", async function () {
      await expect(voter.connect(acc2).vote("Election", "Alex")).to.be
        .revertedWith('Not a registered voter');
    });

    it("Should only allow voting for known choices", async function () {
      await expect(voter.connect(acc1).vote("Election", "Joe")).to.be
        .revertedWith('Invalid choice');
    });

    it("Should declare Alex a winner", async function () {
      const voteTx = await voter.connect(acc1).vote("Election", "Alex");
      await voteTx.wait();

      const mintTx = await votertoken.safeMint(await acc2.getAddress());
      // wait until the transaction is mined
      await mintTx.wait();

      const voteTx2 = await voter.connect(acc2).vote("Election", "Bob");
      await voteTx2.wait();

      expect(await voter.getWinner("Election")).to.equal("Alex");
    });

    it("Should prevent duplicate voting", async function () {
      const voteTx = await voter.connect(acc1).vote("Election", "Bob");
      await voteTx.wait();

      await expect(voter.connect(acc1).vote("Election", "Alex")).to.be
        .revertedWith('Already voted');
    });

    it("Should not find a winner", async function () {
      expect(await voter.getWinner("Election")).to.be.empty;
    });
  });

});
