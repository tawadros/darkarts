// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DummyNFT is ERC721URIStorage{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("DummyNFT", "DUM") {
        // Pre-minted dummy token for addr1 in Hardhat (not to be confused with addr0)
        awardItem(0x70997970C51812dc3A010C7d01b50e0d17dc79C8, "Test token #1 for Hardhat"); 
    }

    function awardItem(address txAddress, string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();

        uint256 newItemId = _tokenIds.current();
        _mint(txAddress, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }
}