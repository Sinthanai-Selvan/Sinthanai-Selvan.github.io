// ============================================================
// Biostatistics calculators — Sample Size / Power / Descriptive
// Client-side only. Uses standard normal (z) & Student's t
// approximations suitable for planning and teaching purposes.
// ============================================================

/* ---------------------- Math helpers ---------------------- */

// Lookup tables for the fixed <select> options used in the UI.
// Two-sided critical z for a given alpha (also usable for confidence
// level via alpha = 1 - confidence).
var Z_TWO_SIDED = { "0.10": 1.6449, "0.05": 1.9600, "0.01": 2.5758 };
// One-sided z corresponding to a given power (1 - beta).
var Z_POWER = { "0.80": 0.8416, "0.90": 1.2816, "0.95": 1.6449 };

function zTwoSidedFromAlpha(alpha) {
  var key = Number(alpha).toFixed(2);
  return Z_TWO_SIDED[key] !== undefined ? Z_TWO_SIDED[key] : 1.9600;
}
function zTwoSidedFromConfidence(conf) {
  var alpha = (1 - Number(conf)).toFixed(2);
  return Z_TWO_SIDED[alpha] !== undefined ? Z_TWO_SIDED[alpha] : 1.9600;
}
function zFromPower(power) {
  var key = Number(power).toFixed(2);
  return Z_POWER[key] !== undefined ? Z_POWER[key] : 0.8416;
}

// Abramowitz & Stegun 7.1.26 approximation of erf (|error| < 1.5e-7)
function erf(x) {
  var sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  var a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
      a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  var t = 1 / (1 + p * x);
  var y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}
function normalCDF(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }

// Log-gamma (Lanczos approximation) — needed for the incomplete beta function
function gammaln(xx) {
  var cof = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  var x = xx, y = xx, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  var ser = 1.000000000190015;
  for (var j = 0; j < 6; j++) { y += 1; ser += cof[j] / y; }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

function betacf(x, a, b) {
  var MAXIT = 100, EPS = 3e-7, FPMIN = 1e-30;
  var qab = a + b, qap = a + 1, qam = a - 1;
  var c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  var h = d;
  for (var m = 1; m <= MAXIT; m++) {
    var m2 = 2 * m;
    var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    var del = d * c; h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function betainc(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  var bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return bt * betacf(x, a, b) / a;
  } else {
    return 1 - bt * betacf(1 - x, b, a) / b;
  }
}

// Two-tailed p-value for Student's t with `df` degrees of freedom
function tTwoTailedP(t, df) {
  var x = df / (df + t * t);
  return betainc(x, df / 2, 0.5);
}

function parseNumbers(text) {
  return text
    .split(/[\s,;]+/)
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 0; })
    .map(Number)
    .filter(function (n) { return !isNaN(n); });
}

function mean(arr) { return arr.reduce(function (a, b) { return a + b; }, 0) / arr.length; }

function sampleVariance(arr) {
  var m = mean(arr);
  var sq = arr.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0);
  return sq / (arr.length - 1);
}

function quantile(sortedArr, q) {
  var pos = (sortedArr.length - 1) * q;
  var base = Math.floor(pos);
  var rest = pos - base;
  if (sortedArr[base + 1] !== undefined) {
    return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
  }
  return sortedArr[base];
}

function fmt(n, d) {
  if (n === undefined || n === null || isNaN(n)) return "—";
  d = d === undefined ? 3 : d;
  var s = Number(n).toFixed(d);
  return trimTrail(s);
}
function trimTrail(s) {
  if (s.indexOf(".") === -1) return s;
  s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s === "" || s === "-" ? "0" : s;
}

function showBox(id, html) {
  var el = document.getElementById(id);
  el.innerHTML = html;
  el.classList.remove("hidden");
}

function sigWord(p, alpha) {
  return p < alpha
    ? "Statistically significant at α = " + alpha + " (reject H₀)."
    : "Not statistically significant at α = " + alpha + " (fail to reject H₀).";
}

/* ==================== SAMPLE SIZE ==================== */

function calcSSProp1() {
  var p = parseFloat(document.getElementById("ssP1_p").value);
  var d = parseFloat(document.getElementById("ssP1_d").value);
  var conf = document.getElementById("ssP1_conf").value;
  var N = parseFloat(document.getElementById("ssP1_N").value);
  var z = zTwoSidedFromConfidence(conf);

  var n0 = (z * z * p * (1 - p)) / (d * d);
  var n = n0;
  var note = "";
  if (N && N > 0) {
    n = n0 / (1 + (n0 - 1) / N);
    note = " (finite population correction applied, N = " + N + ")";
  }
  n = Math.ceil(n);

  showBox("ssP1_result",
    '<div class="result-label">Required Sample Size</div>' +
    '<div class="result-figure">n = ' + n + '</div>' +
    '<div class="result-note">z = ' + z + ', p = ' + p + ', margin of error = ' + d + note + '</div>');
}

