/// function to calculate number of shares to recieve based on sol to deposited
/// current reward rate is set to 200
export const calculateEstimatedShares = (amount: string) => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return "0";
    return (amountNum * 200);
};
