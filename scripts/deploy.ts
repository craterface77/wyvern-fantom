import { ethers } from "hardhat";

const OWNER = "0x6ddA3F70aD91f66cb7bb78B4c25f4781330A5B41";

async function main() {
  const WWYToken = await ethers.getContractFactory("Weway");
  const wwyToken = await WWYToken.deploy(0);
  await wwyToken.deployed();
  console.log("WWYToken deployed to:", wwyToken.address);

  const T1155 = await ethers.getContractFactory("ERC1155");
  const t1155 = await T1155.deploy("https://www.google.com/");
  await t1155.deployed();
  console.log("T1155 deployed to:", t1155.address);

  const WWProxyRegistry = await ethers.getContractFactory(
    "WyvernProxyRegistry"
  );
  const wwProxyRegistry = await WWProxyRegistry.deploy();
  await wwProxyRegistry.deployed();
  console.log("WyvernProxyRegistry deployed to:", wwProxyRegistry.address);

  const WWTokenTransferProxy = await ethers.getContractFactory(
    "WyvernTokenTransferProxy"
  );
  const wwTokenTransferProxy = await WWTokenTransferProxy.deploy(
    wwProxyRegistry.address
  );
  await wwTokenTransferProxy.deployed();
  console.log(
    "WWTokenTransferProxy deployed to:",
    wwTokenTransferProxy.address
  );

  const WWExchange = await ethers.getContractFactory("WyvernExchange");
  const wwExchange = await WWExchange.deploy(
    wwProxyRegistry.address,
    wwTokenTransferProxy.address,
    wwyToken.address,
    OWNER
  );
  await wwExchange.deployed();
  console.log("WWExchange deployed to:", wwExchange.address);

  const wwMint = await wwyToken.mint(OWNER, "33000000000000000000");
  await wwMint.wait();

  const mintedBalance = await wwyToken.balanceOf(OWNER);

  console.log("minted for WW: ", mintedBalance.toString());

  const changeOwnerWW = await wwyToken.transferOwnership(OWNER);
  await changeOwnerWW.wait();
  console.log("new owner WWY: ", await wwyToken.owner());

  const initWE = await wwProxyRegistry.grantInitialAuthentication(
    wwExchange.address
  );
  await initWE.wait();

  console.log(
    "Address inited?: ",
    await wwProxyRegistry.contracts(wwExchange.address)
  );

  const registerProxy = await wwProxyRegistry.registerProxy();
  await registerProxy.wait();

  const prAddr = await wwProxyRegistry.proxies(
    "0xC3D20Fcec273a493df1D5180B5d1b2877e2103dB"
  );

  const changeOwnerProxyReg = await wwProxyRegistry.transferOwnership(OWNER);
  await changeOwnerProxyReg.wait();
  console.log("new owner ProxyReg: ", await wwProxyRegistry.owner());

  console.log("PR", prAddr);

  const setApproove = await t1155.setApprovalForAll(prAddr, true);
  await setApproove.wait();

  console.log(
    "is ApprovedForAll?: ",
    await t1155.isApprovedForAll(
      "0xC3D20Fcec273a493df1D5180B5d1b2877e2103dB",
      prAddr
    )
  );

  const changeOwner1155 = await t1155.transferOwnership(OWNER);
  await changeOwner1155.wait();
  console.log("new owner 1155: ", await t1155.owner());

  const changeOwnerExchange = await wwExchange.transferOwnership(OWNER);
  await changeOwnerExchange.wait();
  console.log("new owner Exchange: ", await wwExchange.owner());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
