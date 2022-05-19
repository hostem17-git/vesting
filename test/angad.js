






const { ethers } = require("hardhat");
const HRE = require('hardhat');
const { expect } = require("chai");
require("bignumber.js");
const { utils } = require("ethers");

const ADMIN_WALLET           = "0x69Ba7E86bbB074Cd5f72693DEb6ADc508D83A6bF";
const panCakeV2RouterAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const WETH_ADDRESS           = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const FACTORY_ADDRESS        = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";

const DECIMAL_ZEROS   = "000000000000000000"; // 18 zeros
const power = 1000000000000000000;

const totalSupply     = 21000000;

describe("Quantum Token Scenario", function() {
    let token, rewardToken, admin, users, panCakeRouter, panCakeFactory, pairAddress, panCakePair, funds;

    beforeEach(async function() {
        funds = ethers.utils.parseEther('9000');

        await HRE.network.provider.request({method: 'hardhat_impersonateAccount', params: [ADMIN_WALLET]});
        admin = await ethers.provider.getSigner(ADMIN_WALLET);
        
        const QuantumToken = await HRE.ethers.getContractFactory("Quantum");
        token              = await QuantumToken.deploy();
        await token.deployed();

        rewardToken    = await ethers.getContractAt("IERC20", "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56");
        panCakeRouter  = await ethers.getContractAt("IPancakeV2Router02", panCakeV2RouterAddress);
        panCakeFactory = await ethers.getContractAt("IPancakeV2Factory", FACTORY_ADDRESS);
        pairAddress = await panCakeFactory.getPair(WETH_ADDRESS, token.address);
        panCakePair = await HRE.ethers.getContractAt("IPancakeV2Pair", pairAddress);

        users = await ethers.getSigners();
        //await users[0].sendTransaction({to: ADMIN_WALLET, value: funds}); // Send some funds to admin wallet
        await users[1].sendTransaction({to: ADMIN_WALLET, value: funds}); // Send some funds to admin wallet
        await users[2].sendTransaction({to: ADMIN_WALLET, value: funds}); // Send some funds to admin wallet

        await token.connect(admin).approve(panCakeV2RouterAddress, '40000000' + DECIMAL_ZEROS); // 40M to pancake router
        await panCakeRouter.connect(admin).addLiquidityETH(token.address, '100000' + DECIMAL_ZEROS, 0, 0, ADMIN_WALLET, (Date.now() + 100000), 
        {value: ethers.utils.parseEther('1000')}); // provide 1000 BNB + 100000 token liquidity to pancakeswap

        await token.connect(admin).transfer(users[0].address, '10000' + DECIMAL_ZEROS);
    });

    describe('Deployment', () => {
        it("Scenario where user buy's 100 tokens and sells 100 tokens ", async() => {
            // set marketing wallet
            console.log("busd balance", await rewardToken.balanceOf(ADMIN_WALLET));
            await token.connect(admin).setMarketingWallet(users[2].address);
            expect(await token.MARKETING_WALLET()).to.equal(users[2].address);

            expect(await token.isAutomatedMarketMakerPair(pairAddress)).to.equal(true);

            // set lp recipient 
            await token.connect(admin).setLPRecipient(users[3].address);
            expect(await token.LP_recipient()).to.equal(users[3].address);

            let QCONEPrice, BNBReserve, QCONEReserve;
            const path = [token.address, WETH_ADDRESS];
            console.log("Initial price and liquidity");
            let reserves = await panCakePair.getReserves();
            QCONEReserve = reserves['reserve0']/formatDecimals;
            BNBReserve   = reserves['reserve1']/formatDecimals;

            QCONEPrice = ((await panCakeRouter.getAmountsOut(ethers.utils.parseEther('1'), path))[1]) / formatDecimals;
            printTable(QCONEReserve, BNBReserve, QCONEPrice);

            //////////////////////////////////
            console.log("After sale price and liquidity");
            await token.connect(users[0]).approve(panCakeV2RouterAddress, '800' + DECIMAL_ZEROS);
            await panCakeRouter.connect(users[0]).swapExactTokensForETHSupportingFeeOnTransferTokens(
                '800' + DECIMAL_ZEROS,
                0, // accept any amount of ETH
                path,
                users[0].address,
                new Date().getTime()
            )

            reserves = await panCakePair.getReserves();
            QCONEReserve = reserves['reserve0']/formatDecimals;
            BNBReserve   = reserves['reserve1']/formatDecimals;

            QCONEPrice = ((await panCakeRouter.getAmountsOut(ethers.utils.parseEther('1'), path))[1]) / formatDecimals;
            printTable(QCONEReserve, BNBReserve, QCONEPrice);
            let marketingFee = (await token.balanceOf(users[2].address)) / formatDecimals; 
            let contractBalance = (await token.balanceOf(token.address)) / formatDecimals; 

            //////////////////////////////////
            console.log("After sale price and liquidity");
            await token.connect(users[0]).approve(panCakeV2RouterAddress, '800' + DECIMAL_ZEROS);
            await panCakeRouter.connect(users[0]).swapExactTokensForETHSupportingFeeOnTransferTokens(
                '800' + DECIMAL_ZEROS,
                0, // accept any amount of ETH
                path,
                users[0].address,
                new Date().getTime()
            )
            reserves = await panCakePair.getReserves();
            QCONEReserve = reserves['reserve0']/formatDecimals;
            BNBReserve   = reserves['reserve1']/formatDecimals;

            QCONEPrice = ((await panCakeRouter.getAmountsOut(ethers.utils.parseEther('1'), path))[1]) / formatDecimals;
            printTable(QCONEReserve, BNBReserve, QCONEPrice);
            marketingFee = (await token.balanceOf(users[2].address)) / formatDecimals; 
            contractBalance = (await token.balanceOf(token.address)) / formatDecimals; 

            //////////////////////////////////
            console.log("After buy price and liquidity");
            console.log("busd balance", await rewardToken.balanceOf(ADMIN_WALLET));
            await panCakeRouter.connect(users[4]).swapExactETHForTokensSupportingFeeOnTransferTokens(
                0, // accept any amount of Tokens
                path.reverse(),
                users[4].address,
                new Date().getTime(), {
                    value: ethers.utils.parseEther((parseFloat(QCONEPrice)*100).toString())
                }
            )

            await panCakeRouter.connect(users[5]).swapExactETHForTokensSupportingFeeOnTransferTokens(
                0, // accept any amount of Tokens
                path,
                users[5].address,
                new Date().getTime(), {
                    value: ethers.utils.parseEther((parseFloat(QCONEPrice)*100).toString())
                }
            )
            console.log("busd balance", await rewardToken.balanceOf(ADMIN_WALLET));
            await panCakeRouter.connect(users[6]).swapExactETHForTokensSupportingFeeOnTransferTokens(
                0, // accept any amount of Tokens
                path,
                users[6].address,
                new Date().getTime(), {
                    value: ethers.utils.parseEther((parseFloat(QCONEPrice)*1000).toString())
                }
            )
            await panCakeRouter.connect(users[7]).swapExactETHForTokensSupportingFeeOnTransferTokens(
                0, // accept any amount of Tokens
                path,
                users[7].address,
                new Date().getTime(), {
                    value: ethers.utils.parseEther((parseFloat(QCONEPrice)*1000).toString())
                }
            )
            console.log("busd balance", await rewardToken.balanceOf(ADMIN_WALLET));
            reserves = await panCakePair.getReserves();
            QCONEReserve = reserves['reserve0']/formatDecimals;
            BNBReserve   = reserves['reserve1']/formatDecimals;

            QCONEPrice = ((await panCakeRouter.getAmountsOut(ethers.utils.parseEther('1'), path.reverse()))[1]) / formatDecimals;
            printTable(QCONEReserve, BNBReserve, QCONEPrice);
        });
    });

    function printTable(QCONEReserve, BNBReserve, price) {
        console.table([
            ["LP QCONE", "LP WBNB Amount", "Price"],
            [QCONEReserve, BNBReserve, `${price} BNB/QCONE`]
        ]);
    }
});

