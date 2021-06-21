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
$ yarn install
$ ./deploy-web.sh
```

## Rust Programs

The Rust programs will soon be added to this repo with JavaScript
bindings that allow interactivity.

# Protocol

## Non-fungible tokens

Coral Reef's non-fungible-token standard is a part of the Solana Program Library (SPL), and can be characterized as a unique token with a fixed supply of 1 and 0 decimals. We extended the basic definition of an NFT on Solana to include additional metadata such as URI as defined in ERC-721 on Ethereum.

Below are the types of NFTs that can be created using the Coral Reef protocol.

### **Master Edition**

A master edition token, when minted, represents both a non-fungible token on Solana and metadata that allows creators to control the provenance of prints created from the master edition.

Rights to create prints are tokenized itself, and the owner of the master edition can distribute tokens that allow users to create prints from master editions. Additionally, the creator can set the max supply of the master edition just like a regular mint on Solana, with the main difference being that each print is a numbered edition created from it.

A notable and desirable effect of master editions is that as prints are sold, the artwork will still remain visible in the artist's wallet as a master edition, while the prints appear in the purchaser's wallets.

### **Print**

A **print** represents a copy of an NFT, and is created from a Master Edition. Each print has an edition number associated with it.

Usually, prints are created as a part of an auction that has happened on Coral Reef, but they could also be created by the creator manually.

For limited auctions, each print number is awarded based on the bid placement.

Prints can be created during [Open Edition](#open-edition) or [Limited Edition](#limited-edition) auction.

### Normal NFT

A normal NFT (like a Master Edition) when minted represents a non-fungible token on Solana and metadata, but lacks rights to print.

An example of a normal NFT would be an artwork that is a one-of-a-kind that, once sold, is no longer within the artist's own wallet, but is in the purchaser's wallet.

## Types of Auctions

Coral Reef currently supports four types of auctions that are all derived from English auctions.

Basic parameters include:

- Auction start time
- Auction end time
- Reservation price

Additionally, Coral Reef includes a novel concept of the participation NFT. Each bidding participant can be rewarded a unique NFT for participating in the auction.

The creator of an auction also has the ability to configure a minimal price that should be charged for redemption, with the option to set it as "free".

### Single Item

This type of auction can be used to sell normal NFTs and re-sell Prints, as well as the sale of Master Edition themselves (and the associated printing rights) if the artist so wishes. While this last behavior is not exposed in the current UI, it does exist in the protocol.

### Open Edition

An open edition auction requires the offering of a Master Edition NFT that specifically has no set supply. The auction will only create Prints of this item for bidders: each bidder is guaranteed to get a print, as there are no true "winners" of this auction type.

An open edition auction can either have a set fixed price (equivalent to a Buy Now sale), can be set to the bid price (Pay what you want), or can be free (Make any bid to get it for free).

### Limited Edition

For a limited edition auction, a Master Edition NFT (of limited or unlimited supply) may be provided to the auction with a number of copies as the set amount of winning places.

For each prize place, a Print will be minted in order of prize place, and awarded to the winning bidder of that place.

For example, the first place winner will win Print #1; the second place winner Print #2; and so on.

It is required for limited supply NFTs that there is at least as much supply remaining as there are desired winners in the auction.

### Tiered Auction

A tiered auction can contain a mix of the other three auction types as winning placements. For instance, the first place winner could win a Print of Limited Edition NFT A, while the second-place winner could win Normal NFT, and so on. Additionally, all participants who did not win any place could get a Participation NFT Print from a Master Edition (if the Master Edition had no supply limit).

## Royalties

Coral Reef can seamlessly create on-chain artist splits that remove the awkwardness out of collaboration.

Tag each collaborator, set custom percentages, and you’re off to the races. Each NFT can also be minted with configurable royalty payments that are then sent automatically back to the original creators whenever an artwork is resold on a Coral Reef marketplace in the future.

## Fractionalize NFT

A creator who has minted an NFT may decide to use the option to fractionalize the ownership of his work to obtain liquidity, this fractionalization will represent a percentage of the ownership and not a specific part of the NFT.

By choosing the fractionation option the creator will be able to choose a number of tokens in which the property will be fractionalized, the value that has been set for the NFT at the time of creation will be divided into the number of tokens that have been set to distribute the property, from the 100% of tokens created the creator must choose a range between 0-100% of the tokens to be sent to the exchange (Serum), which can be freely exchanged in the market before, during and after the auction.
