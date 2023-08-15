# SDIPE
Simplifying Data Integration and Product Enhancement

# Tool Objective and Summary

The main objective of SDIPE is to generate value for content production and deliver a technical solution that requires minimal input while providing significant business value to the domain. This tool functions by gathering essential data (product's GTIN) and enriching the target product's content. This enrichment includes attributes and their values, images, automated creation of a brand entity, and necessary references for images and brand. Through integration or manual user input of required data, the tool consumes an API from a data bureau (https://icecat.biz), which returns standardized product technical specifications. Prior to becoming available in the data bureau's API, all information undergoes expert analysis and continuous updates, ensuring quality and security. After obtaining all available product specification data, the tool processes the information and automatically populates attributes.

This tool was developed for internal use within a system, in this practical case, it was a Master Data Management system known as STEP.

The challenge in building this tool stemmed from the native system (STEP) not being able to interpret the returned JSON objects. As a result, an extensive string manipulation algorithm had to be created. While a more efficient approach using Node.js could have been employed, the system only supports vanilla JavaScript, necessitating the chosen solution.