// command to check eth balance
// why does it crash on changing






















// const HRE = require('hardhat');
// const { BigNumber } = require("@ethersproject/bignumber");
// const { expect } = require("chai");
// const { defaultAccounts } = require("ethereum-waffle");
// const CHARITY_WALLET = "0xaf72Fb3310561C0826fdF852c05bC50BF54989cd";
// const ADMIN_WALLET = "0x69Ba7E86bbB074Cd5f72693DEb6ADc508D83A6bF";
// const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";
// const panCakeV2RouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";

// const DECIMAL_ZEROS = "000000000000000000"; // 18 zeros
// const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";


// describe("Token locker", function() {
//     const advanceBlock = () => new Promise((resolve, reject) => {
//         web3.currentProvider.send({
//             jsonrpc: '2.0',
//             method: 'evm_mine',
//             id: new Date().getTime(),
//         }, async (err, result) => {
//             if (err) { return reject(err) }
//             // const newBlockhash =await web3.eth.getBlock('latest').hash
//             return resolve()
//         })
//     })
    
//     const advanceBlocks = async (num) => {
//         let resp = []
//         for (let i = 0; i < num; i += 1) {
//             resp.push(advanceBlock())
//         }
//         await Promise.all(resp)
//     }
    
//     const advancetime = (time) => new Promise((resolve, reject) => {
//         web3.currentProvider.send({
//             jsonrpc: '2.0',
//             method: 'evm_increaseTime',
//             id: new Date().getTime(),
//             params: [time],
//         }, async (err, result) => {
//             if (err) { return reject(err) }
//             const newBlockhash = (await web3.eth.getBlock('latest')).hash
    
