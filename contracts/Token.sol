//Developed by CryptoLeaks

//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, ERC20Burnable, Ownable {
    uint256 private START_TIME = 0;

    // **********************************************************************************
    // **********************    Change vesting Period here    **********************
    // **********************************************************************************
    uint256 vestingPeriod = 30 days;

    bool vesting_started = false;
    struct Vesting {
        uint256 nextReleaseTime;
        uint256 initialReleaseAmount;
        uint256 monthlyReleaseAmount;
        uint256 cyclesLeft;
    }

    // @dev - holds Launchpad address, vesting percentage
    struct Source {
        uint256 _initialReleasePercentage;
        uint256 _monthlyReleasePercentage;
        bool isSet;
    }

    mapping(address => Source) private _listedSource;
    mapping(address => uint256) private _freeTokens;
    mapping(address => Vesting[]) private _userVestings;
    mapping(address => uint256) private _amountVested;

    event AddSource(
        address _address,
        uint256 _initialReleasePercentage,
        uint256 _monthlyReleasePercentage
    );

    event ManualUnfreeze(address _address, uint256 _amount);

    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) {
        ERC20._mint(msg.sender, _initialSupply * 10**decimals());
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a <= b ? a : b;
    }

    function setStartTime(uint256 date) external onlyOwner {
        require(
            date > block.timestamp,
            "Start time should be greater than current time"
        );

        require(vesting_started == false, "Cannot change Vesting start date");
        START_TIME = date;
        vesting_started = true;
    }

    function startTime() external view returns (uint256) {
        return START_TIME;
    }

    function addSource(
        address _sourceAddress,
        uint256 _initialReleasePercentage,
        uint256 _monthlyReleasePercentage
    ) external onlyOwner {
        require(_sourceAddress != address(0), "Cannot add address 0");
        require(_sourceAddress != owner(), "Cannot add owner as listed source");

        require(
            _listedSource[_sourceAddress].isSet == false,
            "Source Already exists"
        );

        require(
            _initialReleasePercentage < 100,
            "Invalid initial release percentage"
        );
        require(
            _monthlyReleasePercentage < 100,
            "Invalid monthly release percentage"
        );

        require(
            _initialReleasePercentage > 0,
            "Invalid initial release percentage"
        );
        require(
            _monthlyReleasePercentage > 0,
            "Invalid monthly release percentage"
        );

        require(
            (100 - _initialReleasePercentage) % _monthlyReleasePercentage == 0,
            "Invalid Release Percentages"
        );

        _listedSource[_sourceAddress] = Source(
            _initialReleasePercentage,
            _monthlyReleasePercentage,
            true
        );

        emit AddSource(
            _sourceAddress,
            _initialReleasePercentage,
            _monthlyReleasePercentage
        );
    }

    function checkSource(address _sourceAddress) public view returns (bool) {
        return _listedSource[_sourceAddress].isSet;
    }

    function addVesting(
        address to,
        uint256 amount,
        uint256 initialReleaseTime,
        uint256 initialReleasePercentage,
        uint256 monthlyReleasePercentage
    ) private {
        require(vesting_started == true, "Vesting not yet started");

        uint256 initialReleaseAmount = (amount * initialReleasePercentage) /
            100;
        uint256 monthlyReleaseAmount = (amount * monthlyReleasePercentage) /
            100;

        uint256 cycles = 100 - initialReleasePercentage;
        cycles = cycles / monthlyReleasePercentage;
        cycles = cycles + 1;

        _userVestings[to].push(
            Vesting(
                initialReleaseTime,
                initialReleaseAmount,
                monthlyReleaseAmount,
                cycles
            )
        );
    }

    function tokensToBeReleased(address user) private view returns (uint256) {
        uint256 _tokenTobeReleased = 0;
        uint256 _nextRelease;
        uint256 _cycles;
        for (uint256 i = 0; i < _userVestings[user].length; i++) {
            _nextRelease = _userVestings[user][i].nextReleaseTime;
            _cycles = _userVestings[user][i].cyclesLeft;
            if (_cycles > 0 && block.timestamp >= _nextRelease) {
                if (_userVestings[user][i].initialReleaseAmount > 0) {
                    _nextRelease += vestingPeriod;
                    _tokenTobeReleased += _userVestings[user][i]
                        .initialReleaseAmount;
                    _cycles--;
                }

                if (block.timestamp >= _nextRelease) {
                    uint256 cyclesPassed = 1 +
                        ((block.timestamp - _nextRelease) / vestingPeriod);
                    uint256 cyclesToBePaid = min(_cycles, cyclesPassed);

                    _tokenTobeReleased +=
                        cyclesToBePaid *
                        _userVestings[user][i].monthlyReleaseAmount;
                }
            }
        }
        return _tokenTobeReleased;
    }

    function unFreeze(address user) private {
        for (uint256 i = 0; i < _userVestings[user].length; i++) {
            if (
                _userVestings[user][i].cyclesLeft > 0 &&
                block.timestamp >= _userVestings[user][i].nextReleaseTime
            ) {
                if (_userVestings[user][i].initialReleaseAmount > 0) {
                    _freeTokens[user] += _userVestings[user][i]
                        .initialReleaseAmount;
                    _userVestings[user][i].initialReleaseAmount = 0;
                    _userVestings[user][i].nextReleaseTime += vestingPeriod;

                    _amountVested[user] += _userVestings[user][i]
                        .initialReleaseAmount;

                    _userVestings[user][i].cyclesLeft--;
                }
                if (block.timestamp >= _userVestings[user][i].nextReleaseTime) {
                    uint256 cyclesPassed = 1 +
                        ((block.timestamp -
                            _userVestings[user][i].nextReleaseTime) /
                            vestingPeriod);

                    uint256 cyclesToBePaid = min(
                        _userVestings[user][i].cyclesLeft,
                        cyclesPassed
                    );

                    _amountVested[user] +=
                        cyclesToBePaid *
                        _userVestings[user][i].monthlyReleaseAmount;

                    _freeTokens[user] +=
                        cyclesToBePaid *
                        _userVestings[user][i].monthlyReleaseAmount;

                    _userVestings[user][i].cyclesLeft -= cyclesToBePaid;

                    _userVestings[user][i].nextReleaseTime += (cyclesPassed *
                        vestingPeriod);
                }
            }
        }
    }

    function getVestingCycles(address user) public view returns (uint256) {
        uint256 count = 0;
        uint256 _nextRelease;
        for (uint256 i = 0; i < _userVestings[user].length; i++) {
            if (_userVestings[user][i].cyclesLeft > 0) {
                _nextRelease = _userVestings[user][i].nextReleaseTime;
                uint256 localCount = 0;
                if (block.timestamp >= _nextRelease) {
                    if (_userVestings[user][i].initialReleaseAmount > 0) {
                        _nextRelease += vestingPeriod;
                        localCount++;
                    }
                    if (block.timestamp >= _nextRelease) {
                        uint256 cyclesPassed = 1 +
                            ((block.timestamp - _nextRelease) / vestingPeriod);
                        uint256 cyclesToBePaid = min(
                            _userVestings[user][i].cyclesLeft,
                            cyclesPassed
                        );
                        localCount += (cyclesToBePaid);
                    }
                    count += (_userVestings[user][i].cyclesLeft - localCount);
                }
            }
        }
        return count;
    }

    function getFreeTokens(address user) public view returns (uint256) {
        return _freeTokens[user] + tokensToBeReleased(user);
    }

    function getAmonuntVested(address user) public view returns (uint256) {
        return _amountVested[user] + tokensToBeReleased(user);
    }

    function getFrozenTokens(address user) public view returns (uint256) {
        return balanceOf(user) - getFreeTokens(user);
    }

    // For Owner to send Frozen Tokens
    function sendFrozen(
        address to,
        uint256 amount,
        uint256 initialReleasePercentage,
        uint256 monthlyReleasePercentage
    ) public onlyOwner {
        transfer(to, amount);

        //will also call _afterTokenTransfer

        _freeTokens[to] -= amount; //  free tokens will be increased by _afterTokenTransfer > this line reverts this.

        if (block.timestamp < START_TIME) {
            addVesting(
                to,
                amount,
                START_TIME,
                initialReleasePercentage,
                monthlyReleasePercentage
            );
        } else {
            addVesting(
                to,
                amount,
                block.timestamp + vestingPeriod,
                initialReleasePercentage,
                monthlyReleasePercentage
            );
        }
    }

    //  @dev - for owner to unfreeze amount in a wallet;
    function unfreezeAmount(address user, uint256 amount) external onlyOwner {
        require(amount <= getFrozenTokens(user), "Not enough frozen tokens");
        require(amount > 0, "Amount should be greater than 0");

        unFreeze(user);

        uint256 amountReleased = 0;
        for (uint256 i = 0; i < _userVestings[user].length && amount > 0; i++) {
            if (_userVestings[user][i].cyclesLeft > 0) {
                if (_userVestings[user][i].initialReleaseAmount > 0) {
                    _freeTokens[user] += _userVestings[user][i]
                        .initialReleaseAmount;
                    _amountVested[user] += _userVestings[user][i]
                        .initialReleaseAmount;

                    amountReleased += _userVestings[user][i]
                        .initialReleaseAmount;

                    if (amount > _userVestings[user][i].initialReleaseAmount) {
                        amount -= _userVestings[user][i].initialReleaseAmount;
                    } else {
                        amount = 0;
                    }
                    _userVestings[user][i].initialReleaseAmount = 0;
                }
                if (amount > 0) {
                    uint256 cyclesToBeSkipped = amount /
                        _userVestings[user][i].monthlyReleaseAmount;
                    uint256 cyclesSkipped = min(
                        _userVestings[user][i].cyclesLeft,
                        cyclesToBeSkipped
                    );

                    _freeTokens[user] +=
                        cyclesSkipped *
                        _userVestings[user][i].monthlyReleaseAmount;
                    _amountVested[user] +=
                        cyclesSkipped *
                        _userVestings[user][i].monthlyReleaseAmount;

                    amountReleased +=
                        cyclesSkipped *
                        _userVestings[user][i].monthlyReleaseAmount;

                    _userVestings[user][i].cyclesLeft -= cyclesSkipped;

                    amount -=
                        cyclesSkipped *
                        _userVestings[user][i].monthlyReleaseAmount;

                    if (
                        _userVestings[user][i].cyclesLeft > 0 &&
                        amount < _userVestings[user][i].monthlyReleaseAmount &&
                        amount > 0
                    ) {
                        _freeTokens[user] += _userVestings[user][i]
                            .monthlyReleaseAmount;
                        _amountVested[user] += _userVestings[user][i]
                            .monthlyReleaseAmount;
                        amountReleased += _userVestings[user][i]
                            .monthlyReleaseAmount;
                        amount = 0;
                        _userVestings[user][i].cyclesLeft--;
                    }
                }

                _userVestings[user][i].nextReleaseTime =
                    block.timestamp +
                    vestingPeriod;
            }
        }

        emit ManualUnfreeze(user, amountReleased);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        unFreeze(from);

        if (from != address(0)) {
            require(amount <= _freeTokens[from], "Not Enough free tokens");
        }
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        if (_listedSource[from].isSet == true && to != owner()) {
            addVesting(
                to,
                amount,
                block.timestamp + vestingPeriod,
                _listedSource[from]._initialReleasePercentage,
                _listedSource[from]._monthlyReleasePercentage
            );
        } else {
            _freeTokens[to] += amount;
        }

        if (from != address(0)) {
            unchecked {
                _freeTokens[from] -= amount;
            }
        }
        super._afterTokenTransfer(from, to, amount);
    }
}
