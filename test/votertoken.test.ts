import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("VoterToken", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployVoterTokenFixture() {
    const [acc1, acc2] = await ethers.getSigners();

    const VoterToken = await ethers.getContractFactory("VoterToken", acc1);
    const votertoken = await VoterToken.deploy();
    await votertoken.deployed();

    const choice1Tx = await votertoken.safeMint(await acc1.getAddress());
    // wait until the transaction is mined
    await choice1Tx.wait();

    return { votertoken, acc1, acc2 };
  }

  it("verify registered voters can vote", async function () {
    const { votertoken, acc1 } = await loadFixture(deployVoterTokenFixture);

    expect(await votertoken.balanceOf(await acc1.getAddress())).to.equal(1);
  });

  it("verify only registered voters can vote", async function () {
    const { votertoken, acc1, acc2 } = await loadFixture(deployVoterTokenFixture);

    expect(await votertoken.balanceOf(await acc2.getAddress())).to.equal(0);
  });

  describe("transferFrom", function () {
    it("transferFrom is not supported", async function () {
      const { votertoken, acc1, acc2 } = await loadFixture(deployVoterTokenFixture);

      await expect(votertoken.transferFrom(await acc1.getAddress(), await acc2.getAddress(), 1)).to.be
        .revertedWithCustomError(votertoken, 'NotSupported');
    });
  });

  describe("safeTransferFrom", function () {
    it("safeTransferFrom is not supported", async function () {
      const { votertoken, acc1, acc2 } = await loadFixture(deployVoterTokenFixture);

      await expect(votertoken["safeTransferFrom(address,address,uint256)"](await acc1.getAddress(), await acc2.getAddress(), 1)).to.be
        .revertedWithCustomError(votertoken, 'NotSupported');
    });
  });

  describe("safeTransferFrom with data", function () {
    var bytes = new Uint8Array(1024);
    it("safeTransferFrom is not supported", async function () {
      const { votertoken, acc1, acc2 } = await loadFixture(deployVoterTokenFixture);

      await expect(votertoken["safeTransferFrom(address,address,uint256,bytes)"](await acc1.getAddress(), await acc2.getAddress(), 1, bytes)).to.be
        .revertedWithCustomError(votertoken, 'NotSupported');
    });
  });

  describe("approve", function () {
    it("approve is not supported", async function () {
      const { votertoken, acc1 } = await loadFixture(deployVoterTokenFixture);

      await expect(votertoken.approve(await acc1.getAddress(), 1)).to.be
        .revertedWithCustomError(votertoken, 'NotSupported');
    });
  });

  describe("setApprovalForAll", function () {
    it("setApprovalForAll is not supported", async function () {
      const { votertoken, acc1 } = await loadFixture(deployVoterTokenFixture);

      await expect(votertoken.setApprovalForAll(await acc1.getAddress(), true)).to.be
        .revertedWithCustomError(votertoken, 'NotSupported');
    });
  });
});


