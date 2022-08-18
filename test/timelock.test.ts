import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("TimeLock", function () {
    // encoded 'hello' string
    const DATA_VALUE = "0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000"

    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployTimeLockFixture() {
        const [acc1, acc2, acc3, acc4] = await ethers.getSigners();

        const TimeLockFactory = await ethers.getContractFactory("TimeLock", acc1);
        const timelock = await TimeLockFactory.deploy([await acc1.getAddress(), await acc2.getAddress(), await acc3.getAddress()]);
        await timelock.deployed();

        return { acc1, acc2, acc3, acc4, timelock };
    }

    describe("Contract", function () {
        it("Verify contract can't be deploied if not enough owners", async function () {
            const [acc1, acc2] = await ethers.getSigners();

            const TimeLockFactory = await ethers.getContractFactory("TimeLock", acc1);
            await expect(TimeLockFactory.deploy([await acc1.getAddress(), await acc2.getAddress()]))
                .to.be
                .revertedWith("Not enough owners!");
        })

        it("Verify contract can't be deploied if 0 address is provided as an owner", async function () {
            const [acc1, acc2] = await ethers.getSigners();

            const TimeLockFactory = await ethers.getContractFactory("TimeLock", acc1);
            await expect(TimeLockFactory.deploy([await acc1.getAddress(),
            await acc2.getAddress(),
            ethers.constants.AddressZero]))
                .to.be
                .revertedWith("Can't have zero address as owner!");
        })

        it("Verify contract can't be deploied if duplicate owners", async function () {
            const [acc1, acc2] = await ethers.getSigners();

            const TimeLockFactory = await ethers.getContractFactory("TimeLock", acc1);
            await expect(TimeLockFactory.deploy([await acc1.getAddress(), await acc2.getAddress(), await acc2.getAddress()]))
                .to.be
                .revertedWith("Duplicate owner!");
        })

        describe("addToQueue", function () {
            it("Verify transaction can be added", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                await expect(timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ))
                    .to.emit(timelock, 'Queued');
            })

            it("Verify transaction can only be added by owner", async function () {
                const { acc4, timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                await expect(timelock.connect(acc4).addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                )).to.be.revertedWith('Not an owner!');
            })

            it("Verify transaction timestamp must be in the future", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest());

                await expect(timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                )).to.be.revertedWith('Invalid timestamp');
            })

            it("Verify transaction timestamp must be less then current block timestamp + MAXIMUM_DELAY", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 720000;

                await expect(timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                )).to.be.revertedWith('Invalid timestamp');
            })

            it("Verify transaction can be added only once", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                await expect(timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ))
                    .to.emit(timelock, 'Queued');

                await expect(timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                )).to.be.revertedWith('Already queued');
            })
        })

        describe("confirm", function () {
            it("Verify transaction can be confirmed", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await timelock.confirm(txId);
            })

            it("Verify only scheduled transactions can be confirmed", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                await expect(timelock.confirm('0xa6cc05b415758ffca81a29998f7815b735be3d80d2546b7dc1afb6c19ddf3b48'))
                    .to.be.revertedWith('Not queued!');
            })

            it("Verify transaction can only be confirmed once", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await timelock.confirm(txId);

                await expect(timelock.confirm(txId))
                    .to.be.revertedWith('Already confirmed!');
            })
        })

        describe("execute", function () {
            it("Verify transaction can be executed", async function () {
                const { acc2, acc3, timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await timelock.confirm(txId);
                await timelock.connect(acc2).confirm(txId);
                await timelock.connect(acc3).confirm(txId);

                // We can increase the time in Hardhat Network
                await time.increase(60);

                await expect(timelock.execute(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp,
                    { value: ethers.utils.parseEther("0.5") }
                )).to.emit(timelock, 'Executed');

                expect(await timelock.message()).to.be.equal("hello");
            })
            it("Verify transaction sends funds", async function () {
                const { acc1, acc2, acc3, timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await timelock.confirm(txId);
                await timelock.connect(acc2).confirm(txId);
                await timelock.connect(acc3).confirm(txId);

                // We can increase the time in Hardhat Network
                await time.increase(60);

                const ethAmount = ethers.utils.parseEther("0.5");
                await expect(await timelock.execute(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp,
                    { value: ethAmount }
                )).to.changeEtherBalances([acc1, timelock],
                    [ethers.utils.parseEther("-0.5"), ethAmount]);
            })

            it("Verify transaction can be executed only after specified time", async function () {
                const { acc2, acc3, timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await timelock.confirm(txId);
                await timelock.connect(acc2).confirm(txId);
                await timelock.connect(acc3).confirm(txId);

                await expect(timelock.execute(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp,
                    { value: ethers.utils.parseEther("0.5") }
                )).to.be.revertedWith('too early');;
            })

            it("Verify transaction can be executed only before specified time", async function () {
                const { acc2, acc3, timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await timelock.confirm(txId);
                await timelock.connect(acc2).confirm(txId);
                await timelock.connect(acc3).confirm(txId);

                // We can increase the time in Hardhat Network
                await time.increase(600000);

                await expect(timelock.execute(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp,
                    { value: ethers.utils.parseEther("0.5") }
                )).to.be.revertedWith('tx expired');
            })

            it("Verify that only queued transaction can be executed", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                // We can increase the time in Hardhat Network
                await time.increase(60);

                await expect(timelock.execute(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp,
                    { value: ethers.utils.parseEther("0.5") }
                )).to.be.revertedWith('Not queued!');
            })

            it("Verify transaction can be executed only after receiving enough confirmations", async function () {
                const { acc2, timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await timelock.confirm(txId);
                await timelock.connect(acc2).confirm(txId);

                // We can increase the time in Hardhat Network
                await time.increase(60);

                await expect(timelock.execute(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp,
                    { value: ethers.utils.parseEther("0.5") }
                )).to.be.revertedWith('Not enough confirmations!');
            })

            it("Verify transaction can be executed without function", async function () {
                const { acc2, acc3, timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await timelock.confirm(txId);
                await timelock.connect(acc2).confirm(txId);
                await timelock.connect(acc3).confirm(txId);

                // We can increase the time in Hardhat Network
                await time.increase(60);

                await expect(timelock.execute(
                    timelock.address,
                    "",
                    DATA_VALUE,
                    1000,
                    nextTimestamp,
                    { value: ethers.utils.parseEther("0.5") }
                )).to.be.revertedWith('Call failed');
            })
        })

        describe("cancelConfirmation", function () {
            it("Verify transaction confirmation can be canceled", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await timelock.confirm(txId);

                expect(await timelock.cancelConfirmation(txId)).to.be.any;
            })

            it("Verify that only queued transactions can be canceled", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                await expect(timelock.cancelConfirmation('0xa6cc05b415758ffca81a29998f7815b735be3d80d2546b7dc1afb6c19ddf3b48'))
                    .to.be.revertedWith('Not queued!');
            })

            it("Verify that only confirmed transactions can be canceled", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await expect(timelock.cancelConfirmation(txId))
                    .to.be.revertedWith('Not confirmed!');
            })
        })

        describe("discard", function () {
            it("Verify transaction can be discarded", async function () {
                const { timelock } = await loadFixture(deployTimeLockFixture);

                const nextTimestamp = (await time.latest()) + 60;

                const tx = (await timelock.addToQueue(
                    timelock.address,
                    "demo(string)",
                    DATA_VALUE,
                    1000,
                    nextTimestamp
                ));

                const txReceipt = await tx.wait();
                const txId = txReceipt.logs[0].data;

                await expect(timelock.discard(txId))
                    .to.emit(timelock, 'Discarded');
            })
        })

        it("Verify only queued transaction can be discarded", async function () {
            const { timelock } = await loadFixture(deployTimeLockFixture);

            await expect(timelock.discard('0xa6cc05b415758ffca81a29998f7815b735be3d80d2546b7dc1afb6c19ddf3b48'))
                .to.be.revertedWith('Not queued!');
        })
    })
})