import { http, HttpResponse } from "msw";

const WENGLAB = "https://screen.api.wenglab.org/graphql";
const NLM = "https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search";

type GqlBody = { query: string; variables: Record<string, any> };

const GENES = [
  { id: "ENSG00000181449.3", name: "SOX2", coordinates: { chromosome: "chr3", start: 181711925, end: 181714436 } },
  { id: "ENSG00000164362.21", name: "SOX21", coordinates: { chromosome: "chr13", start: 94713176, end: 94715285 } },
];
const SNPS = [{ id: "rs11549465", coordinates: { chromosome: "chr14", start: 62162224, end: 62162225 } }];
const CCRES = [
  { accession: "EH38E1310153", isiCRE: false, coordinates: { chromosome: "chr3", start: 181711000, end: 181712000 } },
];
const ICRES = [
  {
    rdhs: "EH38D3951234",
    accession: "EH38E3951234",
    celltypes: ["K562", "GM12878"],
    coordinates: { chromosome: "chr3", start: 181711000, end: 181712000 },
  },
];
const STUDIES = [
  {
    studyid: "GCST004988",
    author: "Michailidou K",
    disease_trait: "Breast cancer",
    has_enrichment_info: true,
    population: "European",
    parent_terms: ["cancer"],
    total_ld_blocks: 150,
    ld_blocks_overlapping_ccres: 120,
    overlapping_ccres: 340,
  },
];

const startsWith = (prefix: unknown, value: string) => {
  const p = Array.isArray(prefix) ? prefix[0] : prefix;
  return typeof p === "string" && value.toLowerCase().startsWith(p.toLowerCase());
};

export const genomeSearchHandlers = [
  http.post(WENGLAB, async ({ request }) => {
    const { query, variables } = (await request.json()) as GqlBody;

    if (query.includes("query Genes")) {
      const matches = GENES.filter((g) => startsWith(variables.name_prefix, g.name)).slice(0, variables.limit ?? 3);
      return HttpResponse.json({ data: { gene: matches } });
    }
    if (query.includes("snpAutocompleteQuery")) {
      const matches = SNPS.filter((s) => startsWith(variables.snpid, s.id)).slice(0, variables.limit ?? 3);
      return HttpResponse.json({ data: { snpAutocompleteQuery: matches } });
    }
    if (query.includes("cCREAutocompleteQuery")) {
      const matches = CCRES.filter((c) => startsWith(variables.accession_prefix, c.accession)).slice(
        0,
        variables.limit ?? 3
      );
      return HttpResponse.json({ data: { cCREAutocompleteQuery: matches } });
    }
    if (query.includes("iCREQuery")) {
      const matches = ICRES.filter((i) => startsWith(variables.accession_prefix, i.accession)).slice(
        0,
        variables.limit ?? 3
      );
      return HttpResponse.json({ data: { iCREQuery: matches } });
    }
    if (query.includes("getv2v3CcreMapping")) {
      return HttpResponse.json({ data: { ccreMappings: [] } });
    }
    if (query.includes("getGWASStudyMetadata")) {
      const matches = STUDIES.filter((s) => startsWith(variables.studyname_prefix, s.disease_trait)).slice(
        0,
        variables.limit ?? 3
      );
      return HttpResponse.json({ data: { getGWASStudiesMetadata: matches } });
    }
    return HttpResponse.json({ errors: [{ message: "Unmocked query" }] }, { status: 400 });
  }),

  // Response shape: [total, ids, extra, rows] where row[3]=symbol, row[4]=description
  http.get(NLM, ({ request }) => {
    const term = new URL(request.url).searchParams.get("terms") ?? "";
    return HttpResponse.json([1, [], null, [["", "", "", term, `${term} description`]]]);
  }),
];
