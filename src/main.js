import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";

import marketplaceAbi from "../contract/marketplace.abi.json";
import erc20Abi from "../contract/erc20.abi.json";

const ERC20_DECIMALS = 18;
const MPContractAddress = "0xd4Ba3d00F9B8dd7802E1297f0A9482b827C65a5B";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

let kit;
let contract;
let products = [];
let preProducts = [];
let temp_product = [];
let enableSearch = false;

const truncateStr = (fullStr, strLen) => {
  if (fullStr.length <= strLen) return fullStr;

  const separator = "...";
  const seperatorLength = separator.length;
  const charsToShow = strLen - seperatorLength;
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return (
    fullStr.substring(0, frontChars) +
    separator +
    fullStr.substring(fullStr.length - backChars)
  );
};

const connectCeloWallet = async function () {
  if (window.celo) {
    console.log(window.celo);
    try {
      notification("⚠️ Please approve this DApp to use it.");
      await window.celo.enable();
      notificationOff();
      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      document.getElementById("ConnectedAddress").innerHTML = truncateStr(
        accounts[0],
        10
      );

      contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else {
    notification("⚠️ Please install the CeloExtensionWallet.");
  }
};

const getBalance = async function () {
  const totalBalance = await kit.getTotalBalance(kit.defaultAccount);
  const cUSDBalance = totalBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2);
  document.querySelector("#balance").textContent = cUSDBalance;
};

const getProducts = async function () {
  const _productsLength = await contract.methods.getProductsLength().call();
  const _products = [];
  for (let i = 0; i < _productsLength; i++) {
    let _product = new Promise(async (resolve, reject) => {
      let p = await contract.methods.readProduct(i).call();
      resolve({
        index: i,
        owner: p[0],
        name: p[1],
        image: p[2],
        description: p[3],
        location: p[4],
        price: new BigNumber(p[5]),
        sold: p[6],
      });
    });
    _products.push(_product);
  }
  preProducts = await Promise.all(_products);
  console.log(preProducts);

  for (let index = 0; index < preProducts.length; index++) {
    console.log(preProducts[index]);
    if (
      preProducts[index].owner !== "0x0000000000000000000000000000000000000000"
    ) {
      products.push(preProducts[index]);
      console.log("pushing");
    }
  }
  console.log(products);

  renderProducts();
};

function renderProducts() {
  document.getElementById("marketplace").innerHTML = "";
  if (enableSearch == false) {
    products.forEach((_product) => {
      const newDiv = document.createElement("div");
      newDiv.className = "col-md-4";
      newDiv.innerHTML = productTemplate(_product);
      document.getElementById("marketplace").appendChild(newDiv);
    });
  } else {
    temp_product.forEach((_product) => {
      const newDiv = document.createElement("div");
      newDiv.className = "col-12 col-sm-6 col-lg-4";
      newDiv.innerHTML = productTemplate(_product);
      document.getElementById("marketplace").appendChild(newDiv);
    });
  }
}
function productTemplate(_product) {
  return `
      <div class="card mb-4">
        <img class="card-img-top min-vh-75" src="${_product.image}" alt="..." 
        data-bs-toggle="modal" data-bs-target="#myModal-${_product.index}"
        >
        <div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
          ${_product.sold} Sold
        </div>
        <div class="card-body text-left p-4 position-relative">
          <div class="translate-middle-y position-absolute top-0">
          ${identiconTemplate(_product.owner)}
          </div>
          <h2 class="card-title fs-4 fw-bold mt-2">${_product.name}</h2>
          <p class="card-text mb-4" style="min-height: 82px">
            ${_product.description}             
          </p>
          <p class="card-text mt-4">
            <i class="bi bi-geo-alt-fill"></i>
            <span>${_product.location}</span>
          </p>
          <div class="d-grid gap-2">
            <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id="${
              _product.index
            }">
              Buy for ${_product.price} ${_product.price
    .shiftedBy(-ERC20_DECIMALS)
    .toFixed(2)} cUSD
            </a>
          </div>
        </div>
      </div>

      <!-- The Modal -->
        <div class="modal" id="myModal-${_product.index}">
          <div class="modal-dialog">
            <div class="modal-content">

              <!-- Modal Header -->
              <div class="modal-header">
                <h4 class="modal-title">Information</h4>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>

              <!-- Modal body -->
              <div class="modal-body">
              <p>Rencent price: ${_product.price
                .shiftedBy(-ERC20_DECIMALS)
                .toFixed(2)}</p>
              <div class="input-group mb-3">
                <input type="number" class="form-control inputChange" placeholder="New Price" id="newPrice-${
                  _product.index
                }">
                <button class="btn btn-primary applyBtn" type="submit" id="btnApply-${
                  _product.index
                }">Apply</button>
              </div>


                <div class="d-grid gap-2 my-3">
                  <a class="btn btn-lg btn-outline-danger fs-6 p-3 deleteButton" id="btnDelete-${
                    _product.index
                  }"
                    >
                    Delete Product
                  </a>
                </div>

                

              <!-- Modal footer -->
              <div class="modal-footer">
                <button type="button" class="btn btn-danger" data-bs-dismiss="modal">Close</button>
              </div>

            </div>
          </div>
        </div>
    `;
}

function identiconTemplate(_address) {
  const icon = blockies
    .create({
      seed: _address,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
    <div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
      <a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
          target="_blank">
          <img src="${icon}" width="48" alt="${_address}">
      </a>
    </div>
    `;
}

function notification(_text) {
  document.querySelector(".alert").style.display = "block";
  document.querySelector("#notification").textContent = _text;
}

function notificationOff() {
  document.querySelector(".alert").style.display = "none";
}

async function approve(_price) {
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress);

  const result = await cUSDContract.methods
    .approve(MPContractAddress, _price)
    .send({ from: kit.defaultAccount });
  return result;
}

async function apply(i) {
  console.log("applying");
}

window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  await getProducts();
  notificationOff();
});

document.querySelector("#searchButton").addEventListener("click", async () => {
  console.log("searching");
  let sr = document.getElementById("searchInput").value;
  console.log(sr);
  if (sr != -1) {
    for (let index = 0; index < products.length; index++) {
      if (products[index].name.search(sr) != -1) {
        temp_product.push(products[index]);
      }
    }
    enableSearch = true;
    products = [];
    await getProducts();
  }
  enableSearch = false;
  temp_product = [];
});

document
  .querySelector("#newProductBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newProductName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newProductDescription").value,
      document.getElementById("newLocation").value,
      new BigNumber(document.getElementById("newPrice").value)
        .shiftedBy(ERC20_DECIMALS)
        .toString(),
    ];
    notification(`⌛ Adding "${params[0]}"...`);
    try {
      const result = await contract.methods
        .writeProduct(...params)
        .send({ from: kit.defaultAccount });
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
    notification(`🎉 You successfully added "${params[0]}".`);
    getProducts();
  });

let n_priceValue = -99;
let i_temp = -99;
document.querySelector("#marketplace").addEventListener("click", async (e) => {
  console.log(products[0].owner);

  if (e.target.className.includes("buyBtn")) {
    const index = e.target.id;
    notification("⌛ Waiting for payment approval...");
    try {
      console.log(products[1].price);
      await approve(products[index].price);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
    notification(`⌛ Awaiting payment for "${products[index].name}"...`);
    try {
      const result = await contract.methods
        .buyProduct(index)
        .send({ from: kit.defaultAccount });
      notification(`🎉 You successfully bought "${products[index].name}".`);
      getProducts();
      getBalance();
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else if (e.target.className.includes("inputChange")) {
    // this if to get value from input
    document
      .querySelector(`#${e.target.id.toString()}`)
      .addEventListener("change", async () => {
        n_priceValue = e.target.value;

        console.log(n_priceValue);
      });
  } else if (e.target.className.includes("applyBtn")) {
    // this if to get index of product
    if (n_priceValue != 99) {
      console.log("applying");
      let i_index = parseInt(e.target.id.toString().slice(-1));
      i_temp = i_index;

      notification(`⌛Apllying new price...`);
      notification("Cant update because you are not the owner!");
    }
  } else if (e.target.className.includes("deleteButton")) {
    // this if to get index of product
    console.log("Deleting item");
    let i_index = parseInt(e.target.id.toString().slice(-1));
    i_temp = i_index;

    console.log(i_temp + "del" + preProducts[5].owner);

    if (checkOwner(i_temp, preProducts[i_temp].owner)) {
      notification(`⌛Deleting Product....`);
      try {
        const result = await contract.methods
          .removeProduct(i_temp)
          .send({ from: kit.defaultAccount });
        notification(`🎉 `);
        getProducts();
      } catch (error) {
        notification(`⚠️ ${error}.`);
      }
    } else {
      notification("Cant delete because you are not the owner!");
    }
  }

  if (n_priceValue != -99 && i_temp != -99) {
    if (checkOwner(i_temp, preProducts[i_temp].owner)) {
      // this if to check whether condition to updating is true
      try {
        console.log("updating...");
        const result = await contract.methods
          .updateProduct(
            i_temp,
            new BigNumber(n_priceValue).shiftedBy(ERC20_DECIMALS).toString()
          )
          .send({ from: kit.defaultAccount });
        notification(`🎉 `);
        getProducts();
      } catch (error) {
        notification(`⚠️ ${error}.`);
      }
    }
  }
});

function checkOwner(index, owner) {
  console.log("acc: " + kit.defaultAccount);
  console.log("owner: " + owner);
  console.log(kit.defaultAccount.toString() == owner.toString());
  if (kit.defaultAccount.toString() == owner.toString()) {
    return true;
  }
  return false;
}