function calcSSProp2() {
  var p1 = parseFloat(document.getElementById("ssP2_p1").value);
  var p2 = parseFloat(document.getElementById("ssP2_p2").value);
  var alpha = document.getElementById("ssP2_alpha").value;
  var power = document.getElementById("ssP2_power").value;
  var k = parseFloat(document.getElementById("ssP2_ratio").value) || 1;

  var za = zTwoSidedFromAlpha(alpha);
  var zb = zFromPower(power);

  var n1 = Math.pow(za + zb, 2) * (p1 * (1 - p1) + (p2 * (1 - p2)) / k) / Math.pow(p1 - p2, 2);
  var n2 = k * n1;
  n1 = Math.ceil(n1);
  n2 = Math.ceil(n2);

  showBox("ssP2_result",
    '<div class="result-label">Required Sample Size</div>' +
    '<div class="result-figure">n₁ = ' + n1 + '&nbsp;&nbsp;·&nbsp;&nbsp;n₂ = ' + n2 + '</div>' +
    '<div class="result-note">Total N = ' + (n1 + n2) + '. α = ' + alpha + ' (two‑sided), power = ' + (power * 100) + '%, allocation ratio = ' + k + '.</div>');
}

function calcSSMean2() {
  var delta = parseFloat(document.getElementById("ssM2_delta").value);
  var sd = parseFloat(document.getElementById("ssM2_sd").value);
  var alpha = document.getElementById("ssM2_alpha").value;
  var power = document.getElementById("ssM2_power").value;
  var k = parseFloat(document.getElementById("ssM2_ratio").value) || 1;

  var za = zTwoSidedFromAlpha(alpha);
  var zb = zFromPower(power);

  var n1 = Math.pow(za + zb, 2) * sd * sd * (1 + 1 / k) / (delta * delta);
  var n2 = k * n1;
  n1 = Math.ceil(n1);
  n2 = Math.ceil(n2);

  showBox("ssM2_result",
    '<div class="result-label">Required Sample Size</div>' +
    '<div class="result-figure">n₁ = ' + n1 + '&nbsp;&nbsp;·&nbsp;&nbsp;n₂ = ' + n2 + '</div>' +
    '<div class="result-note">Total N = ' + (n1 + n2) + '. α = ' + alpha + ' (two‑sided), power = ' + (power * 100) + '%, allocation ratio = ' + k + '.</div>');
}

function calcSSMean1() {
  var sd = parseFloat(document.getElementById("ssM1_sd").value);
  var e = parseFloat(document.getElementById("ssM1_e").value);
  var conf = document.getElementById("ssM1_conf").value;
  var z = zTwoSidedFromConfidence(conf);

  var n = Math.ceil(Math.pow((z * sd) / e, 2));

  showBox("ssM1_result",
    '<div class="result-label">Required Sample Size</div>' +
    '<div class="result-figure">n = ' + n + '</div>' +
    '<div class="result-note">z = ' + z + ', SD = ' + sd + ', margin of error = ' + e + '</div>');
}

/* ======================== POWER ======================== */

function calcPowerProp2() {
  var p1 = parseFloat(document.getElementById("pwP2_p1").value);
  var p2 = parseFloat(document.getElementById("pwP2_p2").value);
  var n = parseFloat(document.getElementById("pwP2_n").value);
  var alpha = document.getElementById("pwP2_alpha").value;
  var za = zTwoSidedFromAlpha(alpha);

  var seAlt = Math.sqrt((p1 * (1 - p1)) / n + (p2 * (1 - p2)) / n);
  var zBeta = Math.abs(p1 - p2) / seAlt - za;
  var power = normalCDF(zBeta);
  power = Math.max(0, Math.min(1, power));

  showBox("pwP2_result",
    '<div class="result-label">Estimated Power</div>' +
    '<div class="result-figure">' + (power * 100).toFixed(1) + '%</div>' +
    '<div class="result-note">With n = ' + n + ' per group, α = ' + alpha + ' (two‑sided), p₁ = ' + p1 + ', p₂ = ' + p2 + '.</div>');
}

