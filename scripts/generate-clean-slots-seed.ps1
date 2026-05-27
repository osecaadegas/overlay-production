param(
  [Parameter(Mandatory = $true)]
  [string]$SourcePath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

function Read-Token {
  param(
    [string]$Text,
    [ref]$Index
  )

  while ($Index.Value -lt $Text.Length -and [char]::IsWhiteSpace($Text[$Index.Value])) {
    $Index.Value++
  }

  $start = $Index.Value
  $inString = $false
  $squareDepth = 0
  $curlyDepth = 0
  $innerParenDepth = 0

  while ($Index.Value -lt $Text.Length) {
    $char = $Text[$Index.Value]
    $next = if ($Index.Value + 1 -lt $Text.Length) { $Text[$Index.Value + 1] } else { [char]0 }

    if ($inString) {
      if ($char -eq "'" -and $next -eq "'") {
        $Index.Value += 2
        continue
      }

      if ($char -eq "'") {
        $inString = $false
      }

      $Index.Value++
      continue
    }

    if ($char -eq "'") {
      $inString = $true
      $Index.Value++
      continue
    }

    if ($char -eq '[') {
      $squareDepth++
      $Index.Value++
      continue
    }

    if ($char -eq ']') {
      $squareDepth--
      $Index.Value++
      continue
    }

    if ($char -eq '{') {
      $curlyDepth++
      $Index.Value++
      continue
    }

    if ($char -eq '}') {
      $curlyDepth--
      $Index.Value++
      continue
    }

    if ($char -eq '(') {
      $innerParenDepth++
      $Index.Value++
      continue
    }

    if ($char -eq ')') {
      if ($squareDepth -eq 0 -and $curlyDepth -eq 0 -and $innerParenDepth -eq 0) {
        return [pscustomobject]@{
          Token = $Text.Substring($start, $Index.Value - $start).Trim()
          Delimiter = ')'
        }
      }

      $innerParenDepth--
      $Index.Value++
      continue
    }

    if ($char -eq ',' -and $squareDepth -eq 0 -and $curlyDepth -eq 0 -and $innerParenDepth -eq 0) {
      return [pscustomobject]@{
        Token = $Text.Substring($start, $Index.Value - $start).Trim()
        Delimiter = ','
      }
    }

    $Index.Value++
  }

  throw 'Unexpected end of file while reading tuple token.'
}

function Decode-SqlString {
  param([string]$Token)

  if ([string]::IsNullOrWhiteSpace($Token) -or $Token -eq 'null') {
    return $Token
  }

  if ($Token.StartsWith("'") -and $Token.EndsWith("'")) {
    return $Token.Substring(1, $Token.Length - 2).Replace("''", "'")
  }

  return $Token
}

$columns = @(
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
  'twitch_safe'
)

$sql = Get-Content -Path $SourcePath -Raw
$valuesIndex = $sql.IndexOf('VALUES')

if ($valuesIndex -lt 0) {
  throw 'Could not find a VALUES clause in the source SQL.'
}

$index = $valuesIndex + 'VALUES'.Length
$tupleCount = 0
$rowsByName = [System.Collections.Specialized.OrderedDictionary]::new()

while ($index -lt $sql.Length) {
  while ($index -lt $sql.Length -and [char]::IsWhiteSpace($sql[$index])) {
    $index++
  }

  if ($index -ge $sql.Length -or $sql[$index] -eq ';') {
    break
  }

  if ($sql[$index] -eq ',') {
    $index++
    continue
  }

  if ($sql[$index] -ne '(') {
    throw "Expected tuple start at position $index."
  }

  $index++
  $tupleCount++
  $tupleTokens = New-Object System.Collections.Generic.List[string]

  while ($true) {
    $result = Read-Token -Text $sql -Index ([ref]$index)
    $tupleTokens.Add($result.Token)

    if ($result.Delimiter -eq ',') {
      $index++
      continue
    }

    $index++
    break
  }

  if ($tupleTokens.Count -ne $columns.Count) {
    throw "Tuple $tupleCount did not contain the expected $($columns.Count) columns."
  }

  $nameKey = Decode-SqlString $tupleTokens[1]

  if ([string]::IsNullOrWhiteSpace($nameKey) -or $nameKey -eq 'null') {
    continue
  }

  $rowsByName[$nameKey] = @($tupleTokens)
}

$batchSize = 500
$statements = New-Object System.Collections.Generic.List[string]
$rows = @($rowsByName.Values)

for ($start = 0; $start -lt $rows.Count; $start += $batchSize) {
  $end = [Math]::Min($start + $batchSize - 1, $rows.Count - 1)
  $batch = for ($i = $start; $i -le $end; $i++) {
    "  ($($rows[$i] -join ', '))"
  }

  $updateLines = foreach ($column in $columns) {
    if ($column -ne 'id' -and $column -ne 'name') {
      "  $column = excluded.$column"
    }
  }

  $updateBlock = for ($i = 0; $i -lt $updateLines.Count; $i++) {
    if ($i -eq $updateLines.Count - 1) {
      "$($updateLines[$i]);"
    } else {
      "$($updateLines[$i]),"
    }
  }

  $statements.Add(@(
    "insert into public.slots ($($columns -join ', '))",
    'values',
    ($batch -join ",`n"),
    'on conflict (name) do update set',
    ($updateBlock -join "`n")
  ) -join "`n")
}

$output = @(
  '-- Generated from a wide slots export to match sql/002_slots.sql.',
  "-- Source: $(Split-Path -Leaf $SourcePath)",
  "-- Rows parsed: $tupleCount",
  "-- Rows kept after exact-name dedupe: $($rows.Count)",
  '',
  ($statements -join "`n`n"),
  ''
) -join "`n"

$outputDirectory = Split-Path -Parent $OutputPath

if (-not [string]::IsNullOrWhiteSpace($outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
}

Set-Content -Path $OutputPath -Value $output -Encoding UTF8
Write-Output "Wrote $($rows.Count) rows to $OutputPath"
