pragma solidity ^0.8.0;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address _owner) external view returns (uint256 balance);
    function transfer(address _to, uint256 _value) external returns (bool success);
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);
    function approve(address _spender, uint256 _value) external returns (bool success);
    function allowance(address _owner, address _spender) external view returns (uint256 remaining);
    function mint(address _to, uint256 _value) external returns (bool success);
    function freeze(address _account) external;
    function unfreeze(address _account) external;
    function burn(uint256 _value) external returns (bool success);
    function burnFrom(address _from, uint256 _value) external returns (bool success);
    function approveAndCall(address _spender, uint256 _value, bytes calldata _extraData) external returns (bool success);
    function transferAnyERC20Token(address _tokenAddress, uint256 _value) external returns (bool success);
    function destroyContract() external;
    function revertWrongfulTransfer() external payable;
    event Transfer(address indexed _from, address indexed _to, uint256 _value);
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
    event Freeze(address indexed _account);
    event Unfreeze(address indexed _account);
    event Burn(address indexed _from, uint256 _value);
}

interface ApproveAndCallFallBack {
    function receiveApproval(address _from, uint256 _value, address _token, bytes calldata _data) external;
}

contract LocalToken is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public override totalSupply;

    mapping (address => uint256) public override balanceOf;
    mapping (address => mapping (address => uint256)) public override allowance;
    mapping (address => bool) public frozenAccounts;

    address public owner;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        owner = msg.sender;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can perform this action");
        _;
    }

    modifier notFrozen(address _account) {
        require(!frozenAccounts[_account], "Account is frozen");
        _;
    }

    function transfer(address _to, uint256 _value) public notFrozen(msg.sender) notFrozen(_to) returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid address");
        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) public notFrozen(_from) notFrozen(_to) returns (bool success) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        require(_to != address(0), "Invalid address");
        balanceOf[_from] -= _value;
        allowance[_from][msg.sender] -= _value;
        balanceOf[_to] += _value;
        emit Transfer(_from, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public notFrozen(msg.sender) notFrozen(_spender) returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_spender != address(0), "Invalid address");
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function mint(address _to, uint256 _value) public onlyOwner returns (bool success) {
        require(_to != address(0), "Invalid address");
        totalSupply += _value;
        balanceOf[_to] += _value;
        emit Transfer(address(0), _to, _value);
        return true;
    }

    function freeze(address _account) public onlyOwner {
        require(_account != address(0), "Invalid address");
        require(!frozenAccounts[_account], "Account is already frozen");
        frozenAccounts[_account] = true;
        emit Freeze(_account);
    }

    function unfreeze(address _account) public onlyOwner {
        require(frozenAccounts[_account], "Account is not frozen");
        frozenAccounts[_account] = false;
        emit Unfreeze(_account);
    }

    function burn(uint256 _value) public notFrozen(msg.sender) returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        balanceOf[msg.sender] -= _value;
        totalSupply -= _value;
        emit Burn(msg.sender, _value);
        emit Transfer(msg.sender, address(0), _value);
        return true;
    }

    function burnFrom(address _from, uint256 _value) public notFrozen(_from) notFrozen(msg.sender) returns (bool success) {
        require(balanceOf[_from] >= _value, "Insufficient balance");
        require(allowance[_from][msg.sender] >= _value, "Allowance exceeded");
        balanceOf[_from] -= _value;
        allowance[_from][msg.sender] -= _value;
        totalSupply -= _value;
        emit Burn(_from, _value);
        emit Transfer(_from, address(0), _value);
        return true;
    }

    function approveAndCall(address _spender, uint256 _value, bytes calldata _extraData) public notFrozen(msg.sender) returns (bool success) {
        require(_spender != address(0), "Invalid address");
        require(_value > 0, "Invalid value");
        allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        ApproveAndCallFallBack(_spender).receiveApproval(msg.sender, _value, address(this), _extraData);
        return true;
    }

    function transferAnyERC20Token(address _tokenAddress, uint256 _value) public onlyOwner returns (bool success) {
        return IERC20(_tokenAddress).transfer(owner, _value);
    }

    function destroyContract() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function revertWrongfulTransfer() public onlyOwner payable {
        require(msg.value > 0, "Ether value must be greater than 0");
        emit Transfer(address(this), owner, msg.value);
    }
}
