import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Vote", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployVoteFixture() {
    const [acc1, acc2] = await ethers.getSigners();

    const VoterToken = await ethers.getContractFactory("VoterToken", acc1);
    const votertoken = await VoterToken.deploy();
    await votertoken.deployed();

    const mintTx = await votertoken.safeMint(await acc1.getAddress());
    // wait until the transaction is mined
    await mintTx.wait();

    const startTime = (await time.latest()) - 1;
    const endTime = (await time.latest()) + 60 * 60 * 24;

    const Vote = await ethers.getContractFactory("Vote", acc1);
    const voter = await Vote.deploy(votertoken.address, startTime, endTime);
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

    return { acc1, acc2, voter, votertoken };
  }

  describe("Contract", function () {
    it("Verify contract can't be deploy if end time is before start time", async function () {
      const { acc1, votertoken } = await loadFixture(deployVoteFixture);

      const startTime = (await time.latest()) - 60 * 60 * 23;
      const endTime = (await time.latest()) - 60 * 60 * 24;

      const Vote = await ethers.getContractFactory("Vote", acc1);
      await expect(Vote.deploy(votertoken.address, startTime, endTime)).to.be
        .revertedWith("startTime must be before endTime");
    });
  });

  it("Verify only admin can add choices", async function () {
    const { acc2, voter } = await loadFixture(deployVoteFixture);

    await expect(voter.connect(acc2).addChoice("Election", "Bob")).to.be
      .revertedWith('Unathorized');
  })

  it("Verify choices are unique", async function () {
    const { voter } = await loadFixture(deployVoteFixture);

    await expect(voter.addChoice("Election", "Bob")).to.be
      .revertedWith('Duplicate choice');
  })

  describe("vote", function () {
    it("Verify voter can only vote after the election begins", async function () {
      const { acc1, votertoken } = await loadFixture(deployVoteFixture);

      const startTime = (await time.latest()) + 60 * 10;
      const endTime = (await time.latest()) + 60 * 60 * 24;

      const Vote = await ethers.getContractFactory("Vote", acc1);
      const voter = await Vote.deploy(votertoken.address, startTime, endTime);
      await voter.deployed();

      await expect(voter.vote("Election", "Alex")).to.be
        .revertedWith('Election has not started yet.');
    });

    it("Verify voter can only vote before the election ends", async function () {
      const { acc1, votertoken } = await loadFixture(deployVoteFixture);

      const startTime = (await time.latest()) - 60 * 60 * 23;
      const endTime = (await time.latest()) - 60 * 60 * 22;

      const Vote = await ethers.getContractFactory("Vote", acc1);
      const voter = await Vote.deploy(votertoken.address, startTime, endTime);
      await voter.deployed();

      await expect(voter.vote("Election", "Alex")).to.be
        .revertedWith('Election has ended.');
    });

    it("verify vote emits event", async function () {
      const { acc1, voter } = await loadFixture(deployVoteFixture);

      await expect(voter.connect(acc1).vote("Election", "Alex"))
        .to.emit(voter, 'Voted')
        .withArgs("Election", "Alex");
    });

    it("verify registered voters can vote", async function () {
      const { acc1, voter } = await loadFixture(deployVoteFixture);

      expect(await voter.getCurrentVotes("Election", "Alex")).to.equal(0);

      const voteTx = await voter.connect(acc1).vote("Election", "Alex");
      await voteTx.wait();

      expect(await voter.getCurrentVotes("Election", "Alex")).to.equal(1);
    });

    it("verify only registered voters can vote 1", async function () {
      const { acc2, voter } = await loadFixture(deployVoteFixture);

      await expect(voter.connect(acc2).vote("Election", "Alex")).to.be
        .revertedWith('Not a registered voter');
    });

    it("Should only allow voting for known choices", async function () {
      const { acc1, voter } = await loadFixture(deployVoteFixture);

      await expect(voter.connect(acc1).vote("Election", "Joe")).to.be
        .revertedWith('Invalid choice');
    });

    it("Should declare Alex a winner", async function () {
      const { acc1, acc2, voter, votertoken } = await loadFixture(deployVoteFixture);

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
      const { acc1, voter } = await loadFixture(deployVoteFixture);

      const voteTx = await voter.connect(acc1).vote("Election", "Bob");
      await voteTx.wait();

      await expect(voter.connect(acc1).vote("Election", "Alex")).to.be
        .revertedWith('Already voted');
    });

    it("Should not find a winner", async function () {
      const { voter } = await loadFixture(deployVoteFixture);

      expect(await voter.getWinner("Election")).to.be.empty;
    });

    it("Should return all votes", async function () {
       const { acc1, acc2, voter, votertoken } = await loadFixture(deployVoteFixture);

      const voteTx = await voter.connect(acc1).vote("Election", "Alex");
      await voteTx.wait();

      const mintTx = await votertoken.safeMint(await acc2.getAddress());
      // wait until the transaction is mined
      await mintTx.wait();

      const voteTx2 = await voter.connect(acc2).vote("Election", "Bob");
      await voteTx2.wait();

      const votes = await voter.getAllVotes("Election");

      console.log(votes);

      expect(votes).to.have.lengthOf(2);
      expect(votes[0]).to.include.members(["Alex", "Bob", "Dick"]);

      const bobIndex = votes[0].findIndex((vote) => vote === "Bob");
      const alexIndex = votes[0].findIndex((vote) => vote === "Alex");
      const dickIndex = votes[0].findIndex((vote) => vote === "Dick");

      expect(votes[1][bobIndex]).to.be.equal(1);
      expect(votes[1][alexIndex]).to.be.equal(1);
      expect(votes[1][dickIndex]).to.be.equal(0);
    });
  });

});
