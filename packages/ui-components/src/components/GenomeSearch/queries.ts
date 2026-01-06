import { GeneResponse, GenomeSearchProps } from "./types";

export const SNP_AUTOCOMPLETE_QUERY = `
  query suggestions($assembly: String!, $snpid: String!) {
      snpAutocompleteQuery(assembly: $assembly, snpid: $snpid) {
          id
          coordinates {
              chromosome
              start
              end
          }
      }
  }
`;

export const GENE_AUTOCOMPLETE_QUERY = `
  query Genes(
      $id: [String]
      $name: [String]
      $strand: String
      $chromosome: String
      $start: Int
      $end: Int
      $gene_type: String
      $havana_id: String
      $name_prefix: [String!]
      $limit: Int
      $assembly: String!
      $version: Int
  ) {
      gene(
          id: $id
          name: $name
          strand: $strand
          chromosome: $chromosome
          start: $start
          end: $end
          gene_type: $gene_type
          havana_id: $havana_id
          name_prefix: $name_prefix
          limit: $limit
          assembly: $assembly
          orderby: "name"
          version: $version
      ) {
          id
          name
          coordinates {
              chromosome
              start
              end
          }
      }
  }
`;

export const ICRE_AUTOCOMPLETE_QUERY = `
  query iCREQuery($accession_prefix: [String!], $limit: Int) {
      iCREQuery(accession_prefix: $accession_prefix, limit: $limit) {
          rdhs
          accession
          celltypes
          coordinates {
              start
              end
              chromosome
          }
      }
  }
`;

export const CCRE_AUTOCOMPLETE_QUERY = `
  query cCREAutocompleteQuery(
    $accession_prefix: [String!]
    $assembly: String!
    $includeiCREs: Boolean
    $limit: Int
  ) {
    cCREAutocompleteQuery(
      includeiCREs: $includeiCREs
      assembly: $assembly
      limit: $limit
      accession_prefix: $accession_prefix
    ) {
      accession
      isiCRE
      coordinates {
        chromosome
        start
        end
      }
    }
  }
`;

export const GWAS_AUTOCOMPLETE_QUERY = `
query getGWASStudyMetadata($studyid: [String], $limit: Int, $studyname_prefix: [String], $parent_terms: [String]){
    getGWASStudiesMetadata(studyid: $studyid, limit: $limit, parent_terms: $parent_terms, studyname_prefix: $studyname_prefix )
    {
        studyid
        author
        disease_trait
        has_enrichment_info
        population
        parent_terms
        total_ld_blocks
        ld_blocks_overlapping_ccres
        overlapping_ccres
    }
}
`;

export const getICREs = async (value: string, limit: number) => {
  const response = await fetch("https://screen.api.wenglab.org/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: ICRE_AUTOCOMPLETE_QUERY,
      variables: {
        accession_prefix: [value],
        limit: limit,
      },
    }),
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
};

export const getCCREs = async (value: string, assembly: GenomeSearchProps["assembly"], limit: number, showiCREFlag: boolean) => {
  const response = await fetch("https://screen.api.wenglab.org/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: CCRE_AUTOCOMPLETE_QUERY,
      variables: {
        accession_prefix: [value],
        assembly: assembly.toLowerCase(),
        limit: limit,
        includeiCREs: showiCREFlag,
      },
    }),
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
};

export const getGenes = async (
  value: string,
  assembly: GenomeSearchProps["assembly"],
  limit: number,
  geneVersions: GenomeSearchProps["geneVersion"]
) => {
  let versions = geneVersions
    ? typeof geneVersions === "number"
      ? [geneVersions]
      : geneVersions
    : [assembly === "GRCh38" ? 40 : 25];

  // sort versions from high to low (prioritize newest versions in map)
  versions = versions.sort((a, b) => b - a);

  // Fetch genes for all versions
  const versionResults = await Promise.all(
    versions.map((version) =>
      fetch("https://screen.api.wenglab.org/graphql", {
        method: "POST",
        body: JSON.stringify({
          query: GENE_AUTOCOMPLETE_QUERY,
          variables: {
            assembly: assembly.toLowerCase(),
            name_prefix: value,
            version: version,
            limit: limit,
          },
        }),
        headers: { "Content-Type": "application/json" },
      }).then((res) => res.json())
    )
  );

  // Combine and deduplicate results
  const geneMap = new Map<string, { gene: any; versions: { id: string; version: number }[] }>();

  versionResults.forEach((result, idx) => {
    const genes = result.data.gene || [];
    genes.forEach((gene: any) => {
      if (!geneMap.has(gene.name)) {
        geneMap.set(gene.name, { gene, versions: [{ id: gene.id, version: versions[idx] }] });
      } else {
        // if gene already exists, just add legacy versions to list.
        const existing = geneMap.get(gene.name)!;
        existing.versions.push({ id: gene.id, version: versions[idx] });
      }
    });
  });

  // Convert map to array and fetch descriptions
  const out = await Promise.all(
    Array.from(geneMap.values()).map(async ({ gene, versions }) => {
      const description = await getDescription(gene.name);
      return {
        ...gene,
        description: `${toTitleCase(description || gene.name)}`,
        versions,
      };
    })
  );

  return out;
};
const toTitleCase = (str: string) =>
  str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

async function getDescription(name: string): Promise<string | null> {
  const response = await fetch(
    "https://clinicaltables.nlm.nih.gov/api/ncbi_genes/v3/search?authenticity_token=&terms=" + name.toUpperCase()
  );
  const data = await response.json();
  const matches = data[3] && data[3].filter((x: string[]) => x[3] === name.toUpperCase());
  return matches && matches.length >= 1 ? matches[0][4] : null;
}

export const getSNPs = async (value: string, assembly: GenomeSearchProps["assembly"], limit: number) => {
  const response = await fetch("https://screen.api.wenglab.org/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: SNP_AUTOCOMPLETE_QUERY,
      variables: {
        assembly: assembly.toLowerCase(),
        snpid: value,
        limit: limit,
      },
    }),
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
};

export const getStudys = async (value: string, limit: number) => {
  const response = await fetch("https://screen.api.wenglab.org/graphql", {
    method: "POST",
    body: JSON.stringify({
      query: GWAS_AUTOCOMPLETE_QUERY,
      variables: {
        studyname_prefix: [value],
        limit,
      },
    }),
    headers: { "Content-Type": "application/json" },
  });

  return response.json();
};
