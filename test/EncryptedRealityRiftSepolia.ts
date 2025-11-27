import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { EncryptedRealityRift } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EncryptedRealityRiftSepolia", function () {
  let signers: Signers;
  let contract: EncryptedRealityRift;
  let contractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const deployment = await deployments.get("EncryptedRealityRift");
      contractAddress = deployment.address;
      contract = await ethers.getContractAt("EncryptedRealityRift", deployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("registers and guesses on Sepolia", async function () {
    steps = 10;

    this.timeout(4 * 40000);

    progress("Calling registerPlayer...");
    const registerTx = await contract.connect(signers.alice).registerPlayer();
    await registerTx.wait();

    progress(`Fetching encrypted score for ${signers.alice.address}...`);
    const encryptedScore = await contract.getPlayerScore(signers.alice.address);
    expect(encryptedScore).to.not.eq(ethers.ZeroHash);

    progress(`Decrypting score=${encryptedScore}...`);
    const clearScoreBefore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScore,
      contractAddress,
      signers.alice,
    );
    progress(`Decrypted score=${clearScoreBefore}`);

    progress("Encrypting monster choice '2'...");
    const encryptedChoice = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add8(2)
      .encrypt();

    progress(
      `Calling guessMonster handle=${ethers.hexlify(encryptedChoice.handles[0])} signer=${signers.alice.address}...`,
    );
    const tx = await contract
      .connect(signers.alice)
      .guessMonster(encryptedChoice.handles[0], encryptedChoice.inputProof);
    await tx.wait();

    progress("Fetching encrypted score after guess...");
    const encryptedScoreAfter = await contract.getPlayerScore(signers.alice.address);

    progress(`Decrypting score=${encryptedScoreAfter}...`);
    const clearScoreAfter = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScoreAfter,
      contractAddress,
      signers.alice,
    );
    progress(`Decrypted score=${clearScoreAfter}`);

    expect(clearScoreAfter - clearScoreBefore).to.eq(10);
  });
});
