const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Sovereign Agent Smart Contracts...\n");
  
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log("📍 Network:", network);
  console.log("👤 Deployer:", deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH/BNB\n");
  
  // Deploy AgentRegistry
  console.log("📝 Deploying AgentRegistry...");
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("✅ AgentRegistry deployed to:", agentRegistryAddress);
  
  // Deploy MultiChainWallet
  console.log("\n📝 Deploying MultiChainWallet...");
  const MultiChainWallet = await hre.ethers.getContractFactory("MultiChainWallet");
  const multiChainWallet = await MultiChainWallet.deploy();
  await multiChainWallet.waitForDeployment();
  const multiChainWalletAddress = await multiChainWallet.getAddress();
  console.log("✅ MultiChainWallet deployed to:", multiChainWalletAddress);
  
  // Deploy SwapExecutor
  console.log("\n📝 Deploying SwapExecutor...");
  const SwapExecutor = await hre.ethers.getContractFactory("SwapExecutor");
  const swapExecutor = await SwapExecutor.deploy();
  await swapExecutor.waitForDeployment();
  const swapExecutorAddress = await swapExecutor.getAddress();
  console.log("✅ SwapExecutor deployed to:", swapExecutorAddress);
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:\n");
  console.log("AgentRegistry:     ", agentRegistryAddress);
  console.log("MultiChainWallet:  ", multiChainWalletAddress);
  console.log("SwapExecutor:      ", swapExecutorAddress);
  console.log("\n" + "=".repeat(60));
  
  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: network,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AgentRegistry: agentRegistryAddress,
      MultiChainWallet: multiChainWalletAddress,
      SwapExecutor: swapExecutorAddress,
    },
  };
  
  const deploymentPath = `./deployments/${network}.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to:", deploymentPath);
  
  // Verification instructions
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\n📝 To verify contracts on block explorer, run:");
    console.log(`\nnpx hardhat verify --network ${network} ${agentRegistryAddress}`);
    console.log(`npx hardhat verify --network ${network} ${multiChainWalletAddress}`);
    console.log(`npx hardhat verify --network ${network} ${swapExecutorAddress}`);
  }
  
  console.log("\n✨ All done! Your Sovereign Agent contracts are live on", network);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
