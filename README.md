# WikiTaxa

Fetch taxonomy reference data for Wikidata entry.

### Sources

Wikidata page related to taxonomic properties, databases section:
* [WikiProject Taxonomy Databases](https://www.wikidata.org/wiki/Wikidata:WikiProject_Taxonomy#Databases)

Taxon properties template (with listed databases): 
* [Template:Taxonomy properties](https://www.wikidata.org/wiki/Template:Taxonomy_properties)

## Usage

### REST

* ```/search/{q}``` – single taxon check
* ```/search/{q1},{q2}…``` – multiple taxon check
* ```/list``` – list all cached search results
* ```/purge/{q}``` – delete cached search result
* ```/status``` – databases access check

### CLI

* ```yarn cli {q}``` – single taxon check
* ```yarn cli {q1},{q2}…``` – multiple taxon check

### Development

* ```yarn start``` – run REST app at `localhost:5000` (with mocked Redis)

## Supported DBs

* CITES (CITES Species+ ID)
* EBio (eBiodiversity ID)
* EBird (eBird taxon ID)
* EPPO (EPPO Code)
* EOL (Encyclopedia of Life ID)
* FoA (Flora of Australia ID (new))
* GBIF (Global Biodiversity Information Facility ID)
* INaturalist (iNaturalist taxon ID)
* IPNI (International Plant Names Index ID)
* IRMNG (Interim Register of Marine and Nonmarine Genera ID)
* ITIS (Integrated Taxonomic Information System ID)
* LoB (Lepidoptera of Belgium ID)
* PotW (Plants of the World online ID)
* NLSR (Nederlands Soortenregister ID)
* TAXREF ID
* Tropicos ID
* VASCAN ID
* WoRMS (World Register of Marine Species ID)
* ZooBank ID

### Other supported references

* Britannica (Encyclopedia Britannica Online ID)
