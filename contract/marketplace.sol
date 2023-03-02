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

    uint internal productsLength = 0;

    address internal cUsdTokenAddress =
        0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;


    //arrange product details together.
    struct Product {
        address payable owner;
        string name;
        string image;
        string description;
        string location;
        uint price;
        uint sold;
    }
    
    
    //arrange bought item details together
    struct BoughtItem {
        string name;
        string image;
        string description;
        string location;
        uint price;
    }
    
    
    //store products with index
    mapping(uint => Product) internal products;
    
    //store bought products with index
    mapping(address => BoughtItem[]) internal s_boughtItems;

    //modifier for onlyOwner
    modifier onlyOwner(uint _index){
        require(msg.sender == products[_index].owner,"You are not authorized");
        _;
    }
    
    
    //write and store the product in the store
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


    //read specific product from the store
    function readProduct(
        uint _index
    )
        public
        view
        returns (
            Product memory
                    )
    {
        return (
            products[_index];  
        );
    }


    //buy product from the seller
    function buyProduct(uint _index) public payable {
        Product memory _product = products[_index];
        require(msg.sender != _product.owner,"You can't buy your own product");
        require(
            IERC20Token(cUsdTokenAddress).transferFrom(
                msg.sender,
                _product.owner,
                _product.price
            ),
            "Transfer failed."
        );
        products[_index].sold++;

        s_boughtItems[msg.sender].push(
            BoughtItem(
                _product.name,
                _product.image,
                _product.description,
                _product.location,
                _product.price
            )
        );
    }
    

    //Owner deletes the product from the store
    function removeProduct(
        uint _indexToRemove
    ) public onlyOwner(_indexToRemove) {
        delete (products[_indexToRemove]);
    }
    

    //Owner updates the price of a specific product
    function updateProduct(
        uint _indexToUpdate,
        uint _newPrice
    ) public onlyOwner(_indexToUpdate){
        require(_newPrice > 0,"Price is invalid");
        products[_indexToUpdate].price = _newPrice;
    }
    

    //get total number of products stored in the store
    function getProductsLength() public view returns (uint) {
        return (productsLength);
    }
    

    //Get all products bought by a specific buyer.
    function getAllBoughtItem(
        address spender
    ) public view returns (BoughtItem[] memory) {
        return s_boughtItems[spender];
    }

}
