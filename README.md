rx-asmjs
========

Experimental support for rx-cpp compilation to asm.js

Clone the repo (including submodules) and run quickstart to get going.

Simply run the build script and open the resulting html file to run the benchmarks.

The Results
===========

Firefox Nightly 29
```
    asm#scan x 913 ops/sec ±0.74% (93 runs sampled)
    pure#scan x 359 ops/sec ±2.13% (80 runs sampled)
    asm#select x 873 ops/sec ±0.77% (92 runs sampled)
    pure#select x 384 ops/sec ±1.27% (82 runs sampled)
    asm#where x 867 ops/sec ±0.90% (92 runs sampled)
    pure#where x 390 ops/sec ±1.24% (83 runs sampled)
```

Chrome 32
```
    asm#scan x 611 ops/sec ±1.54% (93 runs sampled)
    pure#scan x 819 ops/sec ±0.91% (94 runs sampled)
    asm#select x 623 ops/sec ±0.80% (94 runs sampled)
    pure#select x 959 ops/sec ±1.09% (95 runs sampled)
    asm#where x 629 ops/sec ±0.94% (95 runs sampled)
    pure#where x 856 ops/sec ±1.19% (93 runs sampled)
```

Safari 7
```
    asm#scan x 544 ops/sec ±4.26% (59 runs sampled)
    pure#scan x 842 ops/sec ±1.03% (65 runs sampled)
    asm#select x 561 ops/sec ±0.98% (64 runs sampled)
    pure#select x 808 ops/sec ±1.06% (65 runs sampled)
    asm#where x 567 ops/sec ±0.95% (42 runs sampled)
    pure#where x 839 ops/sec ±0.88% (66 runs sampled)
```
