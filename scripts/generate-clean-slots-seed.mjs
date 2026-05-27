import fs from 'node:fs';
import path from 'node:path';

const [, , sourcePath, outputPath] = process.argv;

const columns = [
  'id',
  'name',
  'provider',
  'image',
  'created_at',
  'rtp',
  'volatility',
  'reels',
  'max_win_multiplier',
  'min_bet',
  'max_bet',
  'features',
  'tags',
  'status',
  'is_featured',
  'sort_order',
  'updated_at',
  'created_by',
  'updated_by',
  'description',
  'release_date',
  'paylines',
  'theme',
  'confidence_score',
  'image_safety_status',
  'moderation_status',
  'release_year',
  'source_citations',
  'ai_extracted_at',
  'verified_at',
  'compliance_ok',
  'ingestion_version',
  'deleted_at',
  'twitch_safe',
];

if (!sourcePath || !outputPath) {
  console.error('Usage: node scripts/generate-clean-slots-seed.mjs <source.sql> <output.sql>');
  process.exit(1);
}

const input = fs.readFileSync(sourcePath, 'utf8');
const valuesIndex = input.indexOf('VALUES');

if (valuesIndex === -1) {
  console.error('Could not find a VALUES clause in the source SQL.');
  process.exit(1);
}

let index = valuesIndex + 'VALUES'.length;
let tupleCount = 0;
const rowsByName = new Map();
const batchSize = 500;

function skipWhitespace() {
  while (index < input.length && /\s/.test(input[index])) {
    index += 1;
  }
}

function readToken() {
  skipWhitespace();

  const start = index;
  let inString = false;
  let squareDepth = 0;
  let curlyDepth = 0;
  let innerParenDepth = 0;

  while (index < input.length) {
    const char = input[index];
    const next = input[index + 1];

    if (inString) {
      if (char === "'" && next === "'") {
        index += 2;
        continue;
      }

      if (char === "'") {
        inString = false;
      }

      index += 1;
      continue;
    }

    if (char === "'") {
      inString = true;
      index += 1;
      continue;
    }

    if (char === '[') {
      squareDepth += 1;
      index += 1;
      continue;
    }

    if (char === ']') {
      squareDepth -= 1;
      index += 1;
      continue;
    }

    if (char === '{') {
      curlyDepth += 1;
      index += 1;
      continue;
    }

    if (char === '}') {
      curlyDepth -= 1;
      index += 1;
      continue;
    }

    if (char === '(') {
      innerParenDepth += 1;
      index += 1;
      continue;
    }

    if (char === ')') {
      if (squareDepth === 0 && curlyDepth === 0 && innerParenDepth === 0) {
        return {
          token: input.slice(start, index).trim(),
          delimiter: ')',
        };
      }

      innerParenDepth -= 1;
      index += 1;
      continue;
    }

    if (char === ',' && squareDepth === 0 && curlyDepth === 0 && innerParenDepth === 0) {
      return {
        token: input.slice(start, index).trim(),
        delimiter: ',',
      };
    }

    index += 1;
  }

  throw new Error('Unexpected end of file while reading tuple token.');
}

function decodeSqlString(token) {
  if (!token || token === 'null') {
    return token;
  }

  if (token.startsWith("'") && token.endsWith("'")) {
    return token.slice(1, -1).replace(/''/g, "'");
  }

  return token;
}

while (index < input.length) {
  skipWhitespace();

  if (input[index] === ';') {
    break;
  }

  if (input[index] === ',') {
    index += 1;
    continue;
  }

  if (input[index] !== '(') {
    throw new Error(`Expected tuple start at position ${index}, found ${JSON.stringify(input[index])}.`);
  }

  index += 1;

  const tupleTokens = [];
  let columnIndex = 0;

  while (true) {
    const { token, delimiter } = readToken();

    tupleTokens.push(token);

    columnIndex += 1;

    if (delimiter === ',') {
      index += 1;
      continue;
    }

    if (delimiter === ')') {
      index += 1;
      break;
    }
  }

  tupleCount += 1;

  if (tupleTokens.length !== columns.length) {
    throw new Error(`Tuple ${tupleCount} did not contain the expected ${columns.length} columns.`);
  }

  const nameKey = decodeSqlString(tupleTokens[1]);

  if (!nameKey || nameKey === 'null') {
    continue;
  }

  rowsByName.set(nameKey, tupleTokens);
}

const dedupedRows = [...rowsByName.values()];
const statements = [];

for (let start = 0; start < dedupedRows.length; start += batchSize) {
  const batchRows = dedupedRows.slice(start, start + batchSize);
  const valuesBlock = batchRows
    .map((row) => `  (${row.join(', ')})`)
    .join(',\n');

  const updateLines = columns
    .filter((column) => column !== 'id' && column !== 'name')
    .map((column) => `  ${column} = excluded.${column}`);

  const updateBlock = updateLines
    .map((line, index) => `${line}${index === updateLines.length - 1 ? ';' : ','}`)
    .join('\n');

  statements.push([
    `insert into public.slots (${columns.join(', ')})`,
    'values',
    valuesBlock,
    'on conflict (name) do update set',
    updateBlock,
  ].join('\n'));
}

const output = [
  '-- Generated from a wide slots export to match sql/002_slots.sql.',
  `-- Source: ${path.basename(sourcePath)}`,
  `-- Rows parsed: ${tupleCount}`,
  `-- Rows kept after exact-name dedupe: ${dedupedRows.length}`,
  '',
  ...statements,
  '',
].join('\n');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, 'utf8');

console.log(`Wrote ${dedupedRows.length} rows to ${outputPath}`);
