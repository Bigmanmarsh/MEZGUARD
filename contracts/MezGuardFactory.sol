// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {MezGuardAccount} from "./MezGuardAccount.sol";
import {IMUSDSavingsRate} from "./interfaces.sol";

/// @title MezGuard Factory
/// @notice Creates one MezGuard Account per saver at a predictable address, so a
///         bridge transfer can be sent to the account before it even exists.
///         The admin can change the keeper and the fee settings within hard caps,
///         but has no way to move any saver's money.
contract MezGuardFactory is Ownable2Step {
    uint256 public constant MAX_FEE_BPS = 1_000; // 10% of interest, never more

    address public immutable implementation;
    address public immutable vault;
    address public immutable musd;
    address public keeper;
    address public treasury;
    uint256 public feeBps;
    uint256 public freeUpTo;

    mapping(address owner => address account) public accountOf;
    address[] public allAccounts;

    event AccountCreated(address indexed owner, address indexed account);
    event KeeperSet(address keeper);
    event FeeSet(address treasury, uint256 feeBps, uint256 freeUpTo);

    error FeeTooHigh();
    error ZeroAddress();
    error WrongVault();

    constructor(address vault_, address keeper_, address treasury_, uint256 feeBps_, uint256 freeUpTo_)
        Ownable(msg.sender)
    {
        if (vault_ == address(0) || keeper_ == address(0)) revert ZeroAddress();
        if (feeBps_ > MAX_FEE_BPS) revert FeeTooHigh();
        address m = IMUSDSavingsRate(vault_).musdToken();
        if (m == address(0)) revert WrongVault();
        vault = vault_;
        musd = m;
        keeper = keeper_;
        treasury = treasury_;
        feeBps = feeBps_;
        freeUpTo = freeUpTo_;
        implementation = address(new MezGuardAccount());
    }

    function feeConfig() external view returns (address, uint256, uint256) {
        return (treasury, feeBps, freeUpTo);
    }

    function predictAccount(address owner_) public view returns (address) {
        return Clones.predictDeterministicAddress(implementation, bytes32(uint256(uint160(owner_))));
    }

    /// @notice Anyone may create the account for an owner (the keeper does it so the
    ///         saver pays no gas). The owner is fixed forever.
    function createAccount(address owner_) external returns (address account) {
        if (owner_ == address(0)) revert ZeroAddress();
        account = accountOf[owner_];
        if (account != address(0)) return account;
        account = Clones.cloneDeterministic(implementation, bytes32(uint256(uint160(owner_))));
        MezGuardAccount(account).initialize(owner_);
        accountOf[owner_] = account;
        allAccounts.push(account);
        emit AccountCreated(owner_, account);
    }

    function accountsCount() external view returns (uint256) {
        return allAccounts.length;
    }

    function setKeeper(address keeper_) external onlyOwner {
        if (keeper_ == address(0)) revert ZeroAddress();
        keeper = keeper_;
        emit KeeperSet(keeper_);
    }

    function setFee(address treasury_, uint256 feeBps_, uint256 freeUpTo_) external onlyOwner {
        if (feeBps_ > MAX_FEE_BPS) revert FeeTooHigh();
        treasury = treasury_;
        feeBps = feeBps_;
        freeUpTo = freeUpTo_;
        emit FeeSet(treasury_, feeBps_, freeUpTo_);
    }
}
