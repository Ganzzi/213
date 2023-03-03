// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
    function transferFrom(address, address, uint256) external returns (bool);
}

/// @title A Marketplace for Street Food
/// @author Your name goes here
contract StreetFood {
    //   DECLARATION

    uint256 public productsLength = 0;
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
    // changed the mapping name to suit the naming convention for variables
    mapping(address => BoughtItem[]) internal boughtItems;

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

    /// @notice Accesses the data of a product saved on the blockchain
    /// @dev It takes the params provided, to access a particular product from the products mapping
    /// @param _index The index of the product stored in the products mapping
    /// @return Product struct with all its data
    function readProduct(uint _index) public view returns (Product memory) {
        return products[_index];
    }

    // function allow user to buy product
    /// @notice Buy a product already saved on the blockchain
    /// @dev It takes the params provided to get access to the requested product and using the IERC20Token trasnferFrom function, transfers the price of the product from the buyer to the seller
    /// @param _index The index of the productt
    function buyProduct(uint _index) public payable {
        require(msg.sender != products[_index].owner, "Owner can not but their product");
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
    
    /// @notice Save/store a bought product
    /// @dev It takes the param provided, to get access to the bought item and stores it in the boughtItems mapping
    /// @param _index The index of the product
    function storeBoughtItem(uint _index) private {
        boughtItems[msg.sender].push(
            BoughtItem(
                products[_index].name,
                products[_index].image,
                products[_index].description,
                products[_index].location,
                products[_index].price
            )
        );
    }
    
    /// @notice Clears the stored data of a product out of the blockchain
    /// @dev It takes the param provided to get access to the particular product and clears its data from the products mapping
    /// @param _index The index of the product
    function removeProduct(uint _index) public {
        require(
            msg.sender == products[_index].owner,
            "You are not the owner"
        );
        delete (products[_index]);
    }
    
    // function to update their product's price
    
    /// @notice Updates the price of a particular product
    /// @dev It takes the params provided to get access to a particular product and change its price to a new price
    /// @param _index The index of the product
    /// @param _newPrice The new price of the product
    function updateProduct(uint _index, uint _newPrice) public {
        require(
            msg.sender == products[_index].owner,
            "You are not the owner"
        );
        products[_index].price = _newPrice;
    }


    /// @notice Retrieve all the items bought by a user
    /// @dev It takes the param provided to gets access to the user's boought items stored in the boughtItems mapping
    /// @param spender The owner of the product
    /// @return BoughtItems array containing all the user's bought items
    function getAllBoughtItem(address spender) public view returns (BoughtItem[] memory) {
        return boughtItems[spender];
    }
}
