# CPU ML Training System

Apna khud ka neural network training + run system. **Zero GPU, sirf CPU.**

## Do System

| System | File | Kaam |
|--------|------|------|
| **Train System** | `train.py`, `core.py`, `core2.py` | Nayi model banana + sikhaana |
| **Run System** | `run.py` | Sikha hua model chalaana (sawaal -> jawab) |

## Layer System (khud likha)

- `layers.py`, `ops.py` - layer forward/backward (sabse simple, seekhne ke liye)
- `core.py` - numba C-speed fused kernels (FastMLP/FastTrainer)
- `core2.py` - BLAS engine + buffer reuse (CoreMLP/CoreTrainer) - **yehi fast path ka base**

## Fast Trainer (research upgrade) - `train_fast.py`

`mnist_training_time_report.md` ke 3 proven levers implement karta hai:

1. **OneCycle LR** (`onecycle.py`) - LR warmup + cosine decay.
   Super-convergence (arXiv:1708.07120) = 2-4x kam epochs.
2. **Forgetting pruning** (`ForgettingPruner`) - jo examples model already
   jaanta hai (2 epochs sahi + kam loss) unhe drop.
   (arXiv:1812.05159, 2205.09329) = ~2x kam kaam per epoch.
3. **Val checkpoint + early stop** - best weights save, bekar epochs waste nahi.

```python
from train_fast import train_fast
report = train_fast(Xt, Yt, Xe, Ye, sizes=[784, 128, 64, 10])
# report: model, epochs_done, time_s, best_acc, final_acc, pruned_frac
```

## 1M Model - 8 min se ~1 min (proof) - `train_1m_fast.py`

`python train_1m_fast.py` - 1M model (784->1024->256->10) ko ~1 min me train
karta hai, 98%+ accuracy ke saath.

Measured on i3-7020U (4 threads, numpy 2.4.6):

| | BEFORE | AFTER | Speedup |
|---|---|---|---|
| time | 213s (3.6 min) | **49s (0.8 min)** | **4.4x** |
| epochs | 20 | 7 | |
| test acc | ~98% | **98.33%** | |

Levers: batch 1024 (BLAS efficiency 1.6x) + OneCycle LR (7 epochs me hi 98%) +
forgetting pruning + early stop + OPENBLAS threads=4.

## Benchmark

```bash
python bench_fast.py       # quick: 5000 train, 109K model (~30s)
python bench_fast.py full  # asli: 60000 train, 1M model (5-10 min)
```

BEFORE vs AFTER - same data, same model, speedup + accuracy table.

## Files

| File | Kya hai |
|------|---------|
| `train_1m_fast.py` | 1M model fast path (8 min -> ~1 min, measured) |
| `train_fast.py` | Naya fast trainer (OneCycle + pruning + early stop) |
| `train_mnist.py` | Purana MNIST trainer (109K model) |
| `train_1m.py` | 1M model MNIST (baseline reference) |
| `onecycle.py` | OneCycle LR schedule + LR range test |
| `quantize.py` / `quantize_1m.py` | Inference quantization (4/8-bit) |
| `multicore.py` | BLAS thread test |
| `benchmark.py` | System speed test |
| `bench_fast.py` | Before/after comparison |
| `mnist_training_time_report.md` | Research report (sources ke saath) |

## Test

```bash
python _check_state.py    # sab imports + run system
python bench_fast.py      # before/after proof
```
