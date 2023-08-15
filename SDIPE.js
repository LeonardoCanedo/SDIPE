
/* BINDS
Binds are a way of defining a variable that has access to the system's native objects, such as Integration Endpoints, nodes and more.

Variable name / Binds to - Type of object / Parameter;

node / Current Object;
GIEP / Gateway Integration Endpoin / (GATENDTYPE);
entityParent / Entity / Ice Cat Brands (Brands);
entityObjType / Object Type / Ice Cat Brand (Brand);
assetDownloadHome / Asset Download Home;
assetParent / Classification / Ice Cat Assets (Assets);
assetObjTypeLogo / Object Type / (Logo);
assetObjTypePI / Object Type / (ProductImage);
productToImageRT / Reference Type / (PrimaryProductImage);
entityLogoRT / Reference Type / Entity Logo (EntityLogo);
manager / STEP Manager;
productToEntityRT / Reference Type / Product To Entity Leo (product2EntityLeo)
*/

// Call the "consultGEIP" function with a GTIN value obtained from a node

var productGTIN = node.getValue('GTINAttributeID').getSimpleValue();
if (productGTIN == "" || eanProduto == null) {
    return "Product's EAN is empty."
}

var data = String(SDIPE_FunctionsLibrary.consultGEIP(productGTIN, GIEP));

// key: attributeId value: JSON key

var attributesAndParameters = {
    Title: '"Title":',
    Brand: '"Brand":',
    ProductName: '"ProductName":',
    LongDesc: '"LongDesc":',
    WarrantyInfo: '"WarrantyInfo":',
    ShortSummaryDescription: '"ShortSummaryDescription":',
    LongSummaryDescription: '"LongSummaryDescription":',
    BrandLogo: '"BrandLogo":',
    ThumbPic: '"ThumbPic":',
    Language: '"Language":',
    BrandID: '"BrandID":',
};

// Fill general attributes into product
SDIPE_FunctionsLibrary.fillProducts(attributesAndParameters, node, data, lookUpTable, skuReferenceType);
// Creates an entity based on the Brand attributes
var entity = SDIPE_FunctionsLibrary.createBrandEntity(entityParent, entityObjType, data, manager);
// Creates the reference between the product and its respective entity (brand)
SDIPE_FunctionsLibrary.createProduct2EntityReference(node, entity, productToEntityRT, manager, skuReferenceType);
// Downloads and creates Assets for the product and brand
SDIPE_FunctionsLibrary.downloadAndCreateAssets(entity, node, assetParent, assetObjTypeLogo, assetObjTypePI, assetObjType, data, assetDownloadHome, manager, getAllProductImagesFromGallery);
// Creates references between products and assets, entities and assets
SDIPE_FunctionsLibrary.createImageReferences(node, entity, productToImageRT, entityLogoRT, manager, getAllProductImagesFromGallery, data, skuReferenceType);
// Get the other specific features (attributes) into the product
SDIPE_FunctionsLibrary.getFeaturesIntoProduct(SDIPE_FunctionsLibrary.getHowManyAttributes(data));