//             return resolve(newBlockhash)
//         })
//     })
//     beforeEach(async function () {
//         users = await ethers.getSigners();
//         const tenEther = ethers.utils.parseEther('50');
//         const SeaToken = await ethers.getContractFactory("SeaToken");
//         const TokenLocker = await ethers.getContractFactory("TKNLocker");
//         tokenLocker = await TokenLocker.deploy();
//         seaToken = await SeaToken.deploy();
//         this.panCakeRouter = await ethers.getContractAt("IPancakeV2Router02", panCakeV2RouterAddress);

//         await seaToken.deployed();
//         await tokenLocker.deployed();

//         await users[0].sendTransaction({to: ADMIN_WALLET, value: tenEther}); // Send some funds to admin wallet
//         await HRE.network.provider.request({method: 'hardhat_impersonateAccount', params: [ADMIN_WALLET]})
//         admin = await ethers.provider.getSigner(ADMIN_WALLET);

//         await seaToken.connect(admin).transfer(users[0].address, '10000' + DECIMAL_ZEROS);
//         await seaToken.connect(admin).approve(panCakeV2RouterAddress, '40000000' + DECIMAL_ZEROS); // 40M to pancake router

//         await this.panCakeRouter.connect(admin).addLiquidityETH(seaToken.address, '40000000' + DECIMAL_ZEROS, 0, 0, ADMIN_WALLET, new Date().getTime(), {
//             value: ethers.utils.parseEther('40')
//         }); // provide 40 BNB + 40M token liquidity to pancakeswap

//         await seaToken.connect(admin).transfer(users[2].address, '100000' + DECIMAL_ZEROS);
//         await seaToken.connect(admin).burn();
//         await tokenLocker.updateToken(seaToken.address);
//     });

//     it("Withdraw function should throw error before cliff_time", async function() {
//         const amount = `15000${DECIMAL_ZEROS}`;
//         await tokenLocker.enableLockupWindow();
//         await seaToken.connect(users[2]).approve(tokenLocker.address, amount);
//         await tokenLocker.connect(users[2]).lock(amount);
//         await expect(tokenLocker.connect(users[2]).withdraw()).to.be.revertedWith('TL: cannot claim before token generation event');
//     }); 

//     it("Withdraw function should throw error for cancelled locker", async function() {
//         const amount = `15000${DECIMAL_ZEROS}`;
//         await tokenLocker.enableLockupWindow();
//         await seaToken.connect(users[2]).approve(tokenLocker.address, amount);
//         await tokenLocker.connect(users[2]).lock(amount);
//         await tokenLocker.connect(users[2]).unlockAndCancel()
//         await tokenLocker.disableLockupWindow();
//         await tokenLocker.enableTokenDistribution();
//         await expect(tokenLocker.connect(users[2]).withdraw()).to.be.revertedWith('TL: Not eligible to claim');
//     }); 

//     it("Withdraw function should throw error for no locker", async function() {
//         const amount = `15000${DECIMAL_ZEROS}`;
//         await tokenLocker.enableTokenDistribution();
//         await expect(tokenLocker.connect(users[2]).withdraw()).to.be.revertedWith('TL: Not eligible to claim');
//     }); 

