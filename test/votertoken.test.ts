import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { Vote } from "../typechain/Vote";
import { VoterToken } from "../typechain/VoterToken";

describe("VoterToken", function () {
  let acc1: Signer
  let acc2: Signer
  let votertoken: VoterToken

  beforeEach(async function () {
    [acc1, acc2] = await ethers.getSigners();

    const VoterToken = await ethers.getContractFactory("VoterToken", acc1);
    votertoken = await VoterToken.deploy();
    await votertoken.deployed();

    const choice1Tx = await votertoken.safeMint(await acc1.getAddress());
    // wait until the transaction is mined
    await choice1Tx.wait();
  })

  it("verify registered voters can vote", async function () {
    expect(await votertoken.balanceOf(await acc1.getAddress())).to.equal(1);
  });

  it("verify only registered voters can vote", async function () {
    expect(await votertoken.balanceOf(await acc2.getAddress())).to.equal(0);
  });

  describe("transferFrom", function () {
    it("transferFrom is not supported", async function () {
      await expect(votertoken.transferFrom(await acc1.getAddress(), await acc2.getAddress(), 1)).to.be
        .revertedWithCustomError(votertoken, 'NotSupported');
    });
  });

  describe("safeTransferFrom", function () {
    it("safeTransferFrom is not supported", async function () {
      await expect(votertoken["safeTransferFrom(address,address,uint256)"](await acc1.getAddress(), await acc2.getAddress(), 1)).to.be
        .revertedWithCustomError(votertoken, 'NotSupported');
    });
  });

  describe("safeTransferFrom with data", function () {
    var bytes = new Uint8Array(1024);
    it("safeTransferFrom is not supported", async function () {
      await expect(votertoken["safeTransferFrom(address,address,uint256,bytes)"](await acc1.getAddress(), await acc2.getAddress(), 1, bytes)).to.be
        .revertedWithCustomError(votertoken, 'NotSupported');
    });
  });

  describe("approve", function () {
    it("approve is not supported", async function () {
      await expect(votertoken.approve(await acc1.getAddress(), 1)).to.be
        .revertedWithCustomError(votertoken, 'NotSupported');
    });
  });

  describe("setApprovalForAll", function () {
    it("setApprovalForAll is not supported", async function () {
      await expect(votertoken.setApprovalForAll(await acc1.getAddress(), true)).to.be
        .revertedWithCustomError(votertoken, 'NotSupported');
    });
  });
});
