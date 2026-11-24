# Reference values computed with exact/independent methods (stdlib only)
import math, itertools
from statistics import NormalDist

def t_pdf(x, df):
    return math.exp(math.lgamma((df+1)/2) - math.lgamma(df/2)) / math.sqrt(df*math.pi) * (1 + x*x/df) ** (-(df+1)/2)

def t_cdf(x, df, n=200000):
    # integrate pdf from 0 to |x| with Simpson, then use symmetry
    a, b = 0.0, abs(x)
    h = (b - a) / n
    s = t_pdf(a, df) + t_pdf(b, df)
    for i in range(1, n):
        s += (4 if i % 2 else 2) * t_pdf(a + i*h, df)
    area = s * h / 3
    return 0.5 + area if x >= 0 else 0.5 - area

def t_two_p(t, df): return 2 * (1 - t_cdf(abs(t), df))

def t_quantile(p, df):
    lo, hi = -50.0, 50.0
    for _ in range(80):
        mid = (lo+hi)/2
        if t_cdf(mid, df, 20000) < p: lo = mid
        else: hi = mid
    return (lo+hi)/2

print("tTwoP(4.242641, 4) =", t_two_p(4.242640687, 4))
print("tTwoP(2.0, 10) =", t_two_p(2.0, 10))
print("tTwoP(0.5, 3) =", t_two_p(0.5, 3))
print("tQ(.975,4) =", t_quantile(.975, 4))
print("tQ(.975,10) =", t_quantile(.975, 10))
print("tQ(.975,29) =", t_quantile(.975, 29))
print("normQ(.975) =", NormalDist().inv_cdf(.975), " normCDF(1.3)=", NormalDist().cdf(1.3), " normCDF(-2.5)=", NormalDist().cdf(-2.5))

def binom_pmf(k, n, p): return math.comb(n, k) * p**k * (1-p)**(n-k)
def upper(k, n, p): return sum(binom_pmf(i, n, p) for i in range(k, n+1))
print("P(X>=10|20,.25) =", upper(10, 20, .25))
print("P(X>=30|100,.25) =", upper(30, 100, .25))
def two_sided(k, n, p):
    pk = binom_pmf(k, n, p)
    return sum(binom_pmf(i, n, p) for i in range(n+1) if binom_pmf(i, n, p) <= pk*(1+1e-7))
print("2sided(10|20,.25) =", two_sided(10, 20, .25))
print("2sided(3|25,.2) =", two_sided(3, 25, .2))
print("2sided(60|100,.5) =", two_sided(60, 100, .5))

def wilcoxon_exact(d):
    d = [x for x in d if x != 0]; n = len(d)
    absd = [abs(x) for x in d]
    order = sorted(range(n), key=lambda i: absd[i])
    rank = [0]*n; i = 0
    while i < n:
        j = i
        while j+1 < n and absd[order[j+1]] == absd[order[i]]: j += 1
        r = (i+j)/2 + 1
        for k in range(i, j+1): rank[order[k]] = r
        i = j+1
    Wp = sum(rank[i] for i in range(n) if d[i] > 0)
    mu = n*(n+1)/4
    cnt = 0; tot = 0
    for signs in itertools.product([0, 1], repeat=n):
        w = sum(rank[i] for i in range(n) if signs[i])
        tot += 1
        if abs(w-mu) >= abs(Wp-mu) - 1e-9: cnt += 1
    return Wp, cnt/tot
print("wilcoxon [1,2,3,4,5] =", wilcoxon_exact([1,2,3,4,5]))
print("wilcoxon [1,-2,3,4,5] =", wilcoxon_exact([1,-2,3,4,5]))
print("wilcoxon ties [2,2,-1,3,3,3,-4,5] =", wilcoxon_exact([2,2,-1,3,3,3,-4,5]))
print("wilcoxon [0.5,-0.2,1.1,0.9,-0.4,0.7,1.3,0.2,0.6,-0.1] =", wilcoxon_exact([0.5,-0.2,1.1,0.9,-0.4,0.7,1.3,0.2,0.6,-0.1]))

rho = 1 - 6*8/(10*99)
print("spearman rho =", rho, " p =", t_two_p(rho*math.sqrt(8/(1-rho*rho)), 8))
nd = NormalDist()
hr = 8.5/11; far = 1.5/11
print("dprime(8,2,1,9) =", nd.inv_cdf(hr) - nd.inv_cdf(far))
print("holm [0.01,0.04,0.03] -> sorted: 0.01*3=0.03, 0.03*2=0.06, 0.04*1=0.04->max(.06)=0.06")
# welch
a=[5.1,4.9,5.6,5.8,6.0,5.5,5.3]; b=[4.5,4.8,5.0,4.2,4.9,5.1]
import statistics as st
ma, mb = st.mean(a), st.mean(b); va, vb = st.variance(a), st.variance(b); na, nb = len(a), len(b)
se2 = va/na+vb/nb; t=(ma-mb)/math.sqrt(se2); df=se2**2/((va/na)**2/(na-1)+(vb/nb)**2/(nb-1))
print("welch t =", t, " df =", df, " p =", t_two_p(t, df))
print("nForBinom(.25,.40) =", math.ceil(((nd.inv_cdf(.95)*math.sqrt(.25*.75)+nd.inv_cdf(.8)*math.sqrt(.4*.6))/.15)**2))
import hashlib
print("sha256(abc) =", hashlib.sha256(b'abc').hexdigest())
print("sha256(beatlab:12345:salt) =", hashlib.sha256(b'beatlab:12345:salt').hexdigest())
print("sha256(long) =", hashlib.sha256(('x'*1000).encode()).hexdigest())
