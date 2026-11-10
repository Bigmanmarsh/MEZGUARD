// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {IMezGuardFactory, IMUSDSavingsRate} from "./interfaces.sol";

/// @title MezGuard Account
/// @notice One savings account per saver. It holds the saver's position in Mezo's
///         MUSD Savings Rate vault (sMUSD). Money can only ever leave to the owner
///         (plus the disclosed fee on interest). The keeper can deposit idle MUSD
///         and, if the owner switched the Guard on, pull everything out to the
///         owner. It can never send funds anywhere else.
contract MezGuardAccount is ReentrancyGuard, EIP712 {
    using SafeERC20 for IERC20;

    bytes32 public constant WITHDRAW_TYPEHASH =
        keccak256("Withdraw(address account,uint256 amount,uint256 nonce,uint256 deadline)");

    IMezGuardFactory public factory;
    address public owner;
    bool public guardEnabled;
    uint256 public nonce;
    /// @notice MUSD the owner put in (deposits minus withdrawals of principal).
    uint256 public principal;
    /// @notice Interest paid out to the owner over the account's life (after fee).
    uint256 public totalInterestPaid;
    uint256 public totalFeesPaid;

    event Deposited(uint256 amount, uint256 newPrincipal);
    event Withdrawn(uint256 amount, uint256 interest, uint256 fee, address indexed to);
    event InterestClaimed(uint256 interest, uint256 fee);
    event GuardSet(bool enabled);
    event GuardExit(uint8 indexed reason, uint256 principalOut, uint256 interest, uint256 fee);

    error NotOwner();
    error NotKeeper();
    error AlreadyInitialized();
    error GuardOff();
    error Expired();
    error BadSignature();
    error ZeroAmount();
    error TooMuch();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() EIP712("MezGuardAccount", "1") {
        owner = address(0xdead); // lock the implementation
    }

    function initialize(address owner_) external {
        if (owner != address(0)) revert AlreadyInitialized();
        factory = IMezGuardFactory(msg.sender);
        owner = owner_;
        guardEnabled = true;
        emit GuardSet(true);
    }

    // ----- views -----
    function vault() public view returns (IMUSDSavingsRate) {
        return IMUSDSavingsRate(factory.vault());
    }

    function musd() public view returns (IERC20) {
        return IERC20(factory.musd());
    }

    /// @notice MUSD in the vault plus any idle MUSD waiting to be swept.
    function balances() external view returns (uint256 saved, uint256 idle, uint256 claimable) {
        IMUSDSavingsRate v = vault();
        saved = v.balanceOf(address(this));
        idle = musd().balanceOf(address(this));
        claimable = v.claimableYield(address(this));
    }

    // ----- saving -----
    /// @notice Owner tops up from their wallet.
    function deposit(uint256 amount) external onlyOwner nonReentrant {
        if (amount == 0) revert ZeroAmount();
        musd().safeTransferFrom(msg.sender, address(this), amount);
        _sweep();
    }

    /// @notice Puts any idle MUSD (for example a bridge delivery) into the vault.
    ///         Anyone may call it: it can only move the owner's money into savings.
    function sweep() external nonReentrant {
        _sweep();
    }

    function _sweep() internal {
        IERC20 m = musd();
        uint256 idle = m.balanceOf(address(this));
        if (idle == 0) revert ZeroAmount();
        IMUSDSavingsRate v = vault();
        m.forceApprove(address(v), idle);
        v.deposit(idle);
        principal += idle;
        emit Deposited(idle, principal);
    }

    // ----- taking money out (always to the owner) -----
    function withdraw(uint256 amount) external onlyOwner nonReentrant {
        _withdraw(amount);
    }

    /// @notice Gasless withdrawal: the owner signs, anyone (the keeper) submits.
    function withdrawWithSig(uint256 amount, uint256 deadline, bytes calldata signature) external nonReentrant {
        if (block.timestamp > deadline) revert Expired();
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(WITHDRAW_TYPEHASH, address(this), amount, nonce, deadline))
        );
        if (!SignatureChecker.isValidSignatureNow(owner, digest, signature)) revert BadSignature();
        unchecked {
            nonce++;
        }
        _withdraw(amount);
    }

    /// @notice Pays accrued interest to the owner. Anyone may trigger it.
    function claim() external nonReentrant {
        IERC20 m = musd();
        uint256 before = m.balanceOf(address(this));
        vault().claimYield();
        uint256 interest = m.balanceOf(address(this)) - before;
        uint256 fee = _takeFee(interest);
        if (interest > fee) m.safeTransfer(owner, interest - fee);
        totalInterestPaid += interest - fee;
        emit InterestClaimed(interest, fee);
    }

    /// @notice Owner switches the Guard on or off.
    function setGuard(bool enabled) external onlyOwner {
        guardEnabled = enabled;
        emit GuardSet(enabled);
    }

    /// @notice The Guard pulls everything out of the vault to the owner's wallet.
    ///         Only the keeper, only while the owner has the Guard on.
    function guardExit(uint8 reason) external nonReentrant {
        if (msg.sender != factory.keeper()) revert NotKeeper();
        if (!guardEnabled) revert GuardOff();
        uint256 saved = vault().balanceOf(address(this));
        (uint256 interest, uint256 fee) = _withdraw(saved);
        emit GuardExit(reason, saved, interest, fee);
    }

    /// @notice Owner can always take any token the account holds (including sMUSD).
    function rescue(address token) external onlyOwner nonReentrant {
        IERC20 t = IERC20(token);
        uint256 amt = t.balanceOf(address(this));
        if (token == address(vault())) principal = principal > amt ? principal - amt : 0;
        t.safeTransfer(owner, amt);
    }

    function _withdraw(uint256 amount) internal returns (uint256 interest, uint256 fee) {
        if (amount == 0) revert ZeroAmount();
        IMUSDSavingsRate v = vault();
        if (amount > v.balanceOf(address(this))) revert TooMuch();
        IERC20 m = musd();
        uint256 before = m.balanceOf(address(this));
        v.withdraw(amount); // the vault also pays any accrued interest here
        uint256 received = m.balanceOf(address(this)) - before;
        interest = received > amount ? received - amount : 0;
        fee = _takeFee(interest);
        principal = principal > amount ? principal - amount : 0;
        totalInterestPaid += interest - fee;
        m.safeTransfer(owner, received - fee);
        emit Withdrawn(amount, interest, fee, owner);
    }

    /// @dev 10% of interest, only for savers above the free threshold ($100). Never touches principal.
    function _takeFee(uint256 interest) internal returns (uint256 fee) {
        if (interest == 0) return 0;
        (address treasury, uint256 feeBps, uint256 freeUpTo) = factory.feeConfig();
        // Size check uses principal before this withdrawal is booked.
        if (treasury == address(0) || feeBps == 0 || principal <= freeUpTo) return 0;
        fee = (interest * feeBps) / 10_000;
        if (fee > 0) {
            musd().safeTransfer(treasury, fee);
            totalFeesPaid += fee;
        }
    }
}
