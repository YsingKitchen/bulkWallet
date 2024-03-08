const { utils, Wallet, providers, Contract, BigNumber } = require('ethers')
const abi = require('./abi.json')

const goerli = "https://goerli.infura.io/v3/330d89d0f987437fa7c4a67e06550bc6"
const privateKey = "d4d1f491485136c031ff6073f4b15955ef2b34d7b16e2ec090eab5e9ded3afa8"
const fromAddress = "0xDCb301269ccca3ca7c219A7CDdBbc6dcBf7c9734"
const provider = new providers.JsonRpcProvider(goerli)
const wallet = new Wallet(privateKey, provider)
const contractAddr = '0x9a68Fc5B7EbD4bf324281A175417741CF5F3d2ca'
const contract = new Contract(contractAddr, abi, wallet)
// const mnemonic = utils.entropyToMnemonic(utils.randomBytes(32))
const mnemonic = 'census swear during place right fiscal unhappy around maple job dinosaur delay clerk brother whale spell feed muscle pupil fabric hurdle give can public'
const hdNode = utils.HDNode.fromMnemonic(mnemonic)
const numWallet = 20
const basePath = "m/44'/60'/0'/0";
let addressArr = []
let walletArr = []
for (let i = 0; i < numWallet; i++) {
    let hdNodeNew = hdNode.derivePath(basePath + "/" + i);
    let walletNew = new Wallet(hdNodeNew.privateKey);
    console.log(`第${i+1}个钱包地址： ${walletNew.address}`)
    console.log(`第${i+1}个钱包密钥： ${hdNodeNew.privateKey}`)
    walletArr.push(walletNew)
    addressArr.push(walletNew.address);
}
//查询余额
const balanceOf = async () => {
    let balArr = addressArr.map((e) => {
        return provider.getBalance(e)
    })
    await Promise.all(balArr).then((res) => {
        let bal = res.map(e => utils.formatEther(e))
        console.log(bal)
    }).catch((error) => {
        console.error(error);
    })
    return balArr
}

//发送eth
const sendETH = async () => {
    const amounts = Array(20).fill(utils.parseEther('0.01'))
    console.log('所有钱包地址:')
    console.log(addressArr);
    console.log('正在发送交易...');
    const tx = await contract.multiTransferETH(addressArr, amounts, {
        value: utils.parseEther('0.2'),
    })
    console.log(`等待交易上链...   tx ${tx.hash}`);
    await tx.wait()
    console.log(`批量转账成功...   tx ${tx.hash}`)
    balanceOf()
}
//取回eth
const backETH = async () => {
    console.log('批量归集20个钱包的ETH...')
    console.log('余额查询中...')
    const feeData = await provider.getFeeData()
    let gasFee = feeData.maxFeePerGas.mul(22000)
    console.log(`当前gasPrice ${utils.formatUnits(feeData.gasPrice, "gwei")}  费用: ${utils.formatEther(gasFee.toString())}`);
    let txArr = walletArr.map(async (e) => {
        let amount = await provider.getBalance(e.address)
        let value = amount.sub(gasFee)
        console.log(`${e.address}    余额 ${utils.formatEther(amount.toString())}    转回 ${utils.formatEther(value.toString())}`)
        const backTx = {
            to: wallet.address,
            value: value,
            gasLimit:22000
        }
        let walletiWithProvider = e.connect(provider)
        return walletiWithProvider.sendTransaction(backTx)
    })
    console.log('交易发送中...');
    await Promise.all(txArr).then((res) => {
        console.log(`ETH 归集结束`)
        let txArr = res.map((e) => e.hash)
        console.log(txArr)
    }).catch((error) => {
        console.error(error);
    })
    console.log('交易全部执行完成...');
}


// backETH()
// sendETH()
// balanceOf()

