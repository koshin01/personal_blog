---
title: "Soulbound Token をコーディング"
description: "概念の理解から、コーディング、デプロイまで行います。"
image: "/coding_sbt.jpg"
pubDate: "Aug 15 2023"
heroImage: "/codingSBT.png"
---

## Soulbound Token とは
Soulbound Token、SBT はNFT の一種です、

NFT が所有権の証明するのに対し、SBT は所有者の属性を証明します。

2022年5月には、<mark>ヴィタリック・ブテリンが共著者の[論文](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4105763)が公開されるなど、期待されているアイデアの一つです。</mark>

## はじめる
今回は、SBT のユースケースとして、「入館証」が挙げられるので「入館証SBT」としてデザインしたものを、Hardhat を使ってコーディングしていきます。[^1]

[^1]: [完成したコードのGitHub リポジトリ](https://github.com/koshin01/coding_sbt)を用意しました。

まず、Hardhat をプロジェクトにインストールします。(今回はTypeScript を選択)
```shell
npm i --save-dev hardhat && npx hardhat
```

## コントラクト
さっそくSBT を定義するため、Solidity でコントラクトをコーディングしていきます。

車輪の再発明を防ぐため、下記のライブラリをインストールします。
```shell
npm i --save-dev @openzeppelin/contracts
```
SBT を定義するために、contracts 配下にEntryPass.sol をコーディングします。
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SBT を定義する
 * @author <あなたの名前>
 * @notice ABC Building の入館証
 */
contract EntryPass is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    /**
     * @dev SBT のコレクションに名前とシンボルをコントラクトデプロイ時にセットする
     */
    constructor() ERC721("ABC entry pass", "ABCPS") {}

    /**
     * 対象者に入館証を送信する
     * 必須条件: 関数実行者がコントラクト作成者と一致
     * @param recipient 受け取り者のアドレス
     * @param uri SBT のURI
     */
    function award(address recipient, string memory uri) public onlyOwner {
        _tokenIds.increment();

        _safeMint(recipient, _tokenIds.current());
        _setTokenURI(_tokenIds.current(), uri);
    }

    /**
     * トークンを譲渡不可能に設定する
     * @dev {ERC721-_beforeTokenTransfer} を見て
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0), "This token is SBT");

        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }
}

```

## デプロイスクリプト
次にブロックチェーンにデプロイ方法を定義するために、scripts 配下にdeploy.ts をコーディングします。
```typescript
import { ethers } from "hardhat";

async function main() {

  const entryPass = await ethers.deployContract("EntryPass");

  await entryPass.waitForDeployment();

  console.log("Deployed contract address : ", entryPass.target);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```
### ローカルブロックチェーンにデプロイ
いきなりパブリックなブロックチェーンにデプロイするのはガス代がかかるので、ローカルにブロックチェーンを作成してからデプロイできるか確かめます。
```shell
# ローカルにブロックチェーンを作成
npx hardhat node
# デプロイしてみる(新しいターミナルで実行)
npx hardhat run scripts/deploy.ts
```
Deployed contract address : <コントラクトアドレス> が返ってきたら成功です👍

このコントラクトアドレスは、このプロジェクトに必要なので環境変数に追加しときます。
```shell
echo "CONTRACT_ADDRESS=<コントラクトアドレス>" >> .env
```
## アワードスクリプト
<mark>さきほどのデプロイスクリプトは、SBT の定義をデプロイしただけでSBT 自体はまだ存在していません。</mark><br />
指定のアドレスに生成したSBT を送信するため、scripts 配下にaward.ts をコーディングします。(今回はオーナーに送信します)

まず、環境変数を使用するので下記ライブラリをインストールします。
```shell
npm i --save-dev dotenv
```

```typescript
import fs from "fs";
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {

    const contractAddress = getContractAddress();

    const abi = await getAbi();

    const [owner] = await ethers.getSigners();

    const entryPassContract = await new ethers.Contract(
        contractAddress,
        abi.abi,
        owner
    );

    const metaData = await getMetaData();

    try {
        await entryPassContract.award(owner.address, metaData);
        console.log("awarded !");
    } catch (e) {
        console.log(e);
    }

}

const getContractAddress = (): string => {

    if (typeof process.env.CONTRACT_ADDRESS === "undefined") {
        throw new TypeError("Add the contract address to the environment variable");
    } else {
        return process.env.CONTRACT_ADDRESS;
    }

}

const getAbi = async () => {

    const bufferData = await fs.readFileSync("artifacts/contracts/EntryPass.sol/EntryPass.json");
    const abi = JSON.parse(bufferData.toString());

    return abi;

}

const getMetaData = () => {

    const metaDataStr = {
        "name": process.env.METADATA_NAME,
        "description": process.env.METADATA_DESC,
        "image": process.env.METADATA_IMG,
    };

    const metaData = JSON.stringify(metaDataStr)
    
    return metaData;
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
```
*環境変数のMETADATA_NAME, METADATA_DESC, METADATA_IMG は、任意の値を設定してください。<br />
### SBT を送信
SBT をオーナーに送信するため、スクリプトを実行します。
```shell
npx hardhat run scripts/award.ts
```
awarded が返ってきたら成功です👍
## パブリックブロックチェーン
ローカルで上手くいったら、パブリックなブロックチェーンのMumbai にデプロイします。<br />
デプロイ先を変更するため、hardhat.config.tsを編集してください。
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const getPrivateKey = (): string => {
  if (typeof process.env.PRIVATE_KEY === "undefined") {
    throw new TypeError("Add the private key to the environment variable");
  } else {
    return process.env.PRIVATE_KEY;
  }
}

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    mumbai: {
      url: process.env.MUMBAI_NODE,
      accounts: [getPrivateKey()],
    }
  },
};

export default config;
```
*環境変数のMUMBAI_NODE, PRIVATE_KEY はalchemy やMetaMask などから取得し、設定してください。
### Mumbai にデプロイ
さきほどのコマンドに引数をつけて、実行します。（hardhat.config.ts で設定したPRIVATE_KEY のアカウントに、ガス代を負担できるだけの十分なMatic が入っている必要があります。）
```shell
npx hardhat run scripts/deploy.ts --network mumbai
```
さきほどと同じように、Deployed contract address : <コントラクトアドレス> が返ってきたら成功です👍<br />
環境変数のCONTRACT_ADDRESS も変更します。

### Mumbai でアワード
こちらも、さきほどのコマンドに引数をつけて実行します。
```shell
npx hardhat run scripts/award.ts --network mumbai
```
awarded が返ってきたら成功です👍

## OpenSea で確認
SBT はNFT の一種なので、もちろんOpenSea で確認できます。<br />
Mumbai はPolygon のテストネットワークなので、[テストネットワーク版のOpenSea](https://testnets.opensea.io/ja) で確認します。<br />
hardhat.config.ts で設定したPRIVATE_KEY のアカウントに、入っているはずです！<br />
<mark>また、SBT なので他のアカウントに転送しようとするとExecution reverted になるはずです。</mark>

## まとめ
今回は、Hardhat を使ってSBT をコーディングしました。<br />
この位のSBT はノーコードツールを使っても作成できますが、よりSBT をカスタマイズする必要がある場合、このコードを参考していただければ嬉しいです。<br />

