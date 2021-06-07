<p align="center">
  <a href="https://coralreef.art">
    <img alt="Coral Reef" src="https://coralreef.art/meta.svg" width="250" />
  </a>
</p>

Coral Reef is a protocol built on top of Solana that allows:

- **Creating/Minting** non-fungible tokens;
- **Starting** a variety of auctions for primary/secondary sales;
- and **Visualizing** NFTs in a standard way across wallets and applications.

Coral Reef is comprised of two core components: an on-chain program, and a self-hosted front-end web2 application.

## Installing

Clone the repo, and run `deploy-web.sh`.

```bash
$ git clone https://github.com/kornatisOiga/coralreef.git
$ cd coralreef
$ cd js
$ ./deploy-web.sh
```

## Rust Programs

The Rust programs will soon be added to this repo with JavaScript
bindings that allow interactivity.

# Protocol

## Non-fungible tokens

Coral Reef's non-fungible-token standard is a part of the Solana Program Library (SPL), and can be characterized as a unique token with a fixed supply of 1 and 0 decimals. We extended the basic definition of an NFT on Solana to include additional metadata such as URI as defined in ERC-721 on Ethereum.

Below are the types of NFTs that can be created using the Coral Reef protocol.

### Normal NFT

A normal NFT when minted represents a non-fungible token on Solana and metadata, but lacks rights to print.

An example of a normal NFT would be an artwork that is a one-of-a-kind that, once sold, is no longer within the artist's own wallet, but is in the purchaser's wallet.

## Fractionalize NFT

A creator who has minted an NFT may decide to use the option to fractionalize the ownership of his work to obtain liquidity, this fractionalization will represent a percentage of the ownership and not a specific part of the NFT.

By choosing the fractionation option the creator will be able to choose a number of tokens in which the property will be fractionalized, the value that has been set for the NFT at the time of creation will be divided into the number of tokens that have been set to distribute the property, from the 100% of tokens created the creator must choose a range between 0-100% of the tokens to be sent to the exchange (Serum), which can be freely exchanged in the market before, during and after the auction.
