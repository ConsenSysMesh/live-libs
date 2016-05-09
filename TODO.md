* Implement lib versioning
* Implement lib testing
* Switch all web3 calls to async so we can use testrpc more efficiently
* Script for updating newly-deployed live-lib contract with existing network data (useful for when the live-lib contract is updated)
* Script for updating morden live-lib contract with live network data
* `web3.versions.getNetwork()` may be able to replace all the env passing (this errors with `net_version method not implemented` on geth, need to investigate)
* Investigate pudding
* Extract environment migration into its own repo /via @tcoulter
