// pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/access/Ownable.sol";

// contract MyNFT is ERC721, Ownable {
//     using Counters for Counters.Counter;
//     Counters.Counter private _tokenIds;

//     constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

//     function safeMint(address _to) public onlyOwner {
//         _tokenIds.increment();
//         uint256 newTokenId = _tokenIds.current();
//         _safeMint(_to, newTokenId);
//     }

//     function _baseURI() internal pure override returns (string memory) {
//         return "https://www.mynft.com/token/";
//     }

//     function setBaseURI(string memory _newBaseURI) public onlyOwner {
//         _setBaseURI(_newBaseURI);
//     }

//     function pause() public onlyOwner {
//         _pause();
//     }

//     function unpause() public onlyOwner {
//         _unpause();
//     }

//     function _beforeTokenTransfer(address _from, address _to, uint256 _tokenId) internal override(ERC721, ERC721Enumerable) {
//         super._beforeTokenTransfer(_from, _to, _tokenId);
//     }

//     function supportsInterface(bytes4 _interfaceId) public view override(ERC721, ERC721Enumerable, ERC1155Receiver) returns (bool) {
//         return super.supportsInterface(_interfaceId);
//     }
// }
