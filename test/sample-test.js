const { expect } = require("chai");
const { ethers } = require("hardhat");




const name = "Token";
const symbol = "TKN";
const initialSupply = 1000;


describe("Token Testing", function () {
  console.log("start testing")
  let Token, token, owner, addr1, addr2

  before(async () => {
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
      await token.transfer(addr1.address, 100);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply - 100);
      expect(await token.getFreeTokens(owner.address)).to.equal(initialSupply - 100);
      const bal = await token.getFrozenTokens(owner.address)
      console.log({
        bal: bal.toString()
      })
      expect(await token.getFrozenTokens(owner.address)).to.equal(0);


      expect(await token.balanceOf(addr1.address)).to.equal(100);
      expect(await token.getFreeTokens(addr1.address)).to.equal(100);
      expect(await token.getVestingCount(addr1.address)).to.equal(0);
      expect(await token.getFrozenTokens(addr1.address)).to.equal(0);

    })

    it("Should allow owner to send frozen Tokens", async () => {
      await token.sendFrozen(addr1.address, 50, 20, 10);
      expect(await token.balanceOf(owner.address)).to.equal(initialSupply - 150);
      expect(await token.getFreeTokens(owner.address)).to.equal(initialSupply - 150);

      expect(await token.balanceOf(addr1.address)).to.equal(150);
      expect(await token.getFreeTokens(addr1.address)).to.equal(100);
      expect(await token.getVestingCount(addr1.address)).to.equal(1);
      expect(await token.getFrozenTokens(addr1.address)).to.equal(50);
    })

    it("Should Restrict others from sending frozen Tokens", async()=>{
      await expect(token.connect(addr1).sendFrozen(addr2.address,50,20,10)).to.be.revertedWith("Ownable: caller is not the owner");

    })
  });


});
