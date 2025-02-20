const express = require("express");
const Web3 = require("web3");
const cors = require("cors");
const ipfsClient = require("ipfs-http-client");
// const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
const port = 3000;

const web3 = new Web3(new Web3.providers.HttpProvider(process.env.INFURA_URL));
const contractABI = require("./contractABI.json");
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(contractABI, contractAddress);

const ipfs = ipfsClient({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: `Basic ${Buffer.from(
      `${process.env.IPFS_PROJECT_ID}:${process.env.IPFS_PROJECT_SECRET}`
    ).toString("base64")}`,
  },
});

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const multer = require("multer"); // For handling file uploads
const upload = multer({ storage: multer.memoryStorage() }); // Store file in memory

app.use(cors());
app.use(express.json());

// implement user auth using metamask
app.post("/login", async (req, res) => {
  const { address, signedMessage } = req.body;
  const message = "Please sign this message to authenticate.";

  // Verify the signed message
  const recoveredAddress = web3.eth.accounts.recover(message, signedMessage);
  if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
    // Check if the user exists in the database
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("eth_address", address)
      .single();

    if (error || !user) {
      // Create a new user if they don't exist
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([{ eth_address: address }])
        .single();

      if (createError) {
        return res.status(500).json({ error: "Failed to create user" });
      }

      // Issue a JWT
      const token = jwt.sign({ address }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });
      return res.json({ token, user: newUser });
    }

    // Issue a JWT
    const token = jwt.sign({ address }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, user });
  } else {
    res.status(401).json({ error: "Authentication failed" });
  }
});

// uploads the data in the ipfs and retieve the hash of the file
app.post("/upload-to-ipfs", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    // Check if a file was uploaded
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Upload the file to IPFS
    const result = await ipfs.add(file.buffer);
    const ipfsHash = result.path;

    // Return the IPFS hash to the frontend
    res.json({ ipfsHash });
  } catch (error) {
    console.error("Error uploading to IPFS:", error);
    res.status(500).json({ error: "Failed to upload file to IPFS" });
  }
});

// uploading record metadata in the ipfs storage
app.post("/upload-record", async (req, res) => {
  const { address, ipfsHash, description } = req.body;

  // Get the user ID
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("eth_address", address)
    .single();

  if (userError || !user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Insert the medical record
  const { data: record, error: recordError } = await supabase
    .from("medical_records")
    .insert([{ user_id: user.id, ipfs_hash: ipfsHash, description }])
    .single();

  if (recordError) {
    return res.status(500).json({ error: "Failed to store record" });
  }

  res.json({ success: true, record });
});

// mint nft to store medical record
app.post("/mint-nft", async (req, res) => {
  const { address, ipfsHash } = req.body;

  // Mint NFT by calling the smart contract
  const tx = contract.methods.mintNFT(address, ipfsHash);
  const signedTx = await web3.eth.accounts.signTransaction(
    {
      to: contractAddress,
      data: tx.encodeABI(),
      gas: await tx.estimateGas({ from: address }),
      gasPrice: await web3.eth.getGasPrice(),
      nonce: await web3.eth.getTransactionCount(address),
    },
    process.env.PRIVATE_KEY
  );

  const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

  // Store the NFT metadata in Supabase
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("eth_address", address)
    .single();

  if (userError || !user) {
    return res.status(400).json({ error: "User not found" });
  }

  const { data: nftRecord, error: nftError } = await supabase
    .from("medical_records")
    .insert([{ user_id: user.id, ipfs_hash: ipfsHash }])
    .single();

  if (nftError) {
    return res.status(500).json({ error: "Failed to store NFT metadata" });
  }

  res.json({ success: true, receipt, nftRecord });
});

//grant or revoke access
app.post("/grant-access", async (req, res) => {
  const { recordId, entityAddress } = req.body;

  // Insert the permission
  const { data: permission, error } = await supabase
    .from("permissions")
    .insert([{ record_id: recordId, entity_address: entityAddress }])
    .single();

  if (error) {
    return res.status(500).json({ error: "Failed to grant access" });
  }

  res.json({ success: true, permission });
});

// fetch user
app.get("/user-records/:address", async (req, res) => {
  const { address } = req.params;

  // Get the user ID
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("eth_address", address)
    .single();

  if (userError || !user) {
    return res.status(400).json({ error: "User not found" });
  }

  // Get the user's medical records
  const { data: records, error: recordsError } = await supabase
    .from("medical_records")
    .select("*")
    .eq("user_id", user.id);

  if (recordsError) {
    return res.status(500).json({ error: "Failed to fetch records" });
  }

  res.json({ records });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
