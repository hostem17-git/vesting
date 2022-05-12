const { expect } = require("chai");
const { ethers } = require("hardhat");




const name = "Token";
const symbol = "TKN";
const initialSupply = 1000;


describe("Token Testing", function () {
  console.log("start testing")
  let Token, token, owner, addr1, addr2

  beforeEach(async () => {
    Token = await ethers.getContractFactory("Token");
    token = await Token.deploy(name, symbol, initialSupply);
    await token.deployed();
    [owner, addr1, addr2, _] = await ethers.getSigners();
  })


  describe("Base setup", async () => {
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

      //  await console.log("Owner-------->", await token.owner());
      console.log(await token.getFreeTokens(owner.address));

      await token.transfer(addr1.address, 100);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply - 100);
      expect(await token.getFreeTokens(owner.address)).to.equal(initialSupply - 100);

      expect(await token.balanceOf(addr1.address)).to.equal(100);
      expect(await token.getFreeTokens(addr1.address)).to.equal(100);
      expect(await token.getVestingCount(addr1.address)).to.equal(0);
    })

  });


});
