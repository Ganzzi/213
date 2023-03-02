// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transfer(address, uint256) external returns (bool);

    function approve(address, uint256) external returns (bool);

    function transferFrom(address, address, uint256) external returns (bool);

    function totalSupply() external view returns (uint256);

    function balanceOf(address) external view returns (uint256);

    function allowance(address, address) external view returns (uint256);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract Marketplace {
    //   DECLARATION

    uint internal productsLength = 0;
    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Product {
        address payable owner;
        string name;
        string image;
        string description;
        string location;
        uint price;
        uint sold;
    }

    struct BoughtItem {
        string name;
        string image;
        string description;
        string location;
        uint price;
    }

    mapping(uint => Product) internal products;
    mapping(address => BoughtItem[]) internal s_boughtItems;

    //  FUNCTIONALITY

    // function to write product to blockchain
    function writeProduct(
        string memory _name,
        string memory _image,
        string memory _description,
        string memory _location,
        uint _price
    ) public {
        uint _sold = 0;
        products[productsLength] = Product(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _location,
            _price,
            _sold
        );
        productsLength++;
    }

    // function to read product
    function readProduct(
        uint _index
    )
        public
        view
        returns (
            address payable,
            string memory,
            string memory,
            string memory,
            string memory,
            uint,
            uint
        )
    {
        return (
            products[_index].owner,
            products[_index].name,
            products[_index].image,
            products[_index].description,
            products[_index].location,
            products[_index].price,
            products[_index].sold
        );
    }

    // function allow user to buy product
    function buyProduct(uint _index) public payable {
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                products[_index].owner,
                products[_index].price
            ),
            "Transfer failed."
        );
        products[_index].sold++;

        storeBoughtItem(_index);
    }

    // function allow user to store their bought product
    function storeBoughtItem(uint _index) private {
        s_boughtItems[msg.sender].push(
            BoughtItem(
                products[_index].name,
                products[_index].image,
                products[_index].description,
                products[_index].location,
                products[_index].price
            )
        );
    }

    // function to remove their product out of the marketplace
    function removeProduct(uint _indexToRemove) public {
        require(
            msg.sender == products[_indexToRemove].owner,
            "You are not the owner"
        );
        delete (products[_indexToRemove]);
    }

    // function to update their product's price
    function updateProduct(uint _indexToUpdate, uint _newPrice) public {
        require(
            msg.sender == products[_indexToUpdate].owner,
            "You are not the owner"
        );
        products[_indexToUpdate].price = _newPrice;
    }

    //  function to get the number of product added
    function getProductsLength() public view returns (uint) {
        return (productsLength);
    }

    // function to get an array of item bought of each user
    function getAllBoughtItem(
        address spender
    ) public view returns (BoughtItem[] memory) {
        return s_boughtItems[spender];
    }
}
