$types = @(
  @{ code = 'XOS'; slug = 'xos'; name = '脑洞玩家' },
  @{ code = 'XOC'; slug = 'xoc'; name = '稳定输出机' },
  @{ code = 'XSB'; slug = 'xsb'; name = '人类观察者' },
  @{ code = 'SOC'; slug = 'soc'; name = '社牛本牛' },
  @{ code = 'SEA'; slug = 'sea'; name = '情绪雷达' },
  @{ code = 'SBC'; slug = 'sbc'; name = '高门槛玩家' },
  @{ code = 'CEC'; slug = 'cec'; name = '靠谱本体' },
  @{ code = 'CBC'; slug = 'cbc'; name = '秩序控' },
  @{ code = 'BSO'; slug = 'bso'; name = '博弈高手' },
  @{ code = 'EAS'; slug = 'eas'; name = '情绪流动体' },
  @{ code = 'EXS'; slug = 'exs'; name = '内耗大师' },
  @{ code = 'BXE'; slug = 'bxe'; name = '高防御体质' },
  @{ code = 'BXC'; slug = 'bxc'; name = '单机玩家' },
  @{ code = 'BCS'; slug = 'bcs'; name = '现实派' },
  @{ code = 'SACE'; slug = 'sace'; name = '万金油' },
  @{ code = 'MXT'; slug = 'mxt'; name = '多版本玩家' },
  @{ code = 'XEB'; slug = 'xeb'; name = '看不透的人' },
  @{ code = 'EAS+'; slug = 'eas-plus'; name = '情绪共振体' }
)

foreach ($t in $types) {
  $resultDir = Join-Path 'result' $t.code
  $typeDir = Join-Path 'types' $t.slug
  New-Item -ItemType Directory -Force -Path $resultDir | Out-Null
  New-Item -ItemType Directory -Force -Path $typeDir | Out-Null

  $resultHtml = @"
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NBTI 结果 - $($t.name) $($t.code)</title>
    <meta name="description" content="NBTI 测试结果：$($t.name)（$($t.code)），包含完整人格解析与分享文案。" />
    <link rel="stylesheet" href="/assets/css/style.css" />
    <script src="/assets/js/data.js" defer></script>
    <script src="/assets/js/app.js" defer></script>
  </head>
  <body>
    <main class="site-wrap">
      <header class="topbar">
        <a class="logo" href="/">NBTI <small>不是MBTI</small></a>
        <nav class="nav">
          <a href="/test/">开始测试</a>
          <a href="/types/">所有类型</a>
          <a href="/rankings/">排行榜</a>
        </nav>
      </header>
      <div id="result-app" data-code="$($t.code)"></div>
    </main>
  </body>
</html>
"@
  Set-Content -Path (Join-Path $resultDir 'index.html') -Value $resultHtml -Encoding utf8

  $typeHtml = @"
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>$($t.name) $($t.code) - NBTI 类型</title>
    <meta name="description" content="$($t.name)（$($t.code)）类型页：人格说明、行为分析、优势问题、FAQ与相关推荐。" />
    <link rel="stylesheet" href="/assets/css/style.css" />
    <script src="/assets/js/data.js" defer></script>
    <script src="/assets/js/app.js" defer></script>
  </head>
  <body>
    <main class="site-wrap">
      <header class="topbar">
        <a class="logo" href="/">NBTI <small>不是MBTI</small></a>
        <nav class="nav">
          <a href="/test/">开始测试</a>
          <a href="/types/">所有类型</a>
          <a href="/rankings/">排行榜</a>
        </nav>
      </header>
      <div id="type-detail-app" data-slug="$($t.slug)"></div>
    </main>
  </body>
</html>
"@
  Set-Content -Path (Join-Path $typeDir 'index.html') -Value $typeHtml -Encoding utf8
}

Write-Output "generated $($types.Count) result pages and $($types.Count) type pages"
