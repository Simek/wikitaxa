const axios = require('axios');

const MAX_RESULTS = 10;

const httpClient = axios.create();

const req = (url, parseData) => {
	return httpClient
		.get(url)
		.then(response => {
			const finalData = parseData(response.data);
			return finalData.length === 1 ? finalData[0] : finalData;
		})
		.catch(e => {
			if (e.response && e.response.status && e.response.status !== 404) {
				console.warn(e.response.status, e.config.url);
			}
			return undefined;
		});
};

//#region Sources

const getINaturalist = q => {
	return req(
		`https://api.inaturalist.org/v1/taxa/autocomplete?q=${q}&locale=en-US`,
		data => {
			if (data.results.length) {
				return data.results.map(sp => ({
					id: sp.id,
					name: sp.name,
					rank: sp.rank,
					extinct: sp.extinct
				}));
			}
		}
	);
};

const getGBIF = q => {
	return req(
		`http://api.gbif.org/v1/species?name=${q}`,
		data => {
			if (data.results.length) {
				return data.results.map(sp => ({
					id: sp.key,
					name: sp[sp.rank ? sp.rank.toLocaleLowerCase() : 'canonicalName'],
					rank: sp.rank,
					authorship: sp.authorship
				}));
			}
		}
	);
};

const getTropicos = q => {
	return req(
		`http://www.tropicos.org/Ajax/NameFastLookup.aspx?type=NameFastLookupEX&text=${q}&returnCount=${MAX_RESULTS}`,
		data => {
			if (data.length) {
				return data.map(sp => ({
					id: sp.nameID,
					name: sp.displayName
				}));
			}
		}
	);
};

const getEOL = q => {
	return req(
		`https://eol.org/autocomplete/${q}`,
		data => {
			if (data.length) {
				return data.map(sp => ({
					id: sp.id,
					name: sp.name
				}));
			}
		}
	);
};

const getCITES = q => {
	return req(
		`https://speciesplus.net/api/v1/auto_complete_taxon_concepts?taxonomy=cites_eu&taxon_concept_query=${q.replace('%20', '+')}`,
		data => {
			const finalData = data.auto_complete_taxon_concepts;
			if (finalData && finalData.length) {
				return finalData.map(sp => ({
					id: sp.id,
					name: sp.full_name,
					rank: sp.rank_name
				}));
			}
		}
	);
};

const getEBird = q => {
	return req(
		`https://api.ebird.org/v2/ref/taxon/find?locale=en_US&cat=species&key=jfekjedvescr&q=${q}`,
		data => {
			if (data.length) {
				return data.map(sp => ({
					id: sp.code,
					name: sp.name
				}));
			}
		}
	);
};

const getBritannica = q => {
	return req(
		`https://www.britannica.com/search/ajax/autocomplete?query=${q}&nb=${MAX_RESULTS}`,
		data => {
			if (data.length) {
				return data.map(sp => ({
					id: sp.url.slice(1),
					name: sp.title,
					rank: sp.identifier
				}));
			}
		}
	);
};

const getFoA = q => {
	return req(
		`https://profiles.ala.org.au/profile/search?includeNameAttributes=true&matchAll=true&nameOnly=false&offset=0&opusId=foa&pageSize=${MAX_RESULTS}&term=${decodeURI(q)}`,
		data => {
			const { items } = data;
			if (items && items.length) {
				const finalItems = items.filter(i => i.scientificName.includes(decodeURI(q)));
				if (finalItems.length) {
					return finalItems.map(sp => ({
						id: sp.scientificName,
						name: sp.scientificName,
						rank: sp.rank,
						authorship: sp.nameAuthor
					}));
				}
			}
		}
	);
};

const getVASCAN = q => {
	return req(
		`http://data.canadensys.net/vascan/api/0.1/search.json?q=${decodeURI(q)}&t=taxon`,
		data => {
			const { results } = data;
			if (results && results[0] && results[0].matches) {
				return results[0].matches.map(sp => ({
					id: sp.taxonID,
					name: sp.canonicalName,
					rank: sp.taxonRank,
					authorship: sp.scientificNameAuthorship
				}));
			}
		}
	);
};

const getLoB = q => {
	return req(
		`https://projects.biodiversity.be/lepidoptera/search_autocomplete/${q}`,
		data => {
			if (data.length) {
				return data.map(sp => {
					const urlChunks = sp.url.split('/');
					return {
						id: urlChunks[urlChunks.length - 2],
						name: sp.value,
						rank: sp.suggest_type
					}
				});
			}
		}
	);
};

const getZooBank = q => {
	return req(
		`http://zoobank.org/NomenclaturalActs.json/${decodeURI(q).replace(' ', '_')}`,
		data => {
			if (data.length) {
				return data.map(sp => ({
					id: sp.tnuuuid.toUpperCase(),
					name: sp.cleanprotonym,
					rank: sp.rankgroup
				}));
			}
		}
	);
};

const getEPPO = q => {
	return req(
		`https://gd.eppo.int/ajax/search?k=${q}&s=1&m=1&t=0&l=&_=${new Date().getTime() + 36000}`,
		data => {
			if (data.length) {
				return data.map(sp => ({
					id: sp.i,
					name: sp.e,
					rank: sp.f
				}));
			}
		}
	);
};

const getPotW = q => {
	return req(
		`http://www.plantsoftheworldonline.org/api/1/search?q=${q}`,
		data => {
			const { results } = data;
			if (results && results.length) {
				return results.map(sp => ({
					id: sp.fqId,
					name: sp.name
				}));
			}
		}
	);
};

