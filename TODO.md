* Parameterize the RPC url, test against https://morden.infura.io:8545
* Document LibFund in README, then ping standard-contracts
* Auto-register LiveLibsUtils on deploy
* Switch all web3 calls to async so we can use testrpc more efficiently
* Script for updating newly-deployed live-lib contract with existing network data (useful for when the live-libs contract is updated)
* Script for updating morden live-libs contract with live network data
* PoC using serpent with live-libs
* Investigate pudding
* Explore whether live-libs testing needs to be incorporated
* Start backing up lib data in a repo, a place for contributors to put lib source, test source, documentation, as well as a convenient place for developers to grab registry data without having to run a full node
* Extract environment migration into its own repo? /via @tcoulter
