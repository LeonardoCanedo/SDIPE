
/* BIBLIOTECA */

// Define a function called "consultGEIP" that takes a GTIN parameter
function consultGEIP(GTIN, GIEP) {
  // Set the username, API key, and language to use for the API call
  const username = 'LeonardoCanedo'; //insert your username
  const apiKey = ''; //insert your api key
  const language = 'pt'; //en
  // Create a new HTTP GET object using the GIEP gateway
  var httpGet = GIEP.get();
  // Create a new HashMap object to store the API call parameters
  var mapParam = new java.util.HashMap();
  // Set the API call parameters using the previously defined variables
  mapParam.put("UserName", username);
  mapParam.put("language", language);
  mapParam.put("GTIN", GTIN);
  mapParam.put("Key", apiKey);

  httpGet.pathQuery(mapParam);   
  // Make the API call using the previously defined parameters
  try {
    var response = httpGet.invoke();
    return response;
  } catch (e) {
	if(e.javaException.getHttpStatusCode() == "400"|| e.javaException.getHttpStatusCode() == 400){
		var errorString = "Gtin "+ GTIN +" não encontrado.";
		return errorString	
	} else if (e.javaException.getHttpStatusCode() == "404"|| e.javaException.getHttpStatusCode() == 404){
		var errorString = "Gtin " + GTIN + " não está presente no banco de dados do bureal de dados";
		return errorString
	} else if (e.javaException.getHttpStatusCode() == "403"|| e.javaException.getHttpStatusCode() == 403){
		var errorString = "Gtin " + GTIN + " conteúdo apenas para full";
		return errorString
	}
    // If an error occurs, log the error message and return null
    if (e.javaException instanceof com.stibo.gateway.rest.RESTGatewayException) {
      logger.info("HTTP status code: " + e.javaException.getHttpStatusCode());
      logger.info("Error: " + e.javaException.getMessage());
      return null;
    } else {
      throw (e);
    }
  }
};

// Function that treats IDs
function treatIDString(id) {
	var string = id.replace(/[^0-9a-zA-Z]/g, ' ');
	var words = string.split(' ');

	words = words.map((word) => {
			return word.charAt(0).toUpperCase() + word.slice(1);
		});
	  // Join the words together without spaces
	  return words.join('');
};

// Returns the Golden Record (deduplicated product)
function getGoldenRecord (objeto, skuReferenceType) {

    var references = objeto.queryReferencedBy(skuReferenceType);
    var retorno = false;

    //manipulação das referencias
    references.forEach( function ( nodes ) {
        retorno = nodes.getSource();
        return true;
    });

    return retorno;
};

// Returns object type ID
function getObjectType (node) {
	return node.getObjectType().getID() + "";
};

// Function to get the attribute values from string 
function getAttributeValuesFromString(parameter, data){
	// parameter = '"Brand":'
	var slicedString = data.slice(data.indexOf(parameter) + parameter.length + 1);
	var endString = slicedString.indexOf('"');
	var value = slicedString.substring(0, endString);

	logger.info(value);
	return value;
};

// Function to fill the products based on the array of attributes and parameters
function fillProducts (attributesAndParameters, node, data, lookUpTable, skuReferenceType) {
	var retorno = ""
	for (var key in attributesAndParameters) {
		//key = 'Title', attributesAndPaths[key] = "Title":
		
		var attributeToSearch = String(lookUpTable.getLookupTableValue("DeParaEnriquecimento", key));	
			
		if(getObjectType(node) == "ItemVenda"){
			var goldenRecord = getGoldenRecord(node, skuReferenceType);
			retorno += key + " ~ " + attributesAndParameters[key] + " ~ " + getAttributeValuesFromString(attributesAndParameters[key], data)
			goldenRecord.getValue(attributeToSearch).setValue(getAttributeValuesFromString(attributesAndParameters[key], data));
		} else {
			retorno += key + " ~ " + attributesAndParameters[key] + " ~ " + getAttributeValuesFromString(attributesAndParameters[key], data)
			node.getValue(attributeToSearch).setValue(getAttributeValuesFromString(attributesAndParameters[key], data));	
		} node.getValue(attributeToSearch).setValue(getAttributeValuesFromString(attributesAndParameters[key], data));	
	} 
};

// Function that creates a new entity based on the json data returned and fills the respective brands attributes
function createBrandEntity (entityParent, entityObjType, data, manager){
	var entityId = getAttributeValuesFromString('"Brand":', data) + getAttributeValuesFromString('"BrandID":', data);
	var entity = manager.getEntityHome().getEntityByID(entityId);
	if (entity == null) {
		var newEntity = entityParent.createEntity(entityId, entityObjType);
		
		newEntity.setName(getAttributeValuesFromString('"Brand":', data));
		newEntity.getValue("ATR_Marca").setValue(getAttributeValuesFromString('"Brand":', data));
		newEntity.getValue("ATR_LinkLogoMarca").setValue(getAttributeValuesFromString('"BrandLogo":', data));
		newEntity.getValue("ATR_IDMarca").setValue(getAttributeValuesFromString('"BrandID":', data));

		return newEntity;
	} else {
		entity.setName(getAttributeValuesFromString('"Brand":', data));
		entity.getValue("ATR_Marca").setValue(getAttributeValuesFromString('"Brand":', data));
		entity.getValue("ATR_LinkLogoMarca").setValue(getAttributeValuesFromString('"BrandLogo":', data));
		entity.getValue("ATR_IDMarca").setValue(getAttributeValuesFromString('"BrandID":', data));

		return entity;
	}
};

