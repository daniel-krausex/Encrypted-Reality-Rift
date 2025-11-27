import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const CONTRACT_NAME = "EncryptedRealityRift";

task("task:rift-address", "Prints the EncryptedRealityRift address").setAction(async function (_args, hre) {
  const deployment = await hre.deployments.get(CONTRACT_NAME);
  console.log(`${CONTRACT_NAME} address is ${deployment.address}`);
});

task("task:register-player", "Registers the sender as a player")
  .addOptionalParam("address", "Optional EncryptedRealityRift contract address")
  .setAction(async function (taskArgs: TaskArguments, hre) {
    const { ethers, deployments } = hre;
    const deployment = taskArgs.address ? { address: taskArgs.address } : await deployments.get(CONTRACT_NAME);
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const tx = await contract.connect(signer).registerPlayer();
    console.log(`Sent registerPlayer tx: ${tx.hash}`);
    await tx.wait();
    console.log("Registration complete");
  });

task("task:decrypt-score", "Decrypts the encrypted score for a player")
  .addOptionalParam("address", "Optional EncryptedRealityRift contract address")
  .addOptionalParam("player", "Player address, defaults to signer")
  .setAction(async function (taskArgs: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    const deployment = taskArgs.address ? { address: taskArgs.address } : await deployments.get(CONTRACT_NAME);
    const [signer] = await ethers.getSigners();
    const target = taskArgs.player ? (taskArgs.player as string) : signer.address;

    await fhevm.initializeCLIApi();

    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const encryptedScore = await contract.getPlayerScore(target);
    if (encryptedScore === ethers.ZeroHash) {
      console.log(`No encrypted score stored for ${target}`);
      return;
    }

    const clearScore = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedScore,
      deployment.address,
      signer,
    );

    console.log(`Encrypted score: ${encryptedScore}`);
    console.log(`Decrypted score: ${clearScore}`);
  });

task("task:guess-monster", "Submit an encrypted monster guess (1-4)")
  .addParam("choice", "Monster index (1-4)")
  .addOptionalParam("address", "Optional EncryptedRealityRift contract address")
  .setAction(async function (taskArgs: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    const choice = parseInt(taskArgs.choice);
    if (choice < 1 || choice > 4) {
      throw new Error("choice must be between 1 and 4");
    }

    await fhevm.initializeCLIApi();

    const deployment = taskArgs.address ? { address: taskArgs.address } : await deployments.get(CONTRACT_NAME);
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);

    const encryptedChoice = await fhevm
      .createEncryptedInput(deployment.address, signer.address)
      .add8(choice)
      .encrypt();

    const tx = await contract
      .connect(signer)
      .guessMonster(encryptedChoice.handles[0], encryptedChoice.inputProof);
    console.log(`Sent guessMonster(${choice}) tx: ${tx.hash}`);
    await tx.wait();
    console.log("Guess submitted");
  });

task("task:decrypt-outcome", "Decrypts whether the last guess was correct")
  .addOptionalParam("address", "Optional EncryptedRealityRift contract address")
  .addOptionalParam("player", "Player address, defaults to signer")
  .setAction(async function (taskArgs: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;
    const deployment = taskArgs.address ? { address: taskArgs.address } : await deployments.get(CONTRACT_NAME);
    const [signer] = await ethers.getSigners();
    const target = taskArgs.player ? (taskArgs.player as string) : signer.address;

    await fhevm.initializeCLIApi();

    const contract = await ethers.getContractAt(CONTRACT_NAME, deployment.address);
    const encryptedOutcome = await contract.getLastOutcome(target);
    if (encryptedOutcome === ethers.ZeroHash) {
      console.log(`No guesses recorded for ${target}`);
      return;
    }

    const wasCorrect = await fhevm.userDecryptEbool(
      FhevmType.ebool,
      encryptedOutcome,
      deployment.address,
      signer,
    );

    console.log(`Encrypted outcome: ${encryptedOutcome}`);
    console.log(`Guessed correctly: ${wasCorrect}`);
  });