function calcPowerMean2() {
  var delta = parseFloat(document.getElementById("pwM2_delta").value);
  var sd = parseFloat(document.getElementById("pwM2_sd").value);
  var n = parseFloat(document.getElementById("pwM2_n").value);
  var alpha = document.getElementById("pwM2_alpha").value;
  var za = zTwoSidedFromAlpha(alpha);

  var se = sd * Math.sqrt(2 / n);
  var zBeta = Math.abs(delta) / se - za;
  var power = normalCDF(zBeta);
  power = Math.max(0, Math.min(1, power));

  showBox("pwM2_result",
    '<div class="result-label">Estimated Power</div>' +
    '<div class="result-figure">' + (power * 100).toFixed(1) + '%</div>' +
    '<div class="result-note">With n = ' + n + ' per group, α = ' + alpha + ' (two‑sided), Δ = ' + delta + ', SD = ' + sd + '.</div>');
}

/* =================== DESCRIPTIVE STATS =================== */

function calcDescriptive() {
  var raw = document.getElementById("descInput").value;
  var data = parseNumbers(raw);
  if (data.length < 2) {
    showBox("descResult", '<div class="result-note">Please enter at least two numeric values.</div>');
    return;
  }
  var sorted = data.slice().sort(function (a, b) { return a - b; });
  var n = data.length;
  var m = mean(data);
  var variance = sampleVariance(data);
  var sd = Math.sqrt(variance);
  var se = sd / Math.sqrt(n);
  var median = quantile(sorted, 0.5);
  var q1 = quantile(sorted, 0.25);
  var q3 = quantile(sorted, 0.75);
  var iqr = q3 - q1;
  var min = sorted[0];
  var max = sorted[n - 1];
  var range = max - min;

  // Mode
  var freq = {};
  data.forEach(function (v) { freq[v] = (freq[v] || 0) + 1; });
  var maxFreq = Math.max.apply(null, Object.values(freq));
  var modes = Object.keys(freq).filter(function (k) { return freq[k] === maxFreq; });
  var modeStr = (maxFreq === 1) ? "None (all unique)" : modes.join(", ");

  var ciZ = 1.96;
  var ciLow = m - ciZ * se;
  var ciHigh = m + ciZ * se;

  var tiles = [
    ["n", n], ["Mean", fmt(m)], ["Median", fmt(median)], ["Mode", modeStr],
    ["Std. Dev.", fmt(sd)], ["Variance", fmt(variance)], ["Std. Error", fmt(se)],
    ["Min", fmt(min)], ["Max", fmt(max)], ["Range", fmt(range)],
    ["Q1", fmt(q1)], ["Q3", fmt(q3)], ["IQR", fmt(iqr)]
  ];

  var html = tiles.map(function (t) {
    return '<div class="stat-tile"><div class="v">' + t[1] + '</div><div class="k">' + t[0] + '</div></div>';
  }).join("");

  var box = document.getElementById("descResult");
  box.innerHTML =
    '<div class="result-label">Descriptive Statistics</div>' +
    '<div class="stat-results-grid">' + html + '</div>' +
    '<div class="result-note">95% CI for the mean (normal approximation): [' + fmt(ciLow) + ', ' + fmt(ciHigh) + ']</div>';
  box.classList.remove("hidden");
}

/* ========================= T-TESTS ========================= */

function calcTTestOne() {
  var data = parseNumbers(document.getElementById("tt1Input").value);
  var mu0 = parseFloat(document.getElementById("tt1_mu0").value);
  var alpha = parseFloat(document.getElementById("tt1_alpha").value);

  if (data.length < 2) {
    showBox("tt1_result", '<div class="result-note">Please enter at least two numeric values.</div>');
    return;
  }
  var n = data.length;
  var m = mean(data);
  var sd = Math.sqrt(sampleVariance(data));
  var se = sd / Math.sqrt(n);
  var t = (m - mu0) / se;
  var df = n - 1;
  var p = tTwoTailedP(Math.abs(t), df);

  showBox("tt1_result",
    '<div class="result-label">One‑Sample t‑test Result</div>' +
    '<div class="result-figure">t = ' + fmt(t, 3) + '</div>' +
    '<div class="stat-results-grid">' +
      '<div class="stat-tile"><div class="v">' + n + '</div><div class="k">n</div></div>' +
      '<div class="stat-tile"><div class="v">' + fmt(m) + '</div><div class="k">Sample Mean</div></div>' +
      '<div class="stat-tile"><div class="v">' + df + '</div><div class="k">df</div></div>' +
      '<div class="stat-tile"><div class="v">' + fmt(p, 4) + '</div><div class="k">p‑value</div></div>' +
    '</div>' +
    '<div class="result-note">' + sigWord(p, alpha) + '</div>');
}

