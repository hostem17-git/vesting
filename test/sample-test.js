const { expect } = require("chai");
const { ethers } = require("hardhat");




const name = "Token";
const symbol = "TKN";
const initialSupply = 1000;

const digits ="000000000000000000"


describe("Token Testing", function () {

  console.log("start testing")
  let Token, token, owner, addr1, addr2;

  const increaseTime = async (days) => {
    await ethers.provider.send('evm_increaseTime', [days * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine');
  };

  const currentTime = async () => {
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    return block.timestamp;
  }

  beforeEach(async () => {
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy(name, symbol, initialSupply);
    await token.deployed();
    [owner, addr1, addr2, _] = await ethers.getSigners();
  })


  describe("External testing", async () => {

    it("Should transfer forzen tokens",async()=>{

      await token.transfer(addr2.address,200);

      // Transfer before adding as source, works on testnet 
      await token.connect(addr2).transfer(addr1.address,50);

      const timeNow = await currentTime();
      const startTime = timeNow + 5 * 60;
      // start Date = current time + 5 minutes 
      await token.setStartDate(startTime);
      
      expect(await token.balanceOf(addr1.address)).to.equal(50);
      expect(await token.getFreeTokens(addr1.address)).to.equal(50);

      expect(await token.balanceOf(addr2.address)).to.equal(150);
      expect(await token.getFreeTokens(addr2.address)).to.equal(150);


      await token.addSource(addr2.address,40,10);

      // Failing on testnet
      await token.connect(addr2).transfer(addr1.address,50);

      expect(await token.balanceOf(addr1.address)).to.equal(100);
      expect(await token.getFreeTokens(addr1.address)).to.equal(50);


    })
  });

  // return;
  describe("External Source Vesting", async () => {

    it("Should Handle external source Vesting # No user transaction", async () => {

      const timeNow = await currentTime();
      const startTime = timeNow + 50 * 24 * 60 * 60;

      await token.setStartDate(startTime);
      await expect(token.connect(addr2).transfer(addr1.address, 100)).to.be.revertedWith("Not Enough free tokens");

      await token.transfer(addr2.address, 200); // Transferred while listing;

      await token.connect(addr2).transfer(addr1.address, 100);

      expect(await token.getFrozenTokens(addr1.address), "Transfer from unlisted source will not be frozen").to.equal(0);
      expect(await token.getFreeTokens(addr1.address), "Transfer from unlisted source will not be frozen").to.equal(100);

      await token.addSource(addr2.address, 20, 10);

      await token.connect(addr2).transfer(addr1.address, 100);

      expect(await token.balanceOf(addr1.address), "Before Vesting:token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "Before Vesting:tokens should be free").to.equal(100);
      expect(await token.getFrozenTokens(addr1.address), "Before Vesting:tokens should be frozen").to.equal(100);

      await increaseTime(51);

      expect(await token.balanceOf(addr1.address), "1st Vesting:token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "1st Vesting:tokens should be free").to.equal(120);
      expect(await token.getFrozenTokens(addr1.address), "1st Vesting:tokens should be frozen").to.equal(80);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "2nd Vesting:token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "2nd Vesting:tokens should be free").to.equal(130);
      expect(await token.getFrozenTokens(addr1.address), "2nd Vesting:tokens should be frozen").to.equal(70);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "3rd Vesting:token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "3rd Vesting:tokens should be free").to.equal(140);
      expect(await token.getFrozenTokens(addr1.address), "3rd Vesting:tokens should be frozen").to.equal(60);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "4th Vesting:token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "4th Vesting:tokens should be free").to.equal(150);
      expect(await token.getFrozenTokens(addr1.address), "4th Vesting:tokens should be frozen").to.equal(50);

      await increaseTime(30);
      expect(await token.balanceOf(addr1.address), "5th Vesting:token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "5th Vesting:tokens should be free").to.equal(160);
      expect(await token.getFrozenTokens(addr1.address), "5th Vesting:tokens should be frozen").to.equal(40);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "6th Vesting:token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "6th Vesting:tokens should be free").to.equal(170);
      expect(await token.getFrozenTokens(addr1.address), "6th Vesting:tokens should be frozen").to.equal(30);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "7th Vesting:token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "7th Vesting:tokens should be free").to.equal(180);
      expect(await token.getFrozenTokens(addr1.address), "7th 7esting:tokens should be frozen").to.equal(20);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "8th Vesting:token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "8th Vesting:tokens should be free").to.equal(190);
      expect(await token.getFrozenTokens(addr1.address), "8th 7esting:tokens should be frozen").to.equal(10);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "9th Vesting:token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "9th Vesting:tokens should be free").to.equal(200);
      expect(await token.getFrozenTokens(addr1.address), "9th 7esting:tokens should be frozen").to.equal(0);

    });


    it("Should handle source vesting #user transactions", async () => {

      const timeNow = await currentTime();
      const startTime = timeNow + 50 * 24 * 60 * 60;

      await token.setStartDate(startTime);


      await expect(token.setStartDate(timeNow + 90 * 24 * 60 * 60)).to.be.revertedWith("Cannot change Vesting start date");

      await expect(token.connect(addr2).transfer(addr1.address, 100)).to.be.revertedWith("Not Enough free tokens");

      await token.transfer(addr2.address, 200); // Transferred while listing;

      await token.connect(addr2).transfer(addr1.address, 100);


      expect(await token.getFrozenTokens(addr1.address), "Transfer from unlisted source will not be frozen").to.equal(0);
      expect(await token.getFreeTokens(addr1.address), "Transfer from unlisted source will not be frozen").to.equal(100);

      await token.addSource(addr2.address, 20, 10);

      await token.connect(addr2).transfer(addr1.address, 100);

      expect(await token.balanceOf(addr1.address), "token transfer").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "tokens should be free").to.equal(100);
      expect(await token.getFrozenTokens(addr1.address), "tokens should be frozen").to.equal(100);

      await increaseTime(75);

      await token.connect(addr1).transfer(addr2.address, 20);

      expect(await token.balanceOf(addr1.address), "token transfer").to.equal(180);
      expect(await token.getFreeTokens(addr1.address), "tokens should be free").to.equal(110);
      expect(await token.getFrozenTokens(addr1.address), "tokens should be frozen").to.equal(70);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "token transfer").to.equal(180);
      expect(await token.getFreeTokens(addr1.address), "tokens should be free").to.equal(120);
      expect(await token.getFrozenTokens(addr1.address), "tokens should be frozen").to.equal(60);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "1st vesting :token transfer").to.equal(180);
      expect(await token.getFreeTokens(addr1.address), "1st vesting :tokens should be free").to.equal(130);
      expect(await token.getFrozenTokens(addr1.address), "1st vesting :tokens should be frozen").to.equal(50);

      await token.connect(addr1).transfer(addr2.address, 20);

      await increaseTime(60);

      expect(await token.balanceOf(addr1.address), "2nd vesting :token transfer").to.equal(160);
      expect(await token.getFreeTokens(addr1.address), "2nd vesting :tokens should be free").to.equal(130);
      expect(await token.getFrozenTokens(addr1.address), "2nd vesting :tokens should be frozen").to.equal(30);

      await increaseTime(90);

      expect(await token.balanceOf(addr1.address), "4th vesting :token transfer").to.equal(160);
      expect(await token.getFreeTokens(addr1.address), "4th vesting :tokens should be free").to.equal(160);
      expect(await token.getFrozenTokens(addr1.address), "4th vesting :tokens should be frozen").to.equal(00);

      await token.connect(addr1).transfer(addr2.address, 10);
    });

  });

  // return;

  describe("Base setup", async () => {

    it("should set the right owner free balance", async () => {

      expect(await token.getFreeTokens(owner.address)).to.equal(await token.balanceOf(owner.address));

    })

    it('Should set the right name', async () => {
      expect(await token.name()).to.equal(name);
    });

    it("Should set right symbol", async () => {
      expect(await token.symbol()).to.equal(symbol);
    });

    it("Should set right owner balance", async () => {
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
    });

    it("Should set right decimals", async () => {
      expect(await token.decimals()).to.equal(18);
    })

    it("Should set the right owner", async () => {
      expect(await token.owner()).to.equal(owner.address);
    })

    it("Should set right Owner free tokens", async () => {
      expect(await token.getFreeTokens(owner.address)).to.equal(initialSupply);
    })
  });


  describe("Owner Transfers", async () => {

    it("Should allow owner to send free tokens", async () => {


      await token.transfer(addr1.address, 100);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply - 100);
      expect(await token.getFreeTokens(owner.address)).to.equal(initialSupply - 100);
      expect(await token.getFrozenTokens(owner.address)).to.equal(0);

      expect(await token.balanceOf(addr1.address)).to.equal(100);
      expect(await token.getFreeTokens(addr1.address)).to.equal(100);
      // expect(await token.getVestingCount(addr1.address)).to.equal(0);
      expect(await token.getFrozenTokens(addr1.address)).to.equal(0);

    })


    it("Should allow owner to send frozen Tokens", async () => {

      await expect(token.sendFrozen(addr1.address, 50, 20, 10)).to.be.revertedWith("Vesting not yet started");
      expect(await token.balanceOf(addr1.address)).to.equal(0);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply);

      const timeNow = await currentTime();
      await token.setStartDate(timeNow + 10 * 24 * 60 * 60);
      //Setting vesting startdate;

      await token.sendFrozen(addr1.address, 50, 20, 10);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply - 50);
      expect(await token.getFreeTokens(owner.address)).to.equal(initialSupply - 50);

      expect(await token.balanceOf(addr1.address)).to.equal(50);
      expect(await token.getFreeTokens(addr1.address)).to.equal(0);
      // expect(await token.getVestingCount(addr1.address)).to.equal(1);
      expect(await token.getFrozenTokens(addr1.address)).to.equal(50);
    })


    it("Should Restrict others from sending frozen Tokens", async () => {
      await expect(token.connect(addr1).sendFrozen(addr2.address, 50, 20, 10)).to.be.revertedWith("Ownable: caller is not the owner");
    });


    it("Manual Vesting Scenario #1 - no user transactions", async () => {
      const timeNow = await currentTime();
      const startTime = timeNow + 50 * 24 * 60 * 60;

      await token.setStartDate(startTime);
      await token.sendFrozen(addr1.address, 100, 20, 10);

      expect(await token.balanceOf(addr1.address), "Before Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "Before Vesting:tokens should be free").to.equal(0);
      expect(await token.getFrozenTokens(addr1.address), "Before Vesting:tokens should be frozen").to.equal(100);

      await increaseTime(51);

      expect(await token.balanceOf(addr1.address), "1st Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "1st Vesting:tokens should be free").to.equal(20);
      expect(await token.getFrozenTokens(addr1.address), "1st Vesting:tokens should be frozen").to.equal(80);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "2nd Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "2nd Vesting:tokens should be free").to.equal(30);
      expect(await token.getFrozenTokens(addr1.address), "2nd Vesting:tokens should be frozen").to.equal(70);
      expect(await token.getVestingCycles(addr1.address), "vesting Count").to.equal(7);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "3rd Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "3rd Vesting:tokens should be free").to.equal(40);
      expect(await token.getFrozenTokens(addr1.address), "3rd Vesting:tokens should be frozen").to.equal(60);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "4th Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "4th Vesting:tokens should be free").to.equal(50);
      expect(await token.getFrozenTokens(addr1.address), "4th Vesting:tokens should be frozen").to.equal(50);

      await increaseTime(30);
      expect(await token.balanceOf(addr1.address), "5th Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "5th Vesting:tokens should be free").to.equal(60);
      expect(await token.getFrozenTokens(addr1.address), "5th Vesting:tokens should be frozen").to.equal(40);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "6th Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "6th Vesting:tokens should be free").to.equal(70);
      expect(await token.getFrozenTokens(addr1.address), "6th Vesting:tokens should be frozen").to.equal(30);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "7th Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "7th Vesting:tokens should be free").to.equal(80);
      expect(await token.getFrozenTokens(addr1.address), "7th 7esting:tokens should be frozen").to.equal(20);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "8th Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "8th Vesting:tokens should be free").to.equal(90);
      expect(await token.getFrozenTokens(addr1.address), "8th 7esting:tokens should be frozen").to.equal(10);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "9th Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "9th Vesting:tokens should be free").to.equal(100);
      expect(await token.getFrozenTokens(addr1.address), "9th 7esting:tokens should be frozen").to.equal(0);
    });


    it("Manual Vesting Scenario #2 - transactions in betweeen vesting", async () => {

      const timeNow = await currentTime();
      const startTime = timeNow + 10 * 24 * 60 * 60;

      await token.setStartDate(startTime);

      await token.sendFrozen(addr1.address, 100, 20, 10);

      let vestingDets = await token.getVestingDetails(addr1.address, 0);

      expect(await token.balanceOf(addr1.address), "token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "tokens should be frozen").to.equal(0);
      expect(await token.getFrozenTokens(addr1.address), "tokens should be frozen").to.equal(100);

      await increaseTime(35);
      balance = await token.balanceOf(addr1.address);
      free = await token.getFreeTokens(addr1.address);
      frozen = await token.getFrozenTokens(addr1.address);

      await token.connect(addr1).transfer(addr2.address, 20);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "token transfer").to.equal(80);
      expect(await token.getFreeTokens(addr1.address), "tokens should be free").to.equal(10);
      expect(await token.getFrozenTokens(addr1.address), "tokens should be frozen").to.equal(70);
      expect(await token.getVestingCycles(addr1.address), "vesting Count").to.equal(7);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "token transfer").to.equal(80);
      expect(await token.getFreeTokens(addr1.address), "tokens should be free").to.equal(20);
      expect(await token.getFrozenTokens(addr1.address), "tokens should be frozen").to.equal(60);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "1st vesting :token transfer").to.equal(80);
      expect(await token.getFreeTokens(addr1.address), "1st vesting :tokens should be free").to.equal(30);
      expect(await token.getFrozenTokens(addr1.address), "1st vesting :tokens should be frozen").to.equal(50);

      await token.connect(addr1).transfer(addr2.address, 20);

      await increaseTime(60);

      expect(await token.balanceOf(addr1.address), "2nd vesting :token transfer").to.equal(60);
      expect(await token.getFreeTokens(addr1.address), "2nd vesting :tokens should be free").to.equal(30);
      expect(await token.getFrozenTokens(addr1.address), "2nd vesting :tokens should be frozen").to.equal(30);

      await increaseTime(90);

      expect(await token.balanceOf(addr1.address), "4th vesting :token transfer").to.equal(60);
      expect(await token.getFreeTokens(addr1.address), "4th vesting :tokens should be free").to.equal(60);
      expect(await token.getFrozenTokens(addr1.address), "4th vesting :tokens should be frozen").to.equal(00);

      await token.connect(addr1).transfer(addr2.address, 10);

      vestingDets = await token.getVestingDetails(addr1.address, 0);

      console.log({
        "data": vestingDets.toString()
      });

    })


    it("Manual Vesting Scenario #3 - Manual Unfreeze ,no user transactions", async () => {
      const timeNow = await currentTime();
      const startTime = timeNow + 50 * 24 * 60 * 60;

      await token.setStartDate(startTime);
      await token.sendFrozen(addr1.address, 100, 20, 10);

      expect(await token.balanceOf(addr1.address), "Before Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "Before Vesting:tokens should be free").to.equal(0);
      expect(await token.getFrozenTokens(addr1.address), "Before Vesting:tokens should be frozen").to.equal(100);

      await increaseTime(51);

      expect(await token.balanceOf(addr1.address), "1st Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "1st Vesting:tokens should be free").to.equal(20);
      expect(await token.getFrozenTokens(addr1.address), "1st Vesting:tokens should be frozen").to.equal(80);

      await token.unfreezeAmount(addr1.address, 40);

      expect(await token.balanceOf(addr1.address), "1st Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "1st Vesting:tokens should be free").to.equal(60);
      expect(await token.getFrozenTokens(addr1.address), "1st Vesting:tokens should be frozen").to.equal(40);



      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "2nd Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "2nd Vesting:tokens should be free").to.equal(70);
      expect(await token.getFrozenTokens(addr1.address), "2nd Vesting:tokens should be frozen").to.equal(30);
      expect(await token.getVestingCycles(addr1.address), "vesting Count ->").to.equal(3);

      await increaseTime(10);

      await token.unfreezeAmount(addr1.address, 13);

      expect(await token.balanceOf(addr1.address), "2nd Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "2nd Vesting:tokens should be free").to.equal(90);
      expect(await token.getFrozenTokens(addr1.address), "2nd Vesting:tokens should be frozen").to.equal(10);


      await increaseTime(20);

      expect(await token.balanceOf(addr1.address), "2nd Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "2nd Vesting:tokens should be free").to.equal(90);
      expect(await token.getFrozenTokens(addr1.address), "2nd Vesting:tokens should be frozen").to.equal(10);

      await increaseTime(10);

      expect(await token.balanceOf(addr1.address), "3rd Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "3rd Vesting:tokens should be free").to.equal(100);
      expect(await token.getFrozenTokens(addr1.address), "3rd Vesting:tokens should be frozen").to.equal(0);

    });


    it("Manual Vesting Scenario #3 - Manual Unfreeze ,no user transactions", async () => {
      const timeNow = await currentTime();
      const startTime = timeNow + 50 * 24 * 60 * 60;

      await token.setStartDate(startTime);
      await token.sendFrozen(addr1.address, 100, 20, 10);

      expect(await token.balanceOf(addr1.address), "Before Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "Before Vesting:tokens should be free").to.equal(0);
      expect(await token.getFrozenTokens(addr1.address), "Before Vesting:tokens should be frozen").to.equal(100);

      await increaseTime(51);

      expect(await token.balanceOf(addr1.address), "1st Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "1st Vesting:tokens should be free").to.equal(20);
      expect(await token.getFrozenTokens(addr1.address), "1st Vesting:tokens should be frozen").to.equal(80);

      await token.unfreezeAmount(addr1.address, 40);

      expect(await token.balanceOf(addr1.address), "1st Vesting:token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "1st Vesting:tokens should be free").to.equal(60);
      expect(await token.getFrozenTokens(addr1.address), "1st Vesting:tokens should be frozen").to.equal(40);

      await token.connect(addr1).transfer(addr2.address, 50);

      expect(await token.balanceOf(addr1.address), "1st Vesting:token transfer").to.equal(50);
      expect(await token.getFreeTokens(addr1.address), "1st Vesting:tokens should be free").to.equal(10);
      expect(await token.getFrozenTokens(addr1.address), "1st Vesting:tokens should be frozen").to.equal(40);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "2nd Vesting:token transfer").to.equal(50);
      expect(await token.getFreeTokens(addr1.address), "2nd Vesting:tokens should be free").to.equal(20);
      expect(await token.getFrozenTokens(addr1.address), "2nd Vesting:tokens should be frozen").to.equal(30);
      expect(await token.getVestingCycles(addr1.address), "vesting Count ->").to.equal(3);

      await increaseTime(10);

      await token.unfreezeAmount(addr1.address, 13);

      expect(await token.balanceOf(addr1.address), "2nd Vesting:token transfer").to.equal(50);
      expect(await token.getFreeTokens(addr1.address), "2nd Vesting:tokens should be free").to.equal(40);
      expect(await token.getFrozenTokens(addr1.address), "2nd Vesting:tokens should be frozen").to.equal(10);


      await increaseTime(20);

      expect(await token.balanceOf(addr1.address), "2nd Vesting:token transfer").to.equal(50);
      expect(await token.getFreeTokens(addr1.address), "2nd Vesting:tokens should be free").to.equal(40);
      expect(await token.getFrozenTokens(addr1.address), "2nd Vesting:tokens should be frozen").to.equal(10);

      await increaseTime(10);

      expect(await token.balanceOf(addr1.address), "3rd Vesting:token transfer").to.equal(50);
      expect(await token.getFreeTokens(addr1.address), "3rd Vesting:tokens should be free").to.equal(50);
      expect(await token.getFrozenTokens(addr1.address), "3rd Vesting:tokens should be frozen").to.equal(0);

    });






  });




  describe("Mulitple Vesting Test", async () => {

    it("Should handle multi-source vesting #no user transactions", async () => {

      const timeNow = await currentTime();
      const startTime = timeNow + 15 * 24 * 60 * 60;

      await token.setStartDate(startTime);

      await token.sendFrozen(addr1.address, 100, 40, 20);

      expect(await token.balanceOf(addr1.address), "Before Vesting: total tokens").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "Before Vesting: tokens free").to.equal(0);
      expect(await token.getFrozenTokens(addr1.address), "Before Vesting: tokens frozen").to.equal(100);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "1 : total tokens").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "1 : tokens free").to.equal(40);
      expect(await token.getFrozenTokens(addr1.address), "1 : tokens frozen").to.equal(60);

      await token.transfer(addr2.address, 100); // adding source
      await token.addSource(addr2.address, 60, 20);

      await token.connect(addr2).transfer(addr1.address, 100);  // 2nd Vesting

      await increaseTime(20); // 50

      expect(await token.balanceOf(addr1.address), "2: total tokens").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "2: tokens free").to.equal(60);
      expect(await token.getFrozenTokens(addr1.address), "2: tokens frozen").to.equal(140);

      await increaseTime(20); // 70


      expect(await token.balanceOf(addr1.address), "3: total tokens").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "3: tokens free").to.equal(120);
      expect(await token.getFrozenTokens(addr1.address), "3: tokens frozen").to.equal(80);

      await increaseTime(20); // 90

      expect(await token.balanceOf(addr1.address), "4: total tokens").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "4: tokens free").to.equal(160);
      expect(await token.getFrozenTokens(addr1.address), "4: tokens frozen").to.equal(40);

      await increaseTime(20); // 110

      expect(await token.balanceOf(addr1.address), "5: total tokens").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "5: tokens free").to.equal(180);
      expect(await token.getFrozenTokens(addr1.address), "5: tokens frozen").to.equal(20);

      await increaseTime(20); // 110

      expect(await token.balanceOf(addr1.address), "5: total tokens").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "5: tokens free").to.equal(200);
      expect(await token.getFrozenTokens(addr1.address), "5: tokens frozen").to.equal(0);

    });


    it("Should handle multi-source vesting #User transactions", async () => {

      const timeNow = await currentTime();
      const startTime = timeNow + 15 * 24 * 60 * 60;

      await token.setStartDate(startTime);

      await token.sendFrozen(addr1.address, 100, 40, 20);

      expect(await token.balanceOf(addr1.address), "Before Vesting: total tokens").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "Before Vesting: tokens free").to.equal(0);
      expect(await token.getFrozenTokens(addr1.address), "Before Vesting: tokens frozen").to.equal(100);

      await increaseTime(30);

      expect(await token.balanceOf(addr1.address), "1 : total tokens").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "1 : tokens free").to.equal(40);
      expect(await token.getFrozenTokens(addr1.address), "1 : tokens frozen").to.equal(60);

      await token.transfer(addr2.address, 100); // adding source
      await token.addSource(addr2.address, 60, 20);

      await token.connect(addr2).transfer(addr1.address, 100);  // 2nd Vesting

      await increaseTime(20); // 50

      expect(await token.balanceOf(addr1.address), "2: total tokens").to.equal(200);
      expect(await token.getFreeTokens(addr1.address), "2: tokens free").to.equal(60);
      expect(await token.getFrozenTokens(addr1.address), "2: tokens frozen").to.equal(140);

      await increaseTime(20); // 70

      await token.connect(addr1).transfer(owner.address, 50)

      expect(await token.balanceOf(addr1.address), "3: total tokens").to.equal(150);
      expect(await token.getFreeTokens(addr1.address), "3: tokens free").to.equal(70);
      expect(await token.getFrozenTokens(addr1.address), "3: tokens frozen").to.equal(80);

      await increaseTime(20); // 90

      expect(await token.balanceOf(addr1.address), "4: total tokens").to.equal(150);
      expect(await token.getFreeTokens(addr1.address), "4: tokens free").to.equal(110);
      expect(await token.getFrozenTokens(addr1.address), "4: tokens frozen").to.equal(40);

      await increaseTime(20); // 110

      await token.connect(addr1).transfer(owner.address, 50)

      expect(await token.balanceOf(addr1.address), "5: total tokens").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "5: tokens free").to.equal(80);
      expect(await token.getFrozenTokens(addr1.address), "5: tokens frozen").to.equal(20);

      await increaseTime(20); // 130

      expect(await token.balanceOf(addr1.address), "5: total tokens").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "5: tokens free").to.equal(100);
      expect(await token.getFrozenTokens(addr1.address), "5: tokens frozen").to.equal(0);

    });
  });


});


// ****************************************************************
