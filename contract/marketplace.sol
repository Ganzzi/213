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

/// @title A Marketplace for Street Food in Saigon
/// @author Ganzzi
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
    mapping(address => BoughtItem[]) internal boughtItem;

    //modifier for onlyOwner
    modifier onlyOwner(uint _index) {
        require(msg.sender == products[_index].owner, "You are not authorized");
        _;
    }

    //  FUNCTIONALITY

    // function to write product to blockchain
    /// @notice Save/store a product to the blockchain
    /// @dev It takes the params provided, creates a Product with it and stores it in the products mapping
    /// @param _name The name of the product
    /// @param _image The image of the product
    /// @param _description The description of the product
    /// @param _location The location of the product
    /// @param _price The price of the product
    function writeProduct(
        string calldata _name,
        string calldata _image,
        string calldata _description,
        string calldata _location,
        uint _price
    ) public {
        require(bytes(_name).length > 0, "Input is invalid");
        require(bytes(_image).length > 0, "Input is invalid");
        require(bytes(_description).length > 0, "Input is invalid");
        require(bytes(_location).length > 0, "Input is invalid");
        require(_price > 0, "Price is invalid");
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

    /// @notice Accesses the data of a product saved on the blockchain
    /// @dev It takes the params provided, to access a particular product from the products mapping
    /// @param _index The index of the product stored in the products mapping
    /// @return Product struct with all its data
    function readProduct(uint _index) public view returns (Product memory) {
        return (products[_index]);
    }

    // function allow user to buy product
    /// @notice Buy a product already saved on the blockchain
    /// @dev It takes the params provided to get access to the requested product and using the IERC20Token trasnferFrom function, transfers the price of the product from the buyer to the seller
    /// @param _index The index of the productt
    function buyProduct(uint _index) public payable {
        Product memory _product = products[_index];
        require(msg.sender != _product.owner, "You can't buy your own product");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                _product.owner,
                _product.price
            ),
            "Transfer failed."
        );
        products[_index].sold++;

        storeBoughtItem(_index);
    }

    /// @notice Save/store a bought product
    /// @dev It takes the param provided, to get access to the bought item and stores it in the boughtItems mapping
    /// @param _index The index of the product
    function storeBoughtItem(uint _index) private {
        Product memory _bProduct = products[_index];
        boughtItem[msg.sender].push(
            BoughtItem(
                _bProduct.name,
                _bProduct.image,
                _bProduct.description,
                _bProduct.location,
                _bProduct.price
            )
        );
    }

    /// @notice Clears the stored data of a product out of the blockchain
    /// @dev It takes the param provided to get access to the particular product and clears its data from the products mapping
    /// @param _indexToRemove The index of the product
    function removeProduct(
        uint _indexToRemove
    ) public onlyOwner(_indexToRemove) {
        delete (products[_indexToRemove]);
    }

    /// @notice Updates the price of a particular product
    /// @dev It takes the params provided to get access to a particular product and change its price to a new price
    /// @param _indexToUpdate The index of the product
    /// @param _newPrice The new price of the product
    function updateProduct(
        uint _indexToUpdate,
        uint _newPrice
    ) public onlyOwner(_indexToUpdate) {
        require(_newPrice > 0, "Price is invalid");

        products[_indexToUpdate].price = _newPrice;
    }

    //  function to get the number of product added
    function getProductsLength() public view returns (uint) {
        return (productsLength);
    }

    /// @notice Retrieve all the items bought by a user
    /// @dev It takes the param provided to gets access to the user's boought items stored in the boughtItems mapping
    /// @param spender The owner of the product
    /// @return BoughtItems array containing all the user's bought items
    function getAllBoughtItem(
        address spender
    ) public view returns (BoughtItem[] memory) {
        return boughtItem[spender];
    }
}
