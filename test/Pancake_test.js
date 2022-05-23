const { ethers } = require("hardhat");
const HRE = require('hardhat');
const { expect } = require("chai");
require("bignumber.js");
const { utils } = require("ethers");

const panCakeV2RouterAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const WETH_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";
const FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";

const DECIMAL_ZEROS = "000000000000000000"; // 18 zeros
const formatDecimals = 1000000000000000000;

const name = "Token";
const symbol = "TKN";
const initialSupply = 100000;


const currentTime = async () => {
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    return block.timestamp;
}


function printTable(QCONEReserve, BNBReserve, price) {
    console.table([
        ["LP QCONE", "LP WBNB Amount", "Price"],
        [QCONEReserve, BNBReserve, `${price} BNB/QCONE`]
    ]);
}


describe("Token Testing", function () {

    let token, panCakeRouter, panCakeFactory, pairAddress, panCakePair;

    beforeEach(async function () {

        // Deploying Token
        const Token = await HRE.ethers.getContractFactory("Token");
        token = await Token.deploy(name, symbol, initialSupply);
        await token.deployed();

        //Connecting Pancake


        panCakeRouter = await ethers.getContractAt("IPancakeV2Router02", panCakeV2RouterAddress);
        panCakeFactory = await ethers.getContractAt("IPancakeV2Factory", FACTORY_ADDRESS);

        await panCakeFactory.createPair(WETH_ADDRESS, token.address); // returns transaction

        pairAddress = await panCakeFactory.getPair(WETH_ADDRESS, token.address);

        panCakePair = await HRE.ethers.getContractAt("IPancakeV2Pair", pairAddress);

        console.log("token 1", await panCakePair.token0());

        //  Token 1 -> TKN 
        //  Token 2 -> WETH65


        [owner, addr1, addr2, addr3, _] = await ethers.getSigners();

        console.log("---------------------------------------------------")
        console.log("owner ->", owner.address);
        console.log("addr1 ->", addr1.address);
        console.log("addr2 ->", addr2.address);
        console.log("addr3 ->", addr3.address);
        console.log("pair ->", pairAddress);
        console.log("---------------------------------------------------")



        // await token.approve(panCakeV2RouterAddress, '40000'); // 40M to pancake router

        await token.approve(panCakeV2RouterAddress, '4000' + DECIMAL_ZEROS); // approving router to use owner contracts;


        await panCakeRouter.connect(owner).addLiquidityETH(token.address, '10000', 0, 0, owner.address, (Date.now() + 100000), { value: ethers.utils.parseEther('1000') }); // provide 1000 BNB + 100000 token liquidity to pancakeswap



        await token.connect(owner).transfer(addr3.address, '10000');


        // ********************************************************** Check this **************************************************
        // ************************************************************************************************************************
        // ************************************************************************************************************************
        //  await token.transfer(addr3.address, '10000' );



    });


    describe('Deployment', () => {
        const ownerInitialSupply = initialSupply - 10000 - 10000;

        it("tokens transferred by owner should be free", async () => {

            await token.transfer(addr1.address, 100);
            expect(await token.balanceOf(owner.address)).to.equal(ownerInitialSupply - 100);
            expect(await token.getFreeTokens(owner.address)).to.equal(ownerInitialSupply - 100);
            expect(await token.getFrozenTokens(owner.address)).to.equal(0);

            expect(await token.balanceOf(addr1.address)).to.equal(100);
            expect(await token.getFreeTokens(addr1.address)).to.equal(100);
            // expect(await token.getVestingCount(addr1.address)).to.equal(0);
            expect(await token.getFrozenTokens(addr1.address)).to.equal(0);
        })



        it("tokens bought from DEX should be free,# no previous vestings", async () => {

            const path = [WETH_ADDRESS, token.address];

            console.log("Initial price and liquidity");

            let reserves = await panCakePair.getReserves();
            // console.log(reserves);



            TKNReserve = reserves['reserve0'];
            BNBReserve = reserves['reserve1'] / formatDecimals;

            // TKNPrice = ((await panCakeRouter.getAmountsOut(ethers.utils.parseEther('1'), path))[1]);
            res = ((await panCakeRouter.getAmountsOut(ethers.utils.parseEther('1'), path)));
            console.log(res);
            // console.log("/*/*/*/*/*/*/*/*/*/*/*/****")
            return;


            // printTable(QCONEReserve, BNBReserve, QCONEPrice);

            // console.log("Before Exchange : ");

            console.log(await token.balanceOf(addr1.address));
            console.log(await token.getFreeTokens(addr1.address));
            console.log(await token.getFrozenTokens(addr1.address));

            console.log("/*/*/*/**/*/*/*/*/*/*/*/*/*/*/*/*/*/*/");


            let TKNPrice = await panCakePair.price0CumulativeLast();


            await panCakeRouter.connect(addr1).swapExactETHForTokens(0, path, addr1.address, (Date.now() + 100000), { value: ethers.utils.parseEther('1000') });

            let TKNPriceAfter = await panCakePair.price0CumulativeLast();

            console.log(TKNPrice, TKNPriceAfter);
            console.log("/*/*/*/**/*/*/*/*/*/*/*/*/*/*/*/*/*/*/");

            QCONEReserve = reserves['reserve0'] / formatDecimals;
            BNBReserve = reserves['reserve1'] / formatDecimals;

            QCONEPrice = ((await panCakeRouter.getAmountsOut(ethers.utils.parseEther('1'), path))[1]) / formatDecimals;
            // printTable(QCONEReserve, BNBReserve, QCONEPrice);
            console.log("After Exchange : ");


            console.log(await token.balanceOf(addr1.address));
            console.log(await token.getFreeTokens(addr1.address));
            console.log(await token.getFrozenTokens(addr1.address));
            console.log("aaaaaaaaaaaaaaaaaa");
        });

        it("Tokens brought from DEX should be free #previous vesting", async () => {
            return;

            const timeNow = await currentTime();
            const startTime = timeNow + 50 * 24 * 60 * 60;
            await token.setStartDate(startTime);

            const path = [WETH_ADDRESS, token.address];

            await token.sendFrozen(addr1.address, 100, 40, 10);

            const initialBalance = await token.balanceOf(addr1.address);
            const initialFree = await token.getFreeTokens(addr1.address);
            const initialFrozen = await token.getFrozenTokens(addr1.address);

            await panCakeRouter.connect(addr1).swapExactETHForTokens(0, path, addr1.address, (Date.now() + 100000), { value: ethers.utils.parseEther('1000') });

            expect(await token.getFrozenTokens(addr1.address)).to.equal(initialFrozen);



        })



        return;

        it("Scenario where user buy's 100 tokens and sells 100 tokens ", async () => {
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

            QCONEReserve = reserves['reserve0'] / formatDecimals;
            BNBReserve = reserves['reserve1'] / formatDecimals;

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
            QCONEReserve = reserves['reserve0'] / formatDecimals;
            BNBReserve = reserves['reserve1'] / formatDecimals;

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
            QCONEReserve = reserves['reserve0'] / formatDecimals;
            BNBReserve = reserves['reserve1'] / formatDecimals;

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
                value: ethers.utils.parseEther((parseFloat(QCONEPrice) * 100).toString())
            }
            )

            await panCakeRouter.connect(users[5]).swapExactETHForTokensSupportingFeeOnTransferTokens(
                0, // accept any amount of Tokens
                path,
                users[5].address,
                new Date().getTime(), {
                value: ethers.utils.parseEther((parseFloat(QCONEPrice) * 100).toString())
            }
            )
            console.log("busd balance", await rewardToken.balanceOf(ADMIN_WALLET));
            await panCakeRouter.connect(users[6]).swapExactETHForTokensSupportingFeeOnTransferTokens(
                0, // accept any amount of Tokens
                path,
                users[6].address,
                new Date().getTime(), {
                value: ethers.utils.parseEther((parseFloat(QCONEPrice) * 1000).toString())
            }
            )
            await panCakeRouter.connect(users[7]).swapExactETHForTokensSupportingFeeOnTransferTokens(
                0, // accept any amount of Tokens
                path,
                users[7].address,
                new Date().getTime(), {
                value: ethers.utils.parseEther((parseFloat(QCONEPrice) * 1000).toString())
            }
            )
            console.log("busd balance", await rewardToken.balanceOf(ADMIN_WALLET));
            reserves = await panCakePair.getReserves();
            QCONEReserve = reserves['reserve0'] / formatDecimals;
            BNBReserve = reserves['reserve1'] / formatDecimals;

            QCONEPrice = ((await panCakeRouter.getAmountsOut(ethers.utils.parseEther('1'), path.reverse()))[1]) / formatDecimals;
            printTable(QCONEReserve, BNBReserve, QCONEPrice);
        });
    });
});

