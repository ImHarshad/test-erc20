// pragma solidity ^0.8.0;

// import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

// contract MyERC1155 is ERC1155 {
//     constructor() ERC1155("https://example.com/{id}.json") {
//         // mint some tokens to the contract creator
//         _mint(msg.sender, 1, 100, "");
//         _mint(msg.sender, 2, 200, "");
//     }

//     function transfer(address _from, address _to, uint256 _id, uint256 _amount, bytes memory _data) public override {
//         super.transfer(_from, _to, _id, _amount, _data);
//         // do something else after transfer
//     }

//     function batchTransfer(address _from, address _to, uint256[] memory _ids, uint256[] memory _amounts, bytes memory _data) public override {
//         super.batchTransfer(_from, _to, _ids, _amounts, _data);
//         // do something else after batch transfer
//     }

//     function uri(uint256 _id) public view override returns (string memory) {
//         return string(abi.encodePacked(super.uri(_id), "?contract=my-erc-1155"));
//     }
// }
