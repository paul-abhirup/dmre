import { ethers } from "hardhat";

async function main() {
  const MedicalRecordNFT = await ethers.getContractFactory("MedicalRecordNFT");
  const medicalRecordNFT = await MedicalRecordNFT.deploy();
  await medicalRecordNFT.deployed();
  console.log("MedicalRecordNFT deployed to:", medicalRecordNFT.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
