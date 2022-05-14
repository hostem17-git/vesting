const { expect } = require("chai");
const { ethers } = require("hardhat");




const name = "Token";
const symbol = "TKN";
const initialSupply = 1000;


describe("Token Testing", function () {
  console.log("start testing")
  let Token, token, owner, addr1, addr2;

  const increaseTime = async (days) => {
    await ethers.provider.send('evm_increaseTime', [days * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine');
  };

  const setBlockTime = async (time) => {
    await ethers.provider.send('evm_setNextBlockTimestamp', [days * 24 * 60 * 60]);
    await ethers.provider.send('evm_mine');
  }

  const currentTime = async () => {
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    return block.timestamp;
  }

  const advanceBlock = () => new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      id: new Date().getTime(),
    }, async (err, result) => {
      if (err) { return reject(err) }
      // const newBlockhash =await web3.eth.getBlock('latest').hash
      return resolve()
    })
  })
  const advancetime = (time) => new Promise((resolve, reject) => {
    web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      id: new Date().getTime(),
      params: [time],
    }, async (err, result) => {
      if (err) { return reject(err) }
      const newBlockhash = (await web3.eth.getBlock('latest')).hash

      return resolve(newBlockhash)
    })
  })





  beforeEach(async () => {
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy(name, symbol, initialSupply);
    await token.deployed();
    [owner, addr1, addr2, _] = await ethers.getSigners();
  })


  // describe("Base setup", async () => {
  //   it('Should set the right name', async () => {
  //     expect(await token.name()).to.equal(name);
  //   });

  //   it("Should set right symbol", async () => {
  //     expect(await token.symbol()).to.equal(symbol);
  //   });

  //   it("Should set right owner balance", async () => {
  //     expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
  //   });

  //   it("Should set right decimals", async () => {
  //     expect(await token.decimals()).to.equal(18);
  //   })

  //   it("Should set the right owner", async () => {
  //     expect(await token.owner()).to.equal(owner.address);
  //   })
  //   it("Should set right Owner free tokens", async () => {
  //     expect(await token.getFreeTokens(owner.address)).to.equal(initialSupply);
  //   })
  // });



  describe("Owner Transfers", async () => {

    // it("Should allow owner to send free tokens", async () => {

    //   // await token.setStartDate()

    //   await token.transfer(addr1.address, 100);
    //   expect(await token.balanceOf(owner.address)).to.equal(initialSupply - 100);
    //   expect(await token.getFreeTokens(owner.address)).to.equal(initialSupply - 100);
    //   expect(await token.getFrozenTokens(owner.address)).to.equal(0);


    //   expect(await token.balanceOf(addr1.address)).to.equal(100);
    //   expect(await token.getFreeTokens(addr1.address)).to.equal(100);
    //   expect(await token.getVestingCount(addr1.address)).to.equal(0);
    //   expect(await token.getFrozenTokens(addr1.address)).to.equal(0);

    // })


    // it("Should allow owner to send frozen Tokens", async () => {

    //   await expect(token.sendFrozen(addr1.address, 50, 20, 10)).to.be.revertedWith("Vesting not yet started");
    //   expect(await token.balanceOf(addr1.address)).to.equal(0);
    //   expect(await token.balanceOf(owner.address)).to.equal(initialSupply);

    //   const timeNow = await currentTime();
    //   await token.setStartDate(timeNow + 10 * 24 * 60 * 60);
    //   //Setting vesting startdate;

    //   await token.sendFrozen(addr1.address, 50, 20, 10);
    //   expect(await token.balanceOf(owner.address)).to.equal(initialSupply - 50);
    //   expect(await token.getFreeTokens(owner.address)).to.equal(initialSupply - 50);

    //   expect(await token.balanceOf(addr1.address)).to.equal(50);
    //   expect(await token.getFreeTokens(addr1.address)).to.equal(0);
    //   expect(await token.getVestingCount(addr1.address)).to.equal(1);
    //   expect(await token.getFrozenTokens(addr1.address)).to.equal(50);
    // })

    // it("Should Restrict others from sending frozen Tokens", async () => {
    //   await expect(token.connect(addr1).sendFrozen(addr2.address, 50, 20, 10)).to.be.revertedWith("Ownable: caller is not the owner");
    // });

    it("Manual Vesting Scenario #1 - no user transactions", async () => {
      const timeNow = await currentTime();
      const startTime = timeNow + 50 * 24 * 60 * 60;


      await token.setStartDate(startTime);
      await token.sendFrozen(addr1.address, 100, 20, 10);

      // let vestingDets = await token.getVestingDetails(addr1.address, 0);

      // console.log({
      //   "data": vestingDets.toString()
      // })


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



    // return;
    it("Manual Vesting Scenario #2 - transactions in betweeen vesting", async () => {

      const timeNow = await currentTime();
      const startTime = timeNow + 10 * 24 * 60 * 60;

      // console.log("Time Now", timeNow);
      // console.log("Start Time", startTime)


      await token.setStartDate(startTime);

      await token.sendFrozen(addr1.address, 100, 20, 10);

      let vestingDets = await token.getVestingDetails(addr1.address, 0);

      // console.log({
      //   "data": vestingDets.toString()
      // })

      expect(await token.balanceOf(addr1.address), "token transfer").to.equal(100);
      expect(await token.getFreeTokens(addr1.address), "tokens should be frozen").to.equal(0);
      expect(await token.getFrozenTokens(addr1.address), "tokens should be frozen").to.equal(100);



      await increaseTime(35);
      balance = await token.balanceOf(addr1.address);
      free = await token.getFreeTokens(addr1.address);
      frozen = await token.getFrozenTokens(addr1.address);

      await token.connect(addr1).transfer(addr2.address, 20);


      await increaseTime(30);

      // vestingDets = await token.getVestingDetails(addr1.address, 0);

      // console.log({
      //   "data": vestingDets.toString()
      // })

      console.log(await currentTime());

      expect(await token.balanceOf(addr1.address), "token transfer").to.equal(80);
      expect(await token.getFreeTokens(addr1.address), "tokens should be free").to.equal(10);
      expect(await token.getFrozenTokens(addr1.address), "tokens should be frozen").to.equal(70);



      await increaseTime(30);


      // let tim = await currentTime();
      // console.log("current Time", tim);

      expect(await token.balanceOf(addr1.address), "token transfer").to.equal(80);
      expect(await token.getFreeTokens(addr1.address), "tokens should be free").to.equal(20);
      expect(await token.getFrozenTokens(addr1.address), "tokens should be frozen").to.equal(60);



      await increaseTime(30);


      // tim = await currentTime();
      // console.log("current Time", tim);

      expect(await token.balanceOf(addr1.address), "1st vesting :token transfer").to.equal(80);
      expect(await token.getFreeTokens(addr1.address), "1st vesting :tokens should be free").to.equal(30);
      expect(await token.getFrozenTokens(addr1.address), "1st vesting :tokens should be frozen").to.equal(50);





      // tim = await currentTime();
      // console.log("current Time", tim);
      // console.log("Nest Vesting",tim + 30 *24*60*60);

      await token.connect(addr1).transfer(addr2.address, 20);


      vestingDets = await token.getVestingDetails(addr1.address, 0);

      console.log({
        "data": vestingDets.toString()
      });


      await increaseTime(60);



      expect(await token.balanceOf(addr1.address), "2nd vesting :token transfer").to.equal(60);
      expect(await token.getFreeTokens(addr1.address), "2nd vesting :tokens should be free").to.equal(30);
      expect(await token.getFrozenTokens(addr1.address), "2nd vesting :tokens should be frozen").to.equal(30);


      await increaseTime(90);


      tim = await currentTime();
      console.log("current Time", tim);

      expect(await token.balanceOf(addr1.address), "4th vesting :token transfer").to.equal(60);
      expect(await token.getFreeTokens(addr1.address), "4th vesting :tokens should be free").to.equal(60);
      expect(await token.getFrozenTokens(addr1.address), "4th vesting :tokens should be frozen").to.equal(00);

      console.log("######################################################################################################");

      tim = await currentTime();
      console.log("current Time", tim);


      vestingDets = await token.getVestingDetails(addr1.address, 0);

      console.log({
        "data": vestingDets.toString()
      });


      await token.connect(addr1).transfer(addr2.address, 10);
      // Vesting Over



      tim = await currentTime();
      console.log("current Time", tim);


      vestingDets = await token.getVestingDetails(addr1.address, 0);

      console.log({
        "data": vestingDets.toString()
      });





    })



  });

  describe("Manual Vesting Test", async () => {

  });


});


// ****************************************************************
