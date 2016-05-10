* Implement lib versioning
* Implement lib testing
* We may be able to replace all the env passing if we can come up with a good auto-detect environment method (just try the stored addresses, otherwise assume testrpc) /ht @karlfloersch
* Switch all web3 calls to async so we can use testrpc more efficiently
* Script for updating newly-deployed live-lib contract with existing network data (useful for when the live-lib contract is updated)
* Script for updating morden live-lib contract with live network data
* Start backing up lib data in a repo, a place for contributors to put lib source, test source, documentation, as well as a convenient place for developers to grab registry data without having to run a full node
* Investigate pudding
* Extract environment migration into its own repo /via @tcoulter