const getIRMNG = q => {
	return req(
		`http://www.irmng.org/rest/IRMNG_IDByName/${q}`,
		data => {
			if (data && data > 0) {
				return req(
					`http://www.irmng.org/rest/AphiaRecordByIRMNG_ID/${data}`,
					taxonData => {
						return {
							id: taxonData.IRMNG_ID,
							name: taxonData.scientificname,
							rank: taxonData.rank,
							authorship: taxonData.valid_authority || taxonData.authority,
							status: taxonData.status
						};
					}
				);
			}
		});
};

const getWoRMS = q => {
	return req(
		`http://www.marinespecies.org/aphia.php?p=rest&__route__/AjaxAphiaRecordsByNamePart/${q}&rank_min=10&combine_vernaculars=0&fossil_id=4&value_raw=${q}`,
		data => {
			if (data && data.length) {
				return data.map(sp => ({
					id: sp.id,
					name: sp.displayname,
					authority: sp.authority
				}));
			}
		}
	);
};

const getTAXREF = q => {
	return req(
		`https://inpn.mnhn.fr/inpn-web-services/autocomplete/especes/recherche?texte=${q}&max_resultats=${MAX_RESULTS}`,
		data => {
			const finalData = data.response.docs.filter(sp => sp.lb_nom_valide === decodeURI(q));
			if (finalData.length) {
				return finalData.map(sp => ({
					id: sp.cd_ref,
					name: sp.lb_nom_valide,
					authorship: sp.lb_auteur_valide
				}));
			}
		}
	);
};

const getITIS = q => {
	return req(
		`https://www.itis.gov/ITISWebService/jsonservice/searchByScientificName?srchKey=${q}`,
		data => {
			if (data.scientificNames && data.scientificNames[0]) {
				return data.scientificNames.map(sp => ({
					id: sp.tsn,
					name: sp.combinedName,
					authorship: sp.author
				}));
			}
		}
	);
};

const getNLSR = q => {
	return axios
		.post(
			`https://www.nederlandsesoorten.nl/linnaeus_ng/app/views/search/nsr_ajax_interface.php`,
			`action=name_suggestions&search=${q}&time=${new Date().getTime() + 36000}`
		)
		.then(response => {
			if (response.data && response.data.length) {
				return response.data.map(sp => ({
					id: sp.id,
					name: sp.nomen,
					rank: sp.label
				}));
			}
		})
		.catch(e => console.warn(e));
};

const getIPNI = q => {
	return req(
		`https://www.ipni.org/api/1/search?q=${q}`,
		data => {
			if (data.results && data.results.length) {
				return data.results.map(sp => ({
					id: sp.id,
					name: sp.name,
					authorship: sp.authors,
					rank: sp.rank
				}));
			}
		}
	);
};

const getEBio = q => {
	return req(
		`https://elurikkus.ee/biocache-service/occurrences/search.json?q=${q}`,
		data => {
			if (data.occurrences && data.occurrences.length) {
				return [...new Set(data.occurrences.map(sp => ({
					id: sp.taxonConceptID,
					name: sp.scientificName,
					rank: sp.taxonRank
				})))];
			}
		}
	);
};

//#endregion

const QUEUE = [
	getINaturalist, getGBIF, getEOL, getIRMNG, getWoRMS, getTAXREF,
	getITIS, getTropicos, getEPPO, getPotW, getNLSR, getZooBank,
	getCITES, getEBird, getLoB, getBritannica, getFoA, getVASCAN,
	getIPNI, getEBio
];

exports.performSearch = (query, encode = true) => {
	const q = encode ? encodeURI(query) : query;
	if (q) {
		return axios.all(QUEUE.map(fn => fn(query))).then(axios.spread((
			inat, gbif, eol, irmng, worms, taxref, itis, topricos, eppo,
			potw, nlsr, zoo, cities, ebird, lob, brit, foa, vascan, ipni, ebio
		) => ({
			inat, gbif, eol, irmng, worms, taxref, itis, topricos, eppo,
			potw, nlsr, zoo, cities, ebird, lob, brit, foa, vascan, ipni, ebio
		})));
	} else {
		return undefined;
	}
};

exports.getWikidata = async q => {
	return req(
		`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${q}&format=json&language=en&uselang=en&type=item`,
		data => {
			if (data.search.length) {
				return data.search.map(sp => ({
					id: sp.id,
					label: sp.label,
					description: sp.description,
					url: sp.concepturi.replace('http:', 'https:')
				}));
			}
		}
	);
};

exports.getWikipedia = async q => {
	return req(
		`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&formatversion=2&search=${q}&namespace=0&limit=${MAX_RESULTS}&suggest=true`,
		data => {
			if (data.length && data[1].length) {
				return data[1].map((label, i) => ({
					label: label,
					description: data[2][i],
					url: data[3][i]
				}));
			}
		}
	);
};

exports.getWikispecies = async q => {
	return req(
		`https://species.wikimedia.org/w/api.php?action=opensearch&format=json&formatversion=2&search=${q}&namespace=0&limit=${MAX_RESULTS}&suggest=true`,
		data => {
			if (data.length && data[1].length) {
				return data[1].map((label, i) => ({
					label: label,
					description: data[2][i],
					url: data[3][i]
				}));
			}
		}
	);
};

exports.sourcesCount = QUEUE.length;
