// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.5.9;

import "@0x/contracts-erc20/contracts/src/ERC20Token.sol";

/**
 * @title LocalToken
 * @dev Create a sample ERC20 standard token
 */
contract LocalToken is ERC20Token {

    string public name;
    string public symbol;
    uint256 public decimals;
    uint256 public totalSupply;

    constructor (
        string memory _name,
        string memory _symbol,
        uint256 _decimals,
        uint256 _totalSupply
    )
        public
    {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balances[msg.sender] = _totalSupply;
    }
}