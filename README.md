# Live Libs for Solidity

Providing resusable Solidity libraries that are live on the Ethereum blockchain.

__Warning__: The documentation below is a *proposed* interface to live-libs. The author using this documentation to solicit feedback.

## Install

    $ npm install -g live-libs

## Specifying your environment

You will need to provide your current Ethereum environment (testrpc, morden, or live) when interacting with live-libs. On the command line, this is provided via `-e` or `--env`. Via Javascript, it is passed in as the last (non-callback) argument to most methods.

The environment that you provide must match the environment of the [Ethereum node](https://ethereum.gitbooks.io/frontier-guide/content/getting_a_client.html) that is running on your computer. The live-libs command line interface currently assumes that the Ethereum node's RPC interface is available via `localhost:8545`.

## Setting up your testrpc environment

Running your tests against [testrpc](https://github.com/ethereumjs/testrpc) is a standard way to speed up your development process. In order to execute the live-lib libraries on your testrpc node, you'll need to deploy the live-lib contract(s) and import the live-lib data. This will require a two-step process:

1. Download the live-libs data from morden (you will need to run a node that connects to that network).
2. Deploy the live-libs contract(s) and data to testrpc.

From the command line:

    $ # running a morden node
    $ live-libs download --env morden
    $ # switch to testrpc
    $ live-libs deploy --env testrpc

__Note__: If you need to restart your testrpc server, you'll need to re-deploy live-libs, but you won't need to re-download the data.

## Getting a library's raw data

From the command line:

    $ live-libs get LibName --env testrpc # or morden or live

Via Javascript:

    var web3 = ... // setup web3 object

    var LiveLibs = require('live-libs');
    var liveLibs = new LiveLibs(web3);
    var libName = "Foo";
    var env = "testrpc"; // or "morden" or "live"
    var libData = liveLibs.get(libName, env);
    console.log(libData.abi);
    console.log(libData.address);

## Generating a library's interface

It's important to note that live-libs does not store source code, but it does store a library's [ABI](https://github.com/ethereum/wiki/wiki/Ethereum-Contract-ABI). In order to compile contracts that use live-libs, you'll need to provide the [library interface](https://github.com/ethereum/wiki/wiki/Solidity-Features#interface-contracts) to the compiler.

From the command line:

    $ live-libs gen LibName --env testrpc

Via Javascript:

    var source = liveLibs.gen(libName, env);

## How to register a live library

From the command line:

    $ live-libs register YourLibName --abi '[...]' --address 0x45e2... --env testnet # or morden or live

__Warning:__ There is (currently) no way to update or remove your library. Once it's live it's live forever.

__Warning:__ This software is under active development and the live-libs registries (morden and live) will be replaced without warning. (Other than this warning.)

## TODO

* Store `msg.sender` when lib is registered
* Consider shelling out to `solc` on the command line, generate the abstract libs on the file system, providing the path like [this](https://solidity.readthedocs.io/en/latest/layout-of-source-files.html#use-in-actual-compilers).
* Experiment with truffle integration
* Experiment with dapple integration
* Extract environment migrator into its own repo /via @tcoulter
* Consider the tradeoffs of allowing for library upgrades, or whether we should have versions (or both)

## Author

Dave Hoover <dave.hoover@consensys.net>
