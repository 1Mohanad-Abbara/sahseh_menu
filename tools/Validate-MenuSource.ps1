$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DataPath = Join-Path $ProjectRoot "data\menu.json"
$HtmlPath = Join-Path $ProjectRoot "index.html"
$ScriptPath = Join-Path $ProjectRoot "script.js"
$Errors = [System.Collections.Generic.List[string]]::new()

function Add-ValidationError {
  param([string]$Message)
  $script:Errors.Add($Message) | Out-Null
}

function Test-RequiredProperty {
  param(
    [object]$Object,
    [string]$PropertyName,
    [string]$Context
  )

  if (-not ($Object.PSObject.Properties.Name -contains $PropertyName)) {
    Add-ValidationError "$Context is missing required property '$PropertyName'."
    return $false
  }

  return $true
}

function Decode-HtmlText {
  param([string]$Value)
  return [System.Net.WebUtility]::HtmlDecode($Value).Trim()
}

if (-not (Test-Path -LiteralPath $DataPath)) {
  throw "Missing menu data file: $DataPath"
}

if (-not (Test-Path -LiteralPath $HtmlPath)) {
  throw "Missing static menu file: $HtmlPath"
}

$Menu = Get-Content -Raw -LiteralPath $DataPath | ConvertFrom-Json
$Html = Get-Content -Raw -LiteralPath $HtmlPath
$Script = Get-Content -Raw -LiteralPath $ScriptPath
$Categories = @($Menu.categories)

if ($Categories.Count -ne 13) {
  Add-ValidationError "Expected 13 categories in data/menu.json, found $($Categories.Count)."
}

$CategoryIds = [System.Collections.Generic.HashSet[string]]::new()
$SectionIds = [System.Collections.Generic.HashSet[string]]::new()
$ProductIds = [System.Collections.Generic.HashSet[string]]::new()
$ProductCount = 0
$PriceCount = 0

for ($CategoryIndex = 0; $CategoryIndex -lt $Categories.Count; $CategoryIndex++) {
  $Category = $Categories[$CategoryIndex]
  $Context = "Category index $CategoryIndex"

  foreach ($Property in @("id", "sectionId", "name", "order", "icon", "visibleInDineIn", "visibleInOrdering", "products")) {
    Test-RequiredProperty $Category $Property $Context | Out-Null
  }

  if (-not [string]::IsNullOrWhiteSpace($Category.id) -and -not $CategoryIds.Add([string]$Category.id)) {
    Add-ValidationError "Duplicate category id '$($Category.id)'."
  }

  if (-not [string]::IsNullOrWhiteSpace($Category.sectionId) -and -not $SectionIds.Add([string]$Category.sectionId)) {
    Add-ValidationError "Duplicate section id '$($Category.sectionId)'."
  }

  $ExpectedCategoryOrder = $CategoryIndex + 1
  $ExpectedSectionId = "section-{0:D2}" -f $ExpectedCategoryOrder

  if ([int]$Category.order -ne $ExpectedCategoryOrder) {
    Add-ValidationError "Category '$($Category.id)' has order $($Category.order), expected $ExpectedCategoryOrder."
  }

  if ($Category.sectionId -ne $ExpectedSectionId) {
    Add-ValidationError "Category '$($Category.id)' has sectionId '$($Category.sectionId)', expected '$ExpectedSectionId'."
  }

  if (-not [string]::IsNullOrWhiteSpace($Category.icon)) {
    $IconPath = Join-Path $ProjectRoot $Category.icon
    if (-not (Test-Path -LiteralPath $IconPath)) {
      Add-ValidationError "Category '$($Category.id)' icon does not exist: $($Category.icon)."
    }
  }

  $Products = @($Category.products)
  $ProductCount += $Products.Count
  $PreviousProduct = $null

  for ($ProductIndex = 0; $ProductIndex -lt $Products.Count; $ProductIndex++) {
    $Product = $Products[$ProductIndex]
    $ProductContext = "Product index $ProductIndex in category '$($Category.id)'"

    foreach ($Property in @("id", "name", "price", "priceText", "order", "image", "ingredients", "available", "visibleInDineIn", "visibleInOrdering")) {
      Test-RequiredProperty $Product $Property $ProductContext | Out-Null
    }

    if (-not [string]::IsNullOrWhiteSpace($Product.id) -and -not $ProductIds.Add([string]$Product.id)) {
      Add-ValidationError "Duplicate product id '$($Product.id)'."
    }

    if ([string]::IsNullOrWhiteSpace($Product.name)) {
      Add-ValidationError "$ProductContext has an empty product name."
    }

    $ExpectedProductOrder = $ProductIndex + 1
    if ([int]$Product.order -ne $ExpectedProductOrder) {
      Add-ValidationError "Product '$($Product.id)' has order $($Product.order), expected $ExpectedProductOrder."
    }

    if ([string]::IsNullOrWhiteSpace($Product.priceText)) {
      Add-ValidationError "Product '$($Product.id)' has an empty priceText."
    } else {
      $PriceCount++

      if ($Product.priceText -notmatch '^\d+\.\d{2}$') {
        Add-ValidationError "Product '$($Product.id)' priceText '$($Product.priceText)' is not formatted as 0.00."
      }

      if ([decimal]$Product.price -ne [decimal]$Product.priceText) {
        Add-ValidationError "Product '$($Product.id)' price $($Product.price) does not match priceText $($Product.priceText)."
      }
    }

    if ($null -ne $Product.image -and -not [string]::IsNullOrWhiteSpace($Product.image)) {
      $ImagePath = Join-Path $ProjectRoot $Product.image
      if (-not (Test-Path -LiteralPath $ImagePath)) {
        Add-ValidationError "Product '$($Product.id)' image does not exist: $($Product.image)."
      }
    }

    if ($PreviousProduct) {
      $PreviousPrice = [decimal]$PreviousProduct.price
      $CurrentPrice = [decimal]$Product.price

      if ($PreviousPrice -gt $CurrentPrice) {
        Add-ValidationError "Product '$($Product.id)' is priced lower than the previous product in '$($Category.id)'."
      }

    }

    $PreviousProduct = $Product
  }
}

