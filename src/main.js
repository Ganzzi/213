import { newKitFromWeb3 } from "@celo/contractkit";
// import Web3 from "web3";
const Web3 = require("web3");
// import BigNumber from "bignumber.js";

import marketplaceAbi from "../contract/marketplace.abi.json";
import erc20Abi from "../contract/erc20.abi.json";

const ERC20_DECIMALS = 18;
const MPContractAddress = "0x973408328976b6a59021136CfCa2Dc8CCA5440C4";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

let kit;
let contract;
let products = [];
let preProducts = [];
let temp_product = [];
let enableSearch = false;
let web3 = new Web3();

const truncateStr = (fullStr, frontChars, backChars) => {
  let separator;
  if (fullStr.length > 20) {
    separator = "...";
  } else {
    separator = ".";
  }
  return (
    fullStr.substring(0, frontChars) +
    separator +
    fullStr.substring(fullStr.length - backChars)
  );
};

const connectCeloWallet = async function () {
  if (window.celo) {
    try {
      notification("⚠️ Please approve this DApp to use it.");
      await window.celo.enable();
      notificationOff();
      web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      document.getElementById("ConnectedAddress").innerHTML = truncateStr(
        accounts[0],

        4,
        3
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

async function getAllBoughtItems() {
  const result = await contract.methods
    .getAllBoughtItem(kit.defaultAccount)
    .call();
  const boughtItems = [];
  for (let i = 0; i < result.length; i++) {
    const item = result[i];
    boughtItems.push({
      name: item.name,
      image: item.image,
      description: item.description,
      location: item.location,
      price: web3.utils.fromWei(item.price.toString(), "ether"),
    });
  }
  return boughtItems;
}

const getProducts = async function () {
  products = [];
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
        price: p[5],
        sold: p[6],
      });
    });
    _products.push(_product);
  }
  preProducts = await Promise.all(_products);
  // console.log(preProducts);

  for (let index = 0; index < preProducts.length; index++) {
    if (
      preProducts[index].owner !== "0x0000000000000000000000000000000000000000"
    ) {
      products.push(preProducts[index]);
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
        <div class="position-absolute top-0 end-0 bg-primary mt-4 px-2 py-1 rounded-start ">
          ${_product.sold} Sold
        </div>
        <div class="card-body text-left p-4 position-relative">
          <div class="translate-middle-y position-absolute top-0">
          ${identiconTemplate(_product.owner)}
          </div>
          <h2 class="card-title fs-4 fw-bold mt-2">${_product.name}</h2>
          <p class="card-text mb-4" style="min-height: 150px">
            ${truncateStr(_product.description, 95, 0)}             
          </p>
          <p class="card-text mt-4">
            <i class="bi bi-geo-alt-fill"></i>
            <span>${_product.location}</span>
          </p>
          <div class="d-grid gap-2">
            <a class="btn btn-lg btn-outline-dark buyBtn fs-6 p-3" id="${
              _product.index
            }">
              Buy for ${parseFloat(
                web3.utils.fromWei(_product.price.toString(), "ether")
              ).toFixed(2)} cUSD
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
              <p>Rencent price: ${parseFloat(
                web3.utils.fromWei(_product.price.toString(), "ether")
              ).toFixed(2)}</p>
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

function boughtItemTemplate(_product) {
  return `
    <div class="row g-0">
      <div class="col-md-4">
        <img src="${_product.image}" alt="" class="img-fluid">
      </div>
    
      <div class="col-md-8">
        <div class="card-body">
          <h5 class="card-title">${_product.name}</h5>
          <p class="card-text" style="min-height: 50px">${truncateStr(
            _product.description,
            45,
            0
          )} </p>
          <p class="card-text"><i class="bi bi-geo-alt-fill"></i> ${
            _product.location
          }</p>
          <p class="card-text">${
            _product.price
          } <span class="text-success">cUSD</span></p>
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

window.addEventListener("load", async () => {
  notification("⌛ Loading...");
  await connectCeloWallet();
  await getBalance();
  await getProducts();

  notificationOff();
});

document.querySelector("#searchButton").addEventListener("click", async () => {
  console.log("searching");
  let sr = new RegExp(document.getElementById("searchInput").value, "i");
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

let price1, price2;

document
  .querySelector("#newProductBtn")
  .addEventListener("click", async (e) => {
    const params = [
      document.getElementById("newProductName").value,
      document.getElementById("newImgUrl").value,
      document.getElementById("newProductDescription").value,
      document.getElementById("newLocation").value,
      web3.utils.toWei(document.getElementById("newPrice").value),
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
    await getProducts();
  });

document.querySelector("#seeBoughtItem").addEventListener("click", async () => {
  const allBoughtItem = await getAllBoughtItems();
  const _list = document.getElementById("listOfAllBoughtItem");

  _list.innerHTML = "";

  if (allBoughtItem.length > 0) {
    allBoughtItem.forEach((item) => {
      const newDiv = document.createElement("div");
      newDiv.className = "card mb-3 border outline-dark";
      newDiv.style = "max-width: 540px";
      newDiv.innerHTML = boughtItemTemplate(item);
      _list.appendChild(newDiv);
    });
  } else {
    const newDiv = document.createElement("div");
    newDiv.innerHTML = "You didn't buy anything!!!";
    _list.appendChild(newDiv);
  }
});

let n_priceValue = -99;
let i_temp = -99;
let openUpdate = true;
document.querySelector("#marketplace").addEventListener("click", async (e) => {
  if (e.target.className.includes("buyBtn")) {
    const index = e.target.id;
    notification("⌛ Waiting for payment approval...");
    console.log("buying");
    try {
      await approve(preProducts[index].price);
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
    notification(`⌛ Awaiting payment for "${preProducts[index].name}"...`);
    try {
      const result = await contract.methods
        .buyProduct(index)
        .send({ from: kit.defaultAccount });
      notification(`🎉 You successfully bought "${preProducts[index].name}".`);
      await getProducts();
      await getBalance();
    } catch (error) {
      notification(`⚠️ ${error}.`);
    }
  } else if (e.target.className.includes("inputChange")) {
    // this if to get value from input
    document
      .querySelector(`#${e.target.id.toString()}`)
      .addEventListener("change", async () => {
        n_priceValue = e.target.value;
      });
  } else if (e.target.className.includes("applyBtn")) {
    // this if to get index of product
    if (n_priceValue != -99) {
      console.log("applying");

      let i_index = parseInt(
        e.target.id.toString().slice(e.target.id.lastIndexOf("-") + 1)
      );
      i_temp = i_index;
      openUpdate = true;
      console.log(i_temp, n_priceValue, openUpdate);

      notification(`⌛Apllying new price...`);
    }
  } else if (e.target.className.includes("deleteButton")) {
    // this if to get index of product
    let i_index = parseInt(
      e.target.id.toString().slice(e.target.id.lastIndexOf("-") + 1)
    );
    i_temp = i_index;

    if (checkOwner(i_temp, preProducts[i_temp].owner)) {
      notification(`⌛Deleting Product....`);
      try {
        const result = await contract.methods
          .removeProduct(i_temp)
          .send({ from: kit.defaultAccount });
        notification(`🎉 Successfully deleted`);
        await getProducts();
      } catch (error) {
        notification(`⚠️ ${error}.`);
      }
    } else {
      notification("Impossible to delete because you are not the owner!");
    }
  }

  if (n_priceValue != -99 && i_temp != -99 && openUpdate) {
    if (checkOwner(i_temp, preProducts[i_temp].owner)) {
      // this if to check whether condition to updating is true
      try {
        console.log("updating...");
        openUpdate = false;

        const result = await contract.methods
          .updateProduct(i_temp, web3.utils.toWei(n_priceValue))
          .send({ from: kit.defaultAccount });
        notification(`🎉 Successfully updated!`);
        i_temp = -99;
        // console.log(products);
        await getProducts();
      } catch (error) {
        notification(`⚠️ ${error}.`);
      }
    } else {
      notification("Impossible to update because you are not the owner!");
    }
  }
});

function checkOwner(index, owner) {
  console.log(kit.defaultAccount, owner);
  if (kit.defaultAccount.toString() == owner.toString()) {
    return true;
  }
  return false;
}
