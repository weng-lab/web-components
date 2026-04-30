import { Alphabets } from '../types';

const sequencesToPFM = (
  alphabet: Alphabets[],
  symbolMap: Record<string, number>,
  sequences: string[]
) => {
  const r: number[][] = [];
  const maxLength = Math.max(...sequences.map((s: string) => s.length));
  for (let i = 0; i < maxLength; ++i) {
    r.push(alphabet.map(_ => 0));
  }
  sequences.forEach((sequence: string) => {
    for (let i = 0; i < sequence.length; ++i) {
      if (symbolMap[sequence[i]] !== undefined) {
        ++r[i][symbolMap[sequence[i]]];
      }
    }
  });
  return {
    count: sequences.length,
    pfm: r,
  };
};

export const parseFASTA = (alphabet: Alphabets[], sequence: string) => {
  const symbolMap: Record<string, number> = {},
    sequences: string[] = [];
  alphabet.forEach((symbol: Alphabets, i: number) => {
    symbol.regex.forEach(rg => {
      symbolMap[rg] = i;
    });
  });
  sequence.split('\n').forEach((line: string) => {
    if (line[0] === '>') sequences.push('');
    else sequences[sequences.length - 1] += line.trim();
  });
  return sequencesToPFM(alphabet, symbolMap, sequences);
};

export const parseSequences = (alphabet: Alphabets[], sequence: string) => {
  const symbolMap: Record<string, number> = {};
  alphabet.forEach((symbol: Alphabets, i: number) => {
    symbol.regex.forEach(rg => {
      symbolMap[rg] = i;
    });
  });
  return sequencesToPFM(
    alphabet,
    symbolMap,
    sequence.split('\n').map((x: string) => x.trim())
  );
};