function calcTTestTwo() {
  var g1 = parseNumbers(document.getElementById("tt2_g1").value);
  var g2 = parseNumbers(document.getElementById("tt2_g2").value);
  var alpha = parseFloat(document.getElementById("tt2_alpha").value);

  if (g1.length < 2 || g2.length < 2) {
    showBox("tt2_result", '<div class="result-note">Please enter at least two numeric values in each group.</div>');
    return;
  }
  var n1 = g1.length, n2 = g2.length;
  var m1 = mean(g1), m2 = mean(g2);
  var v1 = sampleVariance(g1), v2 = sampleVariance(g2);
  var se = Math.sqrt(v1 / n1 + v2 / n2);
  var t = (m1 - m2) / se;
  var df = Math.pow(v1 / n1 + v2 / n2, 2) /
    ((Math.pow(v1 / n1, 2) / (n1 - 1)) + (Math.pow(v2 / n2, 2) / (n2 - 1)));
  var p = tTwoTailedP(Math.abs(t), df);

  showBox("tt2_result",
    '<div class="result-label">Welch\'s Two‑Sample t‑test Result</div>' +
    '<div class="result-figure">t = ' + fmt(t, 3) + '</div>' +
    '<div class="stat-results-grid">' +
      '<div class="stat-tile"><div class="v">' + fmt(m1) + '</div><div class="k">Mean (Group 1)</div></div>' +
      '<div class="stat-tile"><div class="v">' + fmt(m2) + '</div><div class="k">Mean (Group 2)</div></div>' +
      '<div class="stat-tile"><div class="v">' + fmt(df, 2) + '</div><div class="k">df (Welch)</div></div>' +
      '<div class="stat-tile"><div class="v">' + fmt(p, 4) + '</div><div class="k">p‑value</div></div>' +
    '</div>' +
    '<div class="result-note">' + sigWord(p, alpha) + ' (Welch\'s t‑test, no equal‑variance assumption.)</div>');
}

/* ====================== CHI-SQUARE 2x2 ====================== */

function calcChiSquare() {
  var a = parseFloat(document.getElementById("chi_a").value) || 0;
  var b = parseFloat(document.getElementById("chi_b").value) || 0;
  var c = parseFloat(document.getElementById("chi_c").value) || 0;
  var d = parseFloat(document.getElementById("chi_d").value) || 0;

  var n = a + b + c + d;
  var rowSums = [a + b, c + d];
  var colSums = [a + c, b + d];

  if (n === 0 || rowSums[0] === 0 || rowSums[1] === 0 || colSums[0] === 0 || colSums[1] === 0) {
    showBox("chi_result", '<div class="result-note">Please enter valid counts (no empty row/column).</div>');
    return;
  }

  var chi2 = (n * Math.pow(a * d - b * c, 2)) / (rowSums[0] * rowSums[1] * colSums[0] * colSums[1]);
  var yatesInner = Math.max(0, Math.abs(a * d - b * c) - n / 2);
  var chi2Yates = (n * Math.pow(yatesInner, 2)) / (rowSums[0] * rowSums[1] * colSums[0] * colSums[1]);

  var p = 2 * (1 - normalCDF(Math.sqrt(chi2)));
  var pYates = 2 * (1 - normalCDF(Math.sqrt(chi2Yates)));

  var or = (b === 0 || c === 0) ? NaN : (a * d) / (b * c);
  var rr = (rowSums[0] === 0 || rowSums[1] === 0 || a === 0) ? NaN :
    (a / rowSums[0]) / (c / rowSums[1]);

  showBox("chi_result",
    '<div class="result-label">Chi‑square Test (2×2)</div>' +
    '<div class="result-figure">&chi;&sup2; = ' + fmt(chi2, 3) + '</div>' +
    '<div class="stat-results-grid">' +
      '<div class="stat-tile"><div class="v">' + fmt(p, 4) + '</div><div class="k">p‑value</div></div>' +
      '<div class="stat-tile"><div class="v">' + fmt(chi2Yates, 3) + '</div><div class="k">&chi;&sup2; (Yates)</div></div>' +
      '<div class="stat-tile"><div class="v">' + fmt(pYates, 4) + '</div><div class="k">p (Yates)</div></div>' +
      '<div class="stat-tile"><div class="v">' + (isNaN(or) ? "—" : fmt(or, 3)) + '</div><div class="k">Odds Ratio</div></div>' +
      '<div class="stat-tile"><div class="v">' + (isNaN(rr) ? "—" : fmt(rr, 3)) + '</div><div class="k">Risk Ratio</div></div>' +
    '</div>' +
    '<div class="result-note">' + sigWord(p, 0.05) + ' df = 1.</div>');
}
