// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice The parts of Mezo's MUSDSavingsRate (sMUSD) vault that MezGuard uses.
interface IMUSDSavingsRate {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function claimYield() external returns (uint256 amount);
    function claimableYield(address account) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function musdToken() external view returns (address);
}

interface IMezGuardFactory {
    function vault() external view returns (address);
    function musd() external view returns (address);
    function keeper() external view returns (address);
    function feeConfig() external view returns (address treasury, uint256 feeBps, uint256 freeUpTo);
}
