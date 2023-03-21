import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { Contract, ContractFactory } from "ethers";

chai.use(solidity);
const { expect } = chai;

describe("ERC20 Token Contract", () => {
  let owner: SignerWithAddress;
  let recipient: SignerWithAddress;
  let token: Contract;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let decimals: number;

  let convertToWei = (_value: number, _decimal: number) => {
    return ethers.utils.parseUnits(_value.toString(), _decimal);
  };

  // TODO: For ApproveAndCall check if we need new variable for contract and tokenOwner
  let receiver: Contract;
  let tokenOwner: SignerWithAddress;

  beforeEach(async () => {
    [owner, recipient, addr1, addr2] = await ethers.getSigners();
    const Token: ContractFactory = await ethers.getContractFactory(
      "LocalToken",
      owner
    );
    token = await Token.deploy("Local Token", "LT", 18, 100000000);
    decimals = await token.decimals();

    // const Receiver = await ethers.getContractFactory("TokenReceiverMock");
    // receiver = await Receiver.deploy();
  });

  describe("Deployment", () => {
    it("Should set the name, symbol, decimals and total supply of the token", async () => {
      expect(await token.name()).to.equal("Local Token");
      expect(await token.symbol()).to.equal("LT");
      expect(await token.decimals()).to.equal(18);
      expect(await token.totalSupply()).to.equal(100000000000000000000000000n);
    });

    it("Should assign the total supply of tokens to the owner", async () => {
      const ownerBalance = await token.balanceOf(owner.address); // * Owner balance: 100,000,000
      const totalSupply = await token.totalSupply();
      expect(ownerBalance).to.equal(totalSupply);
    });

    it("Should emit an event on deployment for transferring total supply to the owner", async () => {
      const [deployer] = await ethers.getSigners();

      const erc20TokenFactory = await ethers.getContractFactory("LocalToken");
      const erc20Token = await erc20TokenFactory.deploy(
        "LocalToken",
        "LT",
        18,
        100000000
      );
      await erc20Token.deployed();

      const transferEvent = await erc20Token.queryFilter(
        erc20Token.filters.Transfer(null, null),
        erc20Token.address
      );

      expect(transferEvent.length).to.equal(1);
      expect(transferEvent[0].args._from).to.equal(
        ethers.constants.AddressZero
      );
      expect(transferEvent[0].args._to).to.equal(deployer.address);
      expect(transferEvent[0].args._value).to.equal(
        convertToWei(100000000, decimals)
      );
    });
  });

  describe("Transfer", () => {
    it("Should fail if the account is frozen", async () => {
      // freeze the recipient's account
      await token.freeze(recipient.address);

      // transfer some tokens from the owner's account to the frozen recipient's account
      await expect(
        token.transfer(recipient.address, convertToWei(10, decimals))
      ).to.be.revertedWith("Account is frozen");

      // check if the recipient's balance is still 0
      const balance = await token.balanceOf(recipient.address);
      expect(balance).to.equal(0);
    });

    it("Should transfer tokens from sender to recipient", async () => {
      await token.transfer(recipient.address, convertToWei(50, decimals));
      const ownerBalance = await token.balanceOf(owner.address);
      let recipientBalance = await token.balanceOf(recipient.address);
      expect(recipientBalance).to.equal(convertToWei(50, decimals));
      expect(ownerBalance).to.equal(convertToWei(99999950, decimals)); // * Owner balance: 99999950

      await token
        .connect(recipient)
        .transfer(addr1.address, convertToWei(25, decimals));
      recipientBalance = await token.balanceOf(recipient.address);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(recipientBalance).to.equal(convertToWei(25, decimals)); // * Recipient balance: 25
      expect(addr1Balance).to.equal(convertToWei(25, decimals)); // * Addr1 balance: 25
    });

    it("Should fail if sender has insufficient balance", async () => {
      await expect(
        token
          .connect(recipient)
          .transfer(addr2.address, convertToWei(50, decimals))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("TransferFrom", () => {
    it("Should fail if the recipient account is freezed", async () => {
      await token.freeze(recipient.address);
      await expect(
        token.approve(recipient.address, convertToWei(50, decimals))
      ).to.be.revertedWith("Account is frozen");

      await token.approve(addr1.address, convertToWei(10, decimals));
      await token.freeze(addr1.address);
      await expect(
        token
          .connect(addr1)
          .transferFrom(
            owner.address,
            recipient.address,
            convertToWei(50, decimals)
          )
      ).to.be.revertedWith("Account is frozen");

      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(0);
    });

    it("Should transfer tokens from approved sender to recipient", async () => {
      await token.approve(recipient.address, convertToWei(50, decimals));
      await token
        .connect(recipient)
        .transferFrom(
          owner.address,
          recipient.address,
          convertToWei(50, decimals)
        );
      const ownerBalance = await token.balanceOf(owner.address);
      const recipientBalance = await token.balanceOf(recipient.address);
      expect(ownerBalance).to.equal(convertToWei(99999950, decimals)); // * Owner balance: 99999950
      expect(recipientBalance).to.equal(convertToWei(50, decimals)); // * Recipient balance: 50
    });

    it("Should fail if sender is not approved", async () => {
      await expect(
        token
          .connect(recipient)
          .transferFrom(
            owner.address,
            recipient.address,
            convertToWei(50, decimals)
          )
      ).to.be.revertedWith("Allowance exceeded");
    });

    it("Should fail if sender has insufficient balance", async () => {
      await token.approve(recipient.address, convertToWei(100000000, decimals));
      await expect(
        token
          .connect(recipient)
          .transferFrom(
            owner.address,
            recipient.address,
            convertToWei(200000000, decimals)
          )
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Approve", () => {
    it("Should approve an address to spend tokens", async () => {
      await token.approve(recipient.address, convertToWei(100, decimals));
      const allowance = await token.allowance(owner.address, recipient.address);
      expect(allowance).to.equal(convertToWei(100, decimals));
    });

    it("Should fail if approve value more than the balance", async () => {
      await token.transfer(recipient.address, convertToWei(50, decimals));
      await expect(
        token
          .connect(recipient)
          .approve(owner.address, convertToWei(60, decimals))
      ).to.be.revertedWith("Insufficient balance");
    });
  });

  describe("Allowance", () => {
    it("Should fail if the account is frozen", async () => {
      await token.freeze(recipient.address);
      await expect(
        token.approve(recipient.address, convertToWei(50, decimals))
      ).to.be.revertedWith("Account is frozen");

      const allowance = await token.allowance(owner.address, recipient.address);
      expect(allowance).to.equal(0);
    });

    it("Should return the allowance for a spender", async () => {
      await token.approve(addr1.address, convertToWei(50, decimals));
      const allowance = await token.allowance(owner.address, addr1.address);
      expect(allowance).to.equal(convertToWei(50, decimals));
    });
  });

  describe("Mint", () => {
    it("Should fail if the recipient account is frozen", async () => {
      await token.freeze(recipient.address);
      await expect(
        token.approve(recipient.address, convertToWei(50, decimals))
      ).to.be.revertedWith("Account is frozen");

      const allowance = await token.allowance(owner.address, recipient.address);
      expect(allowance).to.equal(0);

      it("Should increase the balance of the recipient by the amount", async () => {
        await token.mint(addr1.address, convertToWei(100, decimals));
        const balance = await token.balanceOf(addr1.address);
        expect(balance).to.equal(convertToWei(100, decimals));
      });

      it("Should fail if the caller is not the owner", async () => {
        await expect(
          token.connect(addr1).mint(addr2.address, convertToWei(100, decimals))
        ).to.be.revertedWith("Only contract owner can perform this action");
      });
    });
  });

  describe("Freeze", () => {
    it("Should prevent the target account from transferring tokens", async () => {
      await token.freeze(addr1.address);
      await token
        .transfer(addr2.address, convertToWei(100, decimals))
        .catch((err: { message: any }) => {
          expect(err.message).to.include("revert");
        });
    });

    it("Should fail if the caller is not the owner", async () => {
      await expect(
        token.connect(addr1).freeze(addr2.address)
      ).to.be.revertedWith("Only contract owner can perform this action");
    });
  });

  describe("Burn", () => {
    it("Should fail if the account is frozen", async function () {
      await token.transfer(recipient.address, convertToWei(100, decimals));
      await token.freeze(recipient.address);
      await expect(
        token
          .connect(recipient)
          .burn(convertToWei(100, decimals))
      ).to.be.revertedWith("Account is frozen");

      const balance = await token.balanceOf(recipient.address);
      expect(balance).to.equal(convertToWei(100, decimals));
    });

    it("Should decrease the balance of the owner by the amount", async () => {
      await token.transfer(addr1.address, convertToWei(100, decimals));
      await token.connect(addr1).burn(convertToWei(50, decimals));
      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(convertToWei(50, decimals));
    });
  });

  describe("BurnFrom", () => {
    it("Should fail if the sender account is frozen", async function () {
      await token.transfer(recipient.address, convertToWei(100, decimals));
      await token.connect(recipient).transfer(addr1.address, convertToWei(50, decimals));
      await token.connect(addr1).approve(recipient.address, convertToWei(25, decimals));
      await token.freeze(recipient.address);

      await expect(
        token
          .connect(recipient)
          .burnFrom(addr1.address, convertToWei(25, decimals))
      ).to.be.revertedWith("Account is frozen");

      const recipientBalance = await token.balanceOf(recipient.address);
      expect(recipientBalance).to.equal(convertToWei(50, decimals));
    });

    it("Should fail if the recipient account is frozen", async function () {
      await token.transfer(recipient.address, convertToWei(100, decimals));
      await token.connect(recipient).transfer(addr1.address, convertToWei(50, decimals));
      await token.connect(addr1).approve(recipient.address, convertToWei(25, decimals));
      await token.freeze(addr1.address);

      await expect(
        token
          .connect(recipient)
          .burnFrom(addr1.address, convertToWei(25, decimals))
      ).to.be.revertedWith("Account is frozen");

      const recipientBalance = await token.balanceOf(recipient.address);
      expect(recipientBalance).to.equal(convertToWei(50, decimals));
    });

    it("Should decrease the balance of the target account by the amount", async () => {
      await token.transfer(addr1.address, convertToWei(100, decimals));
      await token.connect(addr1).approve(addr2.address, convertToWei(50, decimals));
      await token
          .connect(addr2)
          .burnFrom(addr1.address, convertToWei(50, decimals));

      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(convertToWei(50, decimals));
    });
  });

  // INFO - This test needs another contract to test
  describe("ApproveAndCall", () => {
    // ! Complete these tests
    // it("should approve and call the receiver contract successfully", async () => {
    //   const amount = convertToWei(100, decimals);
    //   const data = "0x12345678";

    //   // Approve the receiver contract to transfer 100 tokens on behalf of the token owner
    //   await token
    //     .connect(tokenOwner)
    //     .approveAndCall(receiver.address, amount, data);

    //   // Check that the receiver contract has received the expected amount of tokens
    //   const balance = await token.balanceOf(receiver.address);
    //   expect(balance).to.equal(amount);

    //   // Check that the receiver contract has received the expected data
    //   const receivedData = await receiver.receivedData();
    //   expect(receivedData).to.equal(data);

    //   // Check that the token owner has the expected allowance for the receiver contract
    //   const allowance = await token.allowance(
    //     tokenOwner.address,
    //     receiver.address
    //   );
    //   expect(allowance).to.equal(amount);
    // });

    // it("should revert if the receiver contract does not implement the fallback function", async () => {
    //   const amount = ethers.utils.parseEther("100");
    //   const data = "0x12345678";

    //   const BadReceiver = await ethers.getContractFactory(
    //     "BadTokenReceiverMock"
    //   );
    //   const badReceiver = await BadReceiver.deploy();

    //   await expect(
    //     token
    //       .connect(tokenOwner)
    //       .approveAndCall(badReceiver.address, amount, data)
    //   ).to.be.revertedWith(
    //     "revert ERC20: approveAndCall recipient is not a contract or does not implement the receive function"
    //   );
    // });
  });
});
