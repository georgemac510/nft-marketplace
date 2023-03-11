import { expect } from "chai";
import exp from "constants";
import { Contract } from "ethers";
import { ethers } from "hardhat";


describe("NFTMarket", () => {
  let nftMarket: Contract;
  let signers: SignerWithAddress[];

  before(async () => {
    // Deply the NFTMarket contract
    const NFTMarket = await ethers.getContractFactory('NFTMarket');
    nftMarket = await NFTMarket.deploy();
    await nftMarket.deployed();
    signers = await ethers.getSigners();
  });

  const createNFT = async (tokenURI: string) => {
    const transaction = await nftMarket.createNFT(tokenURI);
    const receipt = await transaction.wait();
    const tokenID = receipt.events[0].args.tokenId;
    return tokenID;
  }

  const createAndListNFT = async (price: number) => {
    const tokenID = await createNFT('some token uri');
    const transaction = await nftMarket.listNFT(tokenID, price);
    await transaction.wait();
    return tokenID;
  }

  describe("createNFT", () => {
    it("should create an NFT with the correct owner and tokenURI", async () => {
      
      // Call the createNFT function
      const tokenURI = "https://my-token.uri/";
      const transaction = await nftMarket.createNFT(tokenURI);
      const receipt = await transaction.wait(); 
      const tokenID = receipt.events[0].args.tokenId;
      // console.log(transaction);
      
      // console.log(receipt);
  
      // Assert that the newly created NFT's token URI is the same as the one sent to createNFT
      
      const mintedTokenURI = await nftMarket.tokenURI(tokenID);
      expect(mintedTokenURI).to.equal(tokenURI);
  
      // Assert that owner address is the same as the address that started the transaction
      const ownerAddress = await nftMarket.ownerOf(tokenID);
      const signers = await ethers.getSigners();
      const currentAddress = await signers[0].getAddress();
      expect(ownerAddress).to.equal(currentAddress);
      // Assert that NFTTransfer has the correct args
      const args = receipt.events[1].args;
      expect(args.tokenID).to.equal(tokenID);
      expect(args.from).to.equal(ethers.constants.AddressZero);
      expect(args.to).to.equal(ownerAddress);
      expect(args.tokenURI).to.equal(tokenURI);
      expect(args.price).to.equal(0);
    });
  });

  describe("listNFT", () => {
    it("should revert if price is zero", async () => {
      const tokenURI = "https://my-token.uri/";
      const tokenID = await createNFT(tokenURI);
      const transaction = nftMarket.listNFT(tokenID, 0);
      await expect(transaction).to.be.revertedWith('NFTMarket: price must be greater than 0');
    });

    it("should revert if not called by owner", async () => {
      const tokenURI = "https://my-token.uri/";
      const tokenID = await createNFT(tokenURI);
      const transaction = nftMarket.connect(signers[1]).listNFT(tokenID, 12);
      await expect(transaction).to.be.revertedWith('ERC721: approve caller is not token owner or approved for all');
    });

    it("should list the token for sale if all requirements are met", async () => {
      const price = 123;
      const tokenURI = "https://my-token.uri/";
      const tokenID = await createNFT(tokenURI);
      const transaction = await nftMarket.listNFT(tokenID, price);
      const receipt = await transaction.wait();
      // Ownership should be transferred to the contract
      const ownerAddress = await nftMarket.ownerOf(tokenID);
      expect(ownerAddress).to.equal(nftMarket.address);

      const args = receipt.events[2].args;
      expect(args.tokenID).to.equal(tokenID);
      expect(args.from).to.equal(signers[0].address);
      expect(args.to).to.equal(nftMarket.address);
      expect(args.tokenURI).to.equal("");
      expect(args.price).to.equal(price);
    });
  });

  describe("buyNFT", () => {
    it("should revert id NFT is not listed for sale", async () =>{
      const transaction = nftMarket.buyNFT(9999);
      await expect(transaction).to.be.revertedWith("NFTMarket: nft not listed for sale");
    });
    it("should revert if the amount of wei is not equal to the NFT price",async () => {
      const tokenID = await createAndListNFT(123);
      const transaction = nftMarket.buyNFT(tokenID, {value: 124});
      await expect(transaction).to.be.revertedWith("NFTMarket: incorrect price");
    });
    it("should transfer ownership to the buyer and send the price to the seller",async () => {
      const price = 123;
      const sellerProfit = Math.floor(price * 95 /100);
      const fee = price - sellerProfit;
      const initialContractBalance = await nftMarket.provider.getBalance(nftMarket.address);
      const tokenID = await createAndListNFT(price);
      await new Promise(r => setTimeout(r, 100));
      const oldSellerBalance = await signers[0].getBalance();
      const transaction = await nftMarket.connect(signers[1]).buyNFT(tokenID, {value: price});
      const receipt = await transaction.wait();
      // 95% to seller 
      await new Promise(r => setTimeout(r, 100));
      const newSellerBalance = await signers[0].getBalance();
      const diff = newSellerBalance.sub(oldSellerBalance);
      expect(diff).to.equal(sellerProfit);
      // 5% to contract
       // 5% of the price was kept in the contract balance
      const newContractBalance = await nftMarket.provider.getBalance(
        nftMarket.address
      );
      const contractBalanceDiff = newContractBalance.sub(
        initialContractBalance
      );
      expect(contractBalanceDiff).to.equal(fee);
      // NFT transferred to buyer
      const ownerAddress = await nftMarket.ownerOf(tokenID);
      expect(ownerAddress).to.equal(signers[1].address);
      // NFTTransfer event has the correct args
      const args = receipt.events[1].args;
      expect(args.tokenID).to.equal(tokenID);
      expect(args.from).to.equal(nftMarket.address);
      expect(args.to).to.equal(signers[1].address);
      expect(args.tokenURI).to.equal("");
      expect(args.price).to.equal(0);
    });
  });

  describe("cancelListing", () => {
    it("should revert if the NFT is not listed for sale", async () => {
      const transaction = nftMarket.cancelListing(9999);
      await expect(transaction).to.be.revertedWith("NFTMarket: nft not listed for sale");
    });

    it("should revert if the seller is not the seller of the listing", async () => {
      const tokenID = await createAndListNFT(123);
      const transaction = nftMarket.connect(signers[1]).cancelListing(tokenID);
      await expect(transaction).to.be.revertedWith("NFTMarket: you are not the owner");
    });

    it("should transfer the ownership back to the seller if all requirements are not met", async () => {
      const tokenID = await createAndListNFT(123);
      const transaction = await nftMarket.cancelListing(tokenID);
      const receipt = await transaction.wait();
      const ownerAddress = await nftMarket.ownerOf(tokenID);
      expect(ownerAddress).to.equal(signers[0].address);
      // Check NFTTransfer event
      const args = receipt.events[1].args;
      expect(args.tokenID).to.equal(tokenID);
      expect(args.from).to.equal(nftMarket.address);
      expect(args.to).to.equal(signers[0].address);
      expect(args.tokenURI).to.equal("");
      expect(args.price).to.equal(0);
    });
  });

  describe("withdrawFunds", () => {
    it("should revert if called by a signer other than the owner", async () => {
      const transaction = nftMarket.connect(signers[1]).withdrawFunds();
      await expect(transaction).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should transfer contract balance to owner", async () => {
      const contractBalance = await nftMarket.provider.getBalance(nftMarket.address);
      // console.log("Balance: ", contractBalance);
      const initialOwnerBalance = await signers[0].getBalance();
      const transaction = await nftMarket.withdrawFunds();
      const receipt = await transaction.wait();
      await new Promise(r => setTimeout(r, 100));
      const newOwnerBalance = await signers[0].getBalance();
      // console.log(receipt);
      const gas = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      const transferred = newOwnerBalance.add(gas).sub(initialOwnerBalance);
      expect(transferred).to.equal(contractBalance);
    });

    it("should revert if contract balance is zero", async () => {
      const transaction = nftMarket.withdrawFunds();
      await expect(transaction).to.be.revertedWith("NFTMarket: balance is zero");
    });
  });
});


