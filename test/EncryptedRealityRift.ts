import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { EncryptedRealityRift, EncryptedRealityRift__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedRealityRift")) as EncryptedRealityRift__factory;
  const contract = (await factory.deploy()) as EncryptedRealityRift;
  const address = await contract.getAddress();

  return { contract, contractAddress: address };
}

describe("EncryptedRealityRift", function () {
  let signers: Signers;
  let contract: EncryptedRealityRift;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite cannot run on Sepolia Testnet");
      this.skip();
    }
    ({ contract, contractAddress } = await deployFixture());
  });

  async function decryptScore(player: HardhatEthersSigner) {
    const encryptedScore = await contract.getPlayerScore(player.address);
    if (encryptedScore === ethers.ZeroHash) {
      return 0;
    }

    return fhevm.userDecryptEuint(FhevmType.euint32, encryptedScore, contractAddress, player);
  }

  async function encryptGuess(player: HardhatEthersSigner, guess: number) {
    return fhevm.createEncryptedInput(contractAddress, player.address).add8(guess).encrypt();
  }

  it("registers new players with an encrypted score of 100", async function () {
    await expect(contract.connect(signers.alice).registerPlayer()).to.emit(contract, "PlayerRegistered");
    const score = await decryptScore(signers.alice);
    expect(score).to.equal(100);

    await expect(contract.connect(signers.alice).registerPlayer()).to.be.revertedWithCustomError(
      contract,
      "AlreadyRegistered",
    );
  });

  it("adds and subtracts points based on the encrypted guess", async function () {
    await contract.connect(signers.alice).registerPlayer();

    const correctGuess = await encryptGuess(signers.alice, 2);
    await contract
      .connect(signers.alice)
      .guessMonster(correctGuess.handles[0], correctGuess.inputProof);
    let score = await decryptScore(signers.alice);
    expect(score).to.equal(110);

    const wrongGuess = await encryptGuess(signers.alice, 4);
    await contract
      .connect(signers.alice)
      .guessMonster(wrongGuess.handles[0], wrongGuess.inputProof);
    score = await decryptScore(signers.alice);
    expect(score).to.equal(100);
  });

  it("prevents scores from going below zero and records last outcome", async function () {
    await contract.connect(signers.bob).registerPlayer();

    for (let i = 0; i < 12; i++) {
      const guess = await encryptGuess(signers.bob, 1);
      await contract.connect(signers.bob).guessMonster(guess.handles[0], guess.inputProof);
    }

    const finalScore = await decryptScore(signers.bob);
    expect(finalScore).to.equal(0);

    const encryptedOutcomeRaw = await contract.getLastOutcome(signers.bob.address);
    expect(encryptedOutcomeRaw).to.not.eq(ethers.ZeroHash);

    const state = await contract.getPlayerState(signers.bob.address);
    expect(state.gamesPlayed).to.equal(12);
    expect(state.registered).to.equal(true);
  });
});
