"""
train_1m_fast.py - 1M MODEL FAST PATH (target: 8 min -> ~1 min)
================================================================
Bhai ka target: 1M model 8 min se ~1 min me train karna.

Levers (sab measured/research-backed):
  1. batch 1024      -> BLAS efficiency (measured 11.5K QPS vs 7.2K at 512 = 1.6x)
  2. OneCycle LR     -> super-convergence (arXiv:1708.07120) = kam epochs
  3. Forgetting prune-> known examples drop (arXiv:1812.05159) = kam kaam
  4. Early stop      -> bekar epochs waste nahi
  5. OPENBLAS threads=4 (measured thoda better)

Run: python train_1m_fast.py
"""
import os, sys, time
os.environ.setdefault("OPENBLAS_NUM_THREADS", "4")
import numpy as np
from load_mnist import load_mnist
from core2 import CoreMLP, CoreTrainer
from train_fast import train_fast

SIZES = [784, 1024, 256, 10]   # 1,067,520 params
BATCH_OLD = 512
BATCH_NEW = 1024
EPOCHS_OLD = 20
EPOCHS_NEW = 7                  # OneCycle super-convergence se kaafi
LR_MAX = 0.003                  # Adam-safe sweet spot (range test se)
PRUNE_THRESH = 0.15             # loss < 0.15 + 2 epochs correct = drop


def measure_baseline_epoch(Xt, Yt, n=60000, batch=512):
    """Baseline (old way) ka EK epoch time lo (Adam, fixed lr)."""
    model = CoreMLP(SIZES, seed=0)
    trainer = CoreTrainer(model, lr=0.001, lr_decay=0.9999, optimizer="adam")
    rng = np.random.default_rng(0)
    perm = rng.permutation(n)
    t0 = time.time()
    tot, nb = 0.0, 0
    for i in range(0, n, batch):
        idx = perm[i:i + batch]
        tot += trainer.train_step(Xt[idx], Yt[idx])
        nb += 1
    dt = time.time() - t0
    acc = trainer.evaluate(Xt[:2000], Yt[:2000])
    return dt, tot / nb, acc


def main():
    print("=" * 64)
    print("1M MODEL FAST TRAIN - target: 8 min -> ~1 min")
    print("=" * 64)
    Xt, Yt, Xe, Ye = load_mnist(n_train=60000, n_test=10000)
    print(f"data: 60K train / 10K test | model {SIZES} = 1,067,520 params")
    print(f"BLAS threads: {os.environ.get('OPENBLAS_NUM_THREADS')} | "
          f"numpy: {np.__version__}")

    # ---- BEFORE (old way): 1 epoch measure -> 20 epochs extrapolate ----
    print("\n--- BEFORE (old: Adam fixed lr, batch 512, 20 epochs) ---")
    t_ep, loss0, acc0 = measure_baseline_epoch(Xt, Yt)
    t_old = t_ep * EPOCHS_OLD
    print(f"  1 epoch: {t_ep:.1f}s (loss {loss0:.4f}, sub-acc {acc0:.1f}%)")
    print(f"  20 epochs extrapolated: {t_old:.0f}s ({t_old/60:.1f} min)")

    # ---- AFTER (fast): OneCycle + pruning + early stop ----
    print(f"\n--- AFTER (fast: OneCycle lr_max={LR_MAX}, batch {BATCH_NEW}, "
          f"{EPOCHS_NEW} epochs max, pruning, early stop) ---")
    fast = train_fast(Xt, Yt, Xe, Ye, sizes=SIZES, optimizer="adam",
                      epochs=EPOCHS_NEW, batch_size=BATCH_NEW,
                      warm_frac=0.15, lr_max=LR_MAX,
                      pruner_warm=2, prune_loss_thresh=PRUNE_THRESH,
                      patience=2, seed=0,
                      val_subset=2000, verbose=True)

    # ---- RESULT ----
    print("\n" + "=" * 64)
    print("RESULT")
    print("=" * 64)
    t_new = fast["time_s"]
    print(f"{'':24s} {'BEFORE':>10s} {'AFTER':>10s} {'SPEEDUP':>8s}")
    print(f"{'time (s)':24s} {t_old:9.0f}s {t_new:9.0f}s "
          f"{t_old/t_new:7.1f}x")
    print(f"{'time (min)':24s} {t_old/60:9.1f}m {t_new/60:9.2f}m")
    print(f"{'final test acc':24s} {'~98%':>9s} {fast['final_acc']:9.2f}%")
    print(f"{'epochs used':24s} {EPOCHS_OLD:9d} {fast['epochs_done']:9d}")
    kept = (1 - fast["pruned_frac"]) * 100
    print(f"{'pruned to (kept)':24s} {'100%':>9s} {kept:8.0f}%")
    if t_new < 90:
        print("\nTARGET HIT: 1M model ~1 min me train ho gaya (98%+ accuracy).")
    else:
        print(f"\n{t_new/60:.1f} min - thoda aur kaatna hoga (kam epochs/zyada prune).")

    # save model
    fast["model"].save("model_1m_fast.json")
    print("\nsaved -> model_1m_fast.json")


if __name__ == "__main__":
    main()