//     it("enableTokenDistribution should throw error when lockupwindow is open", async function() {
//         const amount = `15000${DECIMAL_ZEROS}`;
//         await tokenLocker.enableLockupWindow();
//         await expect(tokenLocker.enableTokenDistribution()).to.be.revertedWith("Can't enable token distribution when lockup window is still open");
//     }); 

//     it("enableTokenDistribution should throw error when already enabled", async function() {
//         const amount = `15000${DECIMAL_ZEROS}`;
//         await tokenLocker.enableTokenDistribution();
//         await expect(tokenLocker.enableTokenDistribution()).to.be.revertedWith("Can't enable token distribution when it is already active");
//     }); 

//     it("cancel locker after cliff_time", async function() {
//         const amount = `15000${DECIMAL_ZEROS}`;
//         await tokenLocker.enableLockupWindow();
//         await seaToken.connect(users[2]).approve(tokenLocker.address, amount);
//         await tokenLocker.connect(users[2]).lock(amount);
//         await tokenLocker.disableLockupWindow();
//         await tokenLocker.enableTokenDistribution();

//         const lockerInfo = await tokenLocker.getLockerInfo(0);
//         console.log(BigNumber.from(lockerInfo.amount).div(BigInt(1000000000000000000)));
//         console.log(await tokenLocker.connect(users[2]).calculateClaimableAmount(users[2].address));
//         for(let i = 0; i < 45; i++) {
//             await advancetime(1 * 24 * 60 * 60);
//             await advanceBlock();
//             await tokenLocker.connect(users[2]).withdraw();
//         }
//         console.log(BigNumber.from(await tokenLocker.connect(users[2]).calculateClaimableAmount(users[2].address)).div(BigInt(1000000000000000000)));
//         console.log("--------");
//         console.log(await seaToken.balanceOf(users[2].address));
//         await tokenLocker.connect(users[2]).unlockAndCancel();
//         console.log(await seaToken.balanceOf(users[2].address));
//     }); 

//     it("calculate rewards", async function() {
//         const amount = `15000${DECIMAL_ZEROS}`;
//         await tokenLocker.enableLockupWindow();
//         await seaToken.connect(users[2]).approve(tokenLocker.address, amount);
//         await tokenLocker.connect(users[2]).lock(amount);
//         await tokenLocker.disableLockupWindow();
//         await tokenLocker.enableTokenDistribution();

//         const lockerInfo = await tokenLocker.getLockerInfo(0);
//         console.log(BigNumber.from(lockerInfo.amount).div(BigInt(1000000000000000000)));
//         console.log(await tokenLocker.connect(users[2]).calculateClaimableAmount(users[2].address));
//         for(let i = 0; i < 90; i++) {
//             await advancetime(1 * 24 * 60 * 60);
//             await advanceBlock();
//             console.log(BigNumber.from(await tokenLocker.connect(users[2]).calculateClaimableAmount(users[2].address)).div(BigInt(1000000000000000000)));
//         }
//     }); 


//     it("rewards and claim", async function() {
//         const amount = `15000${DECIMAL_ZEROS}`;
//         await tokenLocker.enableLockupWindow();
//         await seaToken.connect(users[2]).approve(tokenLocker.address, amount);
//         console.log("--------");
//         console.log(await seaToken.balanceOf(users[2].address));
//         await tokenLocker.connect(users[2]).lock(amount);
//         console.log(await seaToken.balanceOf(users[2].address));
//         await tokenLocker.disableLockupWindow();
//         await tokenLocker.enableTokenDistribution();

//         const lockerInfo = await tokenLocker.getLockerInfo(0);
//         console.log(BigNumber.from(lockerInfo.amount).div(BigInt(1000000000000000000)));
//         console.log(await tokenLocker.connect(users[2]).calculateClaimableAmount(users[2].address));
//         console.log(BigNumber.from(await tokenLocker.connect(users[2]).calculateClaimableAmount(users[2].address)).div(BigInt(1000000000000000000)));
//         console.log("--------");
//         console.log(await seaToken.balanceOf(users[2].address));
//         await tokenLocker.connect(users[2]).withdraw();
//         console.log(await seaToken.balanceOf(users[2].address));
//         await advancetime(1 * 24 * 60 * 60);
//         await advanceBlock();
//         console.log(BigNumber.from(await tokenLocker.connect(users[2]).calculateClaimableAmount(users[2].address)).div(BigInt(1000000000000000000)));
//     }); 
// });