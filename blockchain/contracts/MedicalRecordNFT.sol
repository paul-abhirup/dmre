// NFT contract, Access Contract

// SPDX-License-Identifier: MIT2
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // mint NFT
import "@openzeppelin/contracts/access/AccessControl.sol"; // Access Control
import "@openzeppelin/contracts/security/ReentrancyGuard.sol"; // Reentrancy guard

contract MedicalRecordNFT is ERC721, Ownable, AccessControl, ReentrancyGuard {
    uint256 private _tokenIdCounter;// Counter for token IDs
    mapping(uint256 => string) private _tokenURIs; // IPFS hash for each token
    mapping(uint256 => mapping(address => bool)) private _permissions; // Access control

    // Roles for Access Control
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");

    constructor() ERC721("MedicalRecordNFT", "MRN") {
         _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);// Grant Admin role to the employer
    }

    // Mints a new NFT for a patient and stores the IPFS hash.
    function mintNFT(address to, string memory uri) public onlyOwner nonReentrant {
        require(to != address(0), "Invalid address");
        require(bytes(uri).length > 0, "Token URI cannot be empty");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _tokenURIs[tokenId] = uri;
    }

    //Get token URI (IPFS hash) for a specified token
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    //  Grants access to the specified entity(doctor, hospital, etc)
    function grantAccess(uint256 tokenId, address entity) public {
        require(ownerOf(tokenId) == msg.sender, "Only owner can grant access");
        _permissions[tokenId][entity] = true;
    }

    // Revokes access to the specified entity
    function revokeAccess(uint256 tokenId, address entity) public {
        require(ownerOf(tokenId) == msg.sender, "Only owner can revoke access");
        _permissions[tokenId][entity] = false;
    }

    // Checks if the specified entity has access to the NFT
    function hasAccess(uint256 tokenId, address entity) public view returns (bool) {
        return _permissions[tokenId][entity];
    }

     // Grant a role to an entity (e.g., DOCTOR_ROLE)
    function grantRoleToEntity(bytes32 role, address entity) public onlyOwner {
        grantRole(role, entity);
    }

    // Revoke a role from an entity
    function revokeRoleFromEntity(bytes32 role, address entity) public onlyOwner {
        revokeRole(role, entity);
    }

    // Override supportsInterface for AccessControl
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}