// Function that downloads assets from url and put it available on the hierarchy
function downloadAndCreateAssets (entity, node, assetParent, assetObjTypeLogo, assetObjTypePI, assetObjType, data, assetDownloadHome, manager, getAllProductImagesFromGallery) {
	var productImageUrl = node.getValue("ATR_FotoThumb").getSimpleValue();

	var entityImageUrl = entity.getValue("ATR_LinkLogoMarca").getSimpleValue();

	var assetPIId = node.getID() + "FotoThumb";
	var assetLogoId = entity.getID() + "LogoMarca";

	var galleryImagesArray = getAllProductImagesFromGallery(data);

	var thumb = manager.getAssetHome().getAssetByID(assetPIId);
	var logo = manager.getAssetHome().getAssetByID(assetLogoId);
	
	if (thumb == null && logo == null) {
		var newAssetPI = assetParent.createAsset​(assetPIId, assetObjTypePI);
		assetDownloadHome.downloadAssetContent(newAssetPI, new java.net.URL(productImageUrl));

		var newAssetLogo = assetParent.createAsset​(assetLogoId, assetObjTypeLogo);
		assetDownloadHome.downloadAssetContent(newAssetLogo, new java.net.URL(entityImageUrl));

		for(i in galleryImagesArray){
			var imageId = node.getID()+i;
			var imageUrl = galleryImagesArray[i];
	
			var newAssetPI = assetParent.createAsset​(imageId, assetObjType);
			assetDownloadHome.downloadAssetContent(newAssetPI, new java.net.URL(imageUrl));
		};
	} else if (thumb == null && logo != null){
		var newAssetPI = assetParent.createAsset​(assetPIId, assetObjTypePI);
		assetDownloadHome.downloadAssetContent(newAssetPI, new java.net.URL(productImageUrl));

		for(i in galleryImagesArray){
			var imageId = node.getID()+i;
			var imageUrl = galleryImagesArray[i];
	
			var newAssetPI = assetParent.createAsset​(imageId, assetObjType);
			assetDownloadHome.downloadAssetContent(newAssetPI, new java.net.URL(imageUrl));
	}
}};

// Function that creates references to the respectives assets for the product and brand
function createImageReferences (node, entity, productToImageRT, entityLogoRT, manager, getAllProductImagesFromGallery, data, skuReferenceType) {
	var productAssetId = node.getID() + "FotoThumb";
	var entityAssetId = entity.getID() + "LogoMarca";

	var galleryImagesArray = getAllProductImagesFromGallery(data);
	
	var productAsset = manager.getAssetHome().getAssetByID(productAssetId);
	var entityAsset = manager.getAssetHome().getAssetByID(entityAssetId);

	try {
		for(i in galleryImagesArray) {
			var assetId = node.getID()+i;
			var asset = manager.getAssetHome().getAssetByID(assetId);

			if(getObjectType(node) == "ItemVenda"){
				try{
				var goldenRecord = getGoldenRecord(node, skuReferenceType);
				goldenRecord.createReference(asset, productToImageRT);	
				}catch(e) {
					logger.info("Golden Record já referenciado")
				}
				
			} else {
				node.createReference(asset, productToImageRT);	
			} node.createReference(asset, productToImageRT);	
		}
	} catch(e) {
		var assetId = node.getID()+i;
		var asset = manager.getAssetHome().getAssetByID(assetId);
		}

	try {
		if(getObjectType(node) == "ItemVenda"){
			try{
				var goldenRecord = getGoldenRecord(node, skuReferenceType);
				goldenRecord.createReference(productAsset, productToImageRT);
			}catch(e){
				logger.info("Golden Record já referenciado")
			}
		} else {
			node.createReference(productAsset, productToImageRT);
		} node.createReference(productAsset, productToImageRT);
	} catch (e) {logger.info("Thumb já está referenciada")};

	try {
		entity.createReference(entityAsset, entityLogoRT);
		} catch(e) {logger.info("Entidade já tem logo referênciada")};
		
};

function createProduct2EntityReference(node, entity, productToEntityRT, manager, skuReferenceType) {
	try {
		if(getObjectType(node) == "ItemVenda"){
			var goldenRecord = getGoldenRecord(node, skuReferenceType);
			goldenRecord.createReference(manager.getEntityHome().getEntityByID(entity.getID()), productToEntityRT);	
		} else {
			node.createReference(manager.getEntityHome().getEntityByID(entity.getID()), productToEntityRT);
		}
		
		node.createReference(manager.getEntityHome().getEntityByID(entity.getID()), productToEntityRT);
	} catch (e) {
		// if it gets here is because the entity is already created and referenced.
	};
};



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