if ($ProductCount -ne 103) {
  Add-ValidationError "Expected 103 products in data/menu.json, found $ProductCount."
}

if ($PriceCount -ne 103) {
  Add-ValidationError "Expected 103 price slots in data/menu.json, found $PriceCount."
}

$NavMatches = [regex]::Matches($Html, '<a href="#([^"]+)"><img src="([^"]+)"[^>]*><span class="nav-label">([\s\S]*?)</span></a>')
$SectionMatches = [regex]::Matches($Html, '<article class="menu-section" id="([^"]+)">([\s\S]*?)</article>')

if ($NavMatches.Count -ne 13) {
  Add-ValidationError "Expected 13 category navigation links in index.html, found $($NavMatches.Count)."
}

if ($SectionMatches.Count -ne 13) {
  Add-ValidationError "Expected 13 menu sections in index.html, found $($SectionMatches.Count)."
}

for ($CategoryIndex = 0; $CategoryIndex -lt $Categories.Count; $CategoryIndex++) {
  if ($CategoryIndex -ge $NavMatches.Count -or $CategoryIndex -ge $SectionMatches.Count) {
    continue
  }

  $Category = $Categories[$CategoryIndex]
  $Nav = $NavMatches[$CategoryIndex]
  $Section = $SectionMatches[$CategoryIndex]
  $NavSectionId = Decode-HtmlText $Nav.Groups[1].Value
  $NavIcon = Decode-HtmlText $Nav.Groups[2].Value
  $NavName = Decode-HtmlText $Nav.Groups[3].Value
  $HtmlSectionId = Decode-HtmlText $Section.Groups[1].Value
  $SectionBody = $Section.Groups[2].Value
  $HeadingMatch = [regex]::Match($SectionBody, '<h3><span class="section-icon"><img src="([^"]+)"[^>]*></span><span>([\s\S]*?)</span></h3>')

  if ($NavSectionId -ne $Category.sectionId) {
    Add-ValidationError "Navigation item $($CategoryIndex + 1) href '$NavSectionId' does not match data sectionId '$($Category.sectionId)'."
  }

  if ($NavIcon -ne $Category.icon) {
    Add-ValidationError "Navigation item '$($Category.id)' icon '$NavIcon' does not match data icon '$($Category.icon)'."
  }

  if ($NavName -ne $Category.name) {
    Add-ValidationError "Navigation item '$($Category.id)' label '$NavName' does not match data name '$($Category.name)'."
  }

  if ($HtmlSectionId -ne $Category.sectionId) {
    Add-ValidationError "HTML section $($CategoryIndex + 1) id '$HtmlSectionId' does not match data sectionId '$($Category.sectionId)'."
  }

  if (-not $HeadingMatch.Success) {
    Add-ValidationError "HTML section '$($Category.sectionId)' is missing the expected heading markup."
  } else {
    $HeadingIcon = Decode-HtmlText $HeadingMatch.Groups[1].Value
    $HeadingName = Decode-HtmlText $HeadingMatch.Groups[2].Value

    if ($HeadingIcon -ne $Category.icon) {
      Add-ValidationError "HTML section '$($Category.sectionId)' icon '$HeadingIcon' does not match data icon '$($Category.icon)'."
    }

    if ($HeadingName -ne $Category.name) {
      Add-ValidationError "HTML section '$($Category.sectionId)' title '$HeadingName' does not match data name '$($Category.name)'."
    }
  }

  $HtmlProducts = [regex]::Matches($SectionBody, '<li><span>([\s\S]*?)</span><span class="price-slot">([\s\S]*?)</span></li>')
  $DataProducts = @($Category.products)

  if ($HtmlProducts.Count -ne $DataProducts.Count) {
    Add-ValidationError "Section '$($Category.sectionId)' has $($HtmlProducts.Count) HTML products but $($DataProducts.Count) data products."
    continue
  }

  for ($ProductIndex = 0; $ProductIndex -lt $DataProducts.Count; $ProductIndex++) {
    $HtmlProduct = $HtmlProducts[$ProductIndex]
    $DataProduct = $DataProducts[$ProductIndex]
    $HtmlName = Decode-HtmlText $HtmlProduct.Groups[1].Value
    $HtmlPrice = Decode-HtmlText $HtmlProduct.Groups[2].Value

    if ($HtmlName -ne $DataProduct.name) {
      Add-ValidationError "Product '$($DataProduct.id)' name mismatch: HTML '$HtmlName', data '$($DataProduct.name)'."
    }

    if ($HtmlPrice -ne $DataProduct.priceText) {
      Add-ValidationError "Product '$($DataProduct.id)' price mismatch: HTML '$HtmlPrice', data '$($DataProduct.priceText)'."
    }
  }
}

if ($Errors.Count -gt 0) {
  foreach ($ValidationError in $Errors) {
    Write-Host "ERROR: $ValidationError" -ForegroundColor Red
  }

  exit 1
}

Write-Host "Menu source validation passed: 13 categories, 103 products, 103 prices."
