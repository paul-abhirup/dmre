import { expect } from "chai";
import { ethers } from "hardhat";

describe("MedicalRecordNFT", function () {
  // let MedicalRecordNFT: any;
  // let medicalRecordNFT: any;
  // let owner: any;
  // let patient: any;
  // let doctor: any;

  let medicalRecordNFT, owner, patient, doctor;

  //Deploy Contract before running tests
  beforeEach(async function () {
    const MedicalRecordNFT = await ethers.getContractFactory(
      "MedicalRecordNFT"
    );
    [owner, patient, doctor] = await ethers.getSigners(); // simulated wallet accounts
    medicalRecordNFT = await MedicalRecordNFT.deploy();
    await medicalRecordNFT.deployed();
  });

  it("Should mint an medical record NFT", async function () {
    await medicalRecordNFT.mintNFT(patient.address, "ipfs://Qm...");
    expect(await medicalRecordNFT.ownerOf(0)).to.equal(patient.address);
  });

  it("Should grant access to a doctor", async function () {
    await medicalRecordNFT.mintNFT(patient.address, "ipfs://Qm...");
    await medicalRecordNFT.connect(patient).grantAccess(0, doctor.address);
    expect(await medicalRecordNFT.hasAccess(0, doctor.address)).to.be.true;
  });

  it("Should revoke access from a doctor", async function () {
    await medicalRecordNFT.mintNFT(patient.address, "ipfs://Qm...");
    await medicalRecordNFT.connect(patient).grantAccess(0, doctor.address);
    await medicalRecordNFT.connect(patient).revokeAccess(0, doctor.address);
    expect(await medicalRecordNFT.hasAccess(0, doctor.address)).to.be.false;
  });
});
