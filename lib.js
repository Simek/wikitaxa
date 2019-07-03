const axios = require('axios');

const httpClient = axios.create();

const req = (url, parseData) => {
	return httpClient
		.get(url)
		.then(response => {
			const finalData = parseData(response);
			return finalData.length === 1 ? finalData[0] : finalData;
		})
		.catch(e => {
			// console.warn(e.response.status, e.config.url);
			return undefined;
		});
};

//#region Sources

const getINaturalist = q => {
	return req(
		`https://api.inaturalist.org/v1/taxa/autocomplete?q=${q}&locale=en-US`,
		response => {
			if (response.data.length) {
				return response.data.results.map(sp => `${sp.id} - ${sp.name} - ${sp.rank} ${sp.extinct ? '†' : ''}`);
			}
		}
	);
};

const getGBIF = q => {
	return req(
		`http://api.gbif.org/v1/species?name=${q}`,
		response => {
			if (response.data.results.length) {
				return response.data.results.map(sp => ({
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
		`http://www.tropicos.org/Ajax/NameFastLookup.aspx?type=NameFastLookupEX&text=${q}&returnCount=5`,
		response => {
			if (response.data.length) {
				return response.data.map(sp => ({
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
		response => {
			if (response.data.length) {
				return response.data.map(sp => ({
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
		response => {
			const data = response.data.auto_complete_taxon_concepts;
			if (data && data.length) {
				return data.map(sp => ({
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
		response => {
			if (response.data.length) {
				return response.data.map(sp => ({
					id: sp.code,
					name: sp.name
				}));
			}
		}
	);
};

const getBritannica = q => {
	return req(
		`https://www.britannica.com/search/ajax/autocomplete?query=${q}&nb=5`,
		response => {
			if (response.data.length) {
				return response.data.map(sp => ({
					id: sp.url,
					name: sp.title,
					rank: sp.identifier
				}));
			}
		}
	);
};

const getFoA = q => {
	return req(
		`https://profiles.ala.org.au/profile/search?includeNameAttributes=true&matchAll=true&nameOnly=false&offset=0&opusId=foa&pageSize=25&term=${decodeURI(q)}`,
		response => {
			const { items } = response.data;
			if (items && items) {
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
		response => {
			const { results } = response.data;
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
		response => {
			if (response.data.length) {
				return response.data.map(sp => {
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
		response => {
			if (response.data.length) {
				return response.data.map(sp => ({
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
		`https://gd.eppo.int/ajax/search?k=${q}%20&s=1&m=1&t=0&l=&_=${new Date().getTime() + 36000}`,
		response => {
			if (response.data.length) {
				return response.data.map(sp => ({
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
		response => {
			const { results } = response.data;
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
		response => {
			if (response.data && response.data > 0) {
				return req(
					`http://www.irmng.org/rest/AphiaRecordByIRMNG_ID/${response.data}`,
					responseT => {
						const data = responseT.data;
						return {
							id: data.IRMNG_ID,
							name: data.scientificname,
							rank: data.rank,
							authorship: data.valid_authority || data.authority
						};
					}
				);
			}
		});
};

const getWoRMS = q => {
	return req(
		`http://www.marinespecies.org/aphia.php?p=rest&__route__/AjaxAphiaRecordsByNamePart/${q}&rank_min=10&combine_vernaculars=0&fossil_id=4&value_raw=${q}`,
		response => {
			if (response.data) {
				return response.data.map(sp => ({
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
		`https://inpn.mnhn.fr/inpn-web-services/autocomplete/especes/recherche?texte=${q}&max_resultats=10`,
		response => {
			const finalData = response.data.response.docs.filter(sp => sp.lb_nom_valide === decodeURI(q));
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
		response => {
			if (response.data.scientificNames && response.data.scientificNames[0]) {
				return response.data.scientificNames.map(sp => ({
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

//#endregion

exports.performSearch = (query, encode = true) => {
	const q = encode ? encodeURI(query) : query;
	if (q) {
		const queue = [
			getINaturalist, getGBIF, getEOL, getIRMNG, getWoRMS, getTAXREF,
			getITIS, getTropicos, getEPPO, getPotW, getNLSR, getZooBank,
			getCITES, getEBird, getLoB, getBritannica, getFoA, getVASCAN
		];
		return axios.all(queue.map(fn => fn(query))).then(axios.spread(
			(inat, gbif, eol, irmng, worms, taxref, itis, topricos, eppo, potw, nlsr, zoo, cities, ebird, lob, brit, foa, vascan) => ({
				inat, gbif, eol, irmng, worms, taxref, itis, topricos, eppo, potw, nlsr, zoo, cities, ebird, lob, brit, foa, vascan
			})
		));
	} else {
		return undefined;
	}
};
