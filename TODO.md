* Query events by name rather than just grabbing everything and filtering manaully
* Switch all web3 calls to async so we can use testrpc more efficiently, and provide a more consistent JavaScript interface (investigate pudding)
* Currently the gas-costing methods require the account to be unlocked in geth, look into [this](https://github.com/ethereum/web3.js/issues/388#issuecomment-219227190) to allow people to auth via the script.
* Auto-register LiveLibsUtils on deploy
* Script for updating newly-deployed live-lib contract with existing network data (useful for when the live-libs contract is updated)
* Script for updating morden live-libs contract with live network data
* PoC using serpent with live-libs
* Explore whether live-libs testing needs to be incorporated
* Start backing up lib data in a repo, a place for contributors to put lib source, test source, documentation, as well as a convenient place for developers to grab registry data without having to run a full node
* Extract environment migration into its own repo? /via @tcoulter
