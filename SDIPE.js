
/* BINDS
Variable name / Binds to / Parameter;
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

var eanProduto = node.getValue('ATR_EANTributario').getSimpleValue();
if (eanProduto == "" || eanProduto == null){
	return "EAN do produto está vazio."
}


var data = String(Biblioteca_EnriquecimentoExterno.consultGEIP(node.getValue('ATR_EANTributario').getSimpleValue(), GIEP));


// key: attributeId value: JSON key

var attributesAndParameters = {
Title: '"Title":',
Brand:'"Brand":',
ProductName:'"ProductName":',
LongDesc:'"LongDesc":',
WarrantyInfo:'"WarrantyInfo":',
ShortSummaryDescription:'"ShortSummaryDescription":',
LongSummaryDescription:'"LongSummaryDescription":',
BrandLogo:'"BrandLogo":',
ThumbPic:'"ThumbPic":',
Language:'"Language":',
BrandID:'"BrandID":',
};


// Functions that gets all the pics of the product gallery		
var stringImageData = data;
function getFeaturesUrl(slicedTilLowPic){
	var slicedTilFirstValue = slicedTilLowPic.slice(slicedTilLowPic.indexOf('"Pic":')+7);
	var endValueString = slicedTilFirstValue.indexOf('"');
	var featureValue = slicedTilFirstValue.substring(slicedTilFirstValue, endValueString);

	stringImageData = slicedTilFirstValue;
	return featureValue;
	};
	
var imagesUrlArray = [];
function getAllProductImagesFromGallery(data){
	var slicedTilGallery = data.slice(data.indexOf('"Gallery":')+10);
	var word = '"LowPic":';
	var index = slicedTilGallery.indexOf(word);

	while (index !== -1) {
	  var slicedTilLowPic = stringImageData.slice(stringImageData.indexOf(word)+11);
	  var imageURL = getFeaturesUrl(slicedTilLowPic);

	  imagesUrlArray.push(imageURL);

	  index = slicedTilGallery.indexOf(word, index + 1);
	}
	return imagesUrlArray
};

// Fill attributes into product
		 Biblioteca_EnriquecimentoExterno.fillProducts(attributesAndParameters, node, data, lookUpTable, skuReferenceType);
// Creates entity based on the Brand attributes
		var entity = Biblioteca_EnriquecimentoExterno.createBrandEntity(entityParent,entityObjType, data, manager);
// Creates the reference between the product and it's respective entity (brand)
		Biblioteca_EnriquecimentoExterno.createProduct2EntityReference(node, entity, productToEntityRT, manager, skuReferenceType);
// Downloads and creates Assets for product and brand
		Biblioteca_EnriquecimentoExterno.downloadAndCreateAssets(entity, node, assetParent, assetObjTypeLogo, assetObjTypePI, assetObjType, data, assetDownloadHome, manager, getAllProductImagesFromGallery);
// Creates referecens between products and assets, entities and assets
		Biblioteca_EnriquecimentoExterno.createImageReferences(node, entity, productToImageRT, entityLogoRT, manager, getAllProductImagesFromGallery, data, skuReferenceType);


// The functions below serve to get the specific features of each products and fill the respective attributes, also treats ID's
var stringData = data;
function getFeaturesAttributes(slicedTilFeatures) {

	var slicedTilFirstValue = slicedTilFeatures.slice(slicedTilFeatures.indexOf('"Value":')+9);
	var endValueString = slicedTilFirstValue.indexOf('"');
	var featureValue = slicedTilFirstValue.substring(slicedTilFirstValue, endValueString);
		
	var slicedTilAttributeName = slicedTilFirstValue.slice(slicedTilFirstValue.indexOf('"Value":')+9);
	stringData = slicedTilAttributeName;
	var endAttributeNameString = slicedTilAttributeName.indexOf('"');
	var attributeNameValue = slicedTilAttributeName.substring(0, endAttributeNameString);

	return { attributeName: attributeNameValue, featureValue: featureValue };

};

function treatIDString(id) {
			var string = id.replace(/[^0-9a-zA-Z]/g, ' ');
			var words = string.split(' ');

			words = words.map((word) => {
    				return word.charAt(0).toUpperCase() + word.slice(1);
    			});
 	 		// Join the words together without spaces
  			return words.join('');
};

function getHowManyAttributes(data) {
	var slicedTilFeaturesGroups = data.slice(data.indexOf('"FeaturesGroups":')+17);
	var word = '"Localized":';
	var count = 0;
	var index = slicedTilFeaturesGroups.indexOf(word);

	var featuresDataArray = [];

	while (index !== -1) {
	  var slicedTilFeatures = stringData.slice(stringData.indexOf(word)+11);
	  var result = getFeaturesAttributes(slicedTilFeatures);

       featuresDataArray.push(result.attributeName);
       featuresDataArray.push(result.featureValue);
	  
	  count++;
	  index = slicedTilFeaturesGroups.indexOf(word, index + 1);
	}

	return featuresDataArray;
	
};

function getFeaturesIntoProduct(featuresDataArray){
	for (i in featuresDataArray){
		if(i % 2 == 0){
			// treating attribute names
			var treatedID = treatIDString(featuresDataArray[i]);

			var key = parseInt(i) + 1;

			try {
			    var attributeToSearch = String(lookUpTable.getLookupTableValue("DeParaEnriquecimento", treatedID));
				if(Biblioteca_EnriquecimentoExterno.getObjectType(node) == "ItemVenda"){
					var goldenRecord = Biblioteca_EnriquecimentoExterno.getGoldenRecord(node, skuReferenceType);
					goldenRecord.getValue(attributeToSearch).setValue(featuresDataArray[key]);
				} else {
					node.getValue(attributeToSearch).setValue(featuresDataArray[key]);
				} node.getValue(attributeToSearch).setValue(featuresDataArray[key]);
			} catch (IllegalArgumentException) {

			    logger.info("Não tem o attributo " + treatedID);
			    continue; // Continue with the next iteration of the loop
			}	
		} 
	};
};


getFeaturesIntoProduct(getHowManyAttributes(data));
