# Live Libs for Solidity

Providing reusable Solidity libraries that are live on the Ethereum blockchain.

## Install

    $ npm install -g live-libs

## Specifying your environment

You will need to specify your current Ethereum environment (testrpc, morden, or live) when interacting with live-libs. On the command line, this is provided via `-e` or `--env`. Via Javascript, it is passed into the `new LiveLibs(web3, env)` constructor.

The environment that you provide must match the environment of the [Ethereum node](https://ethereum.gitbooks.io/frontier-guide/content/getting_a_client.html) that is running on your computer. The live-libs command line interface currently assumes that the Ethereum node's RPC interface is available via `localhost:8545`.

## Setting up your testrpc environment

Running your tests against [testrpc](https://github.com/ethereumjs/testrpc) is a standard way to speed up your development process. In order to execute the live-libs libraries on your testrpc node, you'll need to deploy the live-libs contract(s) and import the live-libs data. This will require a two-step process:

1. Download the live-libs data from morden (you will need to run a node that connects to that network).
2. Deploy the live-libs contract(s) and data to testrpc.

From the command line:

    $ # running a morden node
    $ live-libs download --env morden
    $ # switch to testrpc
    $ live-libs deploy --env testrpc

__Note__: If you restart your testrpc server, you'll need to re-deploy live-libs, but you won't need to re-download the data.

## Getting a library's information

It's important to note that live-libs does not store source code, but it does store a library's [ABI](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI). In order to compile contracts that use live-libs, you'll need to provide the [library interface](https://github.com/ethereum/wiki/wiki/Solidity-Features#interface-contracts) to the compiler.

From the command line:

    $ live-libs get LibName --env testrpc # or morden or live
    Address:
    0x3f4845...
    ABI:
    [{"constant":false,"inputs":...}]
    Abstract source:
    library LibName {...}

Via Javascript:

    var web3 = ... // setup web3 object
    var env = "testrpc"; // or "morden" or "live"

    var LiveLibs = require('live-libs');
    var liveLibs = new LiveLibs(web3, env);
    var libName = "Foo";
    var libInfo = liveLibs.get(libName);
    console.log(libInfo.address);
    console.log(libInfo.abi);
    console.log(libInfo.abstractSource());

## How to register a live library

From the command line:

    $ live-libs register YourLibName --address 0x45e2... --abi '[...]' --env testrpc # or morden or live

__Warning:__ There is (currently) no way to update or remove your library. Once it's live it's live forever.

__Warning:__ This software is under active development and the live-libs registries (morden and live) will be replaced without warning. (Other than this warning.)

## TODO

* Need to move files used for local data into a more standard location (`~/.live-libs`)
* Test whether libraries can `selfdestruct`
* Script for updating newly-deployed live-lib contract with existing network data (useful for when the live-lib contract is updated)
* Script for updating morden live-lib contract with live network data
* Investigate pudding
* Extract environment migrator into its own repo /via @tcoulter
* Consider the tradeoffs of allowing for library upgrades, or whether we should have versions (or both)

## Author

Dave Hoover <dave.hoover@consensys.net>
