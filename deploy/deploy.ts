import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedRift = await deploy("EncryptedRealityRift", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedRealityRift contract: `, deployedRift.address);
};
export default func;
func.id = "deploy_encryptedRealityRift"; // id required to prevent reexecution
func.tags = ["EncryptedRealityRift"];
