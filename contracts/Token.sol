//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, ERC20Capped, Ownable {
    struct Vesting {
        uint256 amount;
        uint256 releasePercentage;
    }

    // @dev - holds Launchpad address, vesting percentage
    struct Source {
        address _address;
        uint256 _releasePercentage;
        bool isSet;
    }

    // *****************************************************Check requirement
    event AddSource(address _address, uint256 _releasePercentage);

    // Source[] private _sources;
    mapping(address => Source) _sources;
    mapping(address => uint256) freeTokens;
    mapping(address => Vesting[]) vestings;
    uint256 private _ownerReleasePercentage;

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply,
        uint256 _cap,
        uint256 _initialOwnerReleasePercentage
    ) ERC20(_name, _symbol) ERC20Capped(_cap) {
        require(
            _initialOwnerReleasePercentage > 0,
            "Release percentage should be greater than 0"
        );
        ERC20._mint(msg.sender, _initialSupply);
        freeTokens[msg.sender] = _initialSupply;

        _ownerReleasePercentage = _initialOwnerReleasePercentage;
    }

    function _mint(address account, uint256 amount)
        internal
        virtual
        override(ERC20Capped, ERC20)
        onlyOwner
    {
        super._mint(account, amount);
    }

    function setOwnerReleasePercentage(uint256 _newReleasePercentage)
        external
        onlyOwner
    {
        _ownerReleasePercentage = _newReleasePercentage;
    }

    function getOwnerReleasePercentage() public view returns (uint256) {
        return _ownerReleasePercentage;
    }

    // @dev to add new vesting source
    function addSource(
        address _sourceAddress,
        uint256 _releasePercentage,
        uint256 _allowance
    ) external onlyOwner {
        require(_sourceAddress != address(0), "Cannot add address 0");
        require(checkSource(_sourceAddress) == false, "Source already exists");
        require(
            _releasePercentage > 0,
            "Release percentage should be greater than 0"
        );
        _sources[_sourceAddress] = Source(
            _sourceAddress,
            _releasePercentage,
            true
        );
        // _sources.push(Source(_sourceAddress, _releasePercentage));
        approve(_sourceAddress, _allowance);
        emit AddSource(_sourceAddress, _releasePercentage);
    }

    //  @dev Make changes to existing source
    function updateSourcePercentage(
        address _sourceAddress,
        uint256 _newReleasePercentage
    ) external onlyOwner {
        require(
            _newReleasePercentage > 0,
            "Release percentage should be greater than 0"
        );

        _sources[_sourceAddress]._releasePercentage = _newReleasePercentage;
    }

    // Remove a listed source
    // ********************************************** Test POP() ***************************************************

    function removeSource(address _sourceAddress) external onlyOwner {
        delete _sources[_sourceAddress];
        decreaseAllowance(_sourceAddress, allowance(owner(), _sourceAddress));
    }

    function checkSource(address _sourceAddress) public view returns (bool) {
        return _sources[_sourceAddress].isSet;
    }

    //  Transfers

    function mintMoreTokens(uint256 _amount) public onlyOwner {
        _mint(owner(), _amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(amount >= freeTokens[from], "Not Enough free tokens");
        if (from == owner()) {
            require(
                getOwnerReleasePercentage() != 0,
                "Monthly Release percentage not set correctly"
            );
        }
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (from == owner()) {
            vestings[to].push(Vesting(amount, getOwnerReleasePercentage()));
        } else if (_sources[from].isSet == true) {
            vestings[to].push(
                Vesting(amount, _sources[from]._releasePercentage)
            );
        }
    }
}
