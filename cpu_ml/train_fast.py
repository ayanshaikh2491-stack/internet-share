"""
train_fast.py - FAST TRAINER (research-backed upgrade)
=======================================================
mnist_training_time_report.md ke 3 levers implement karta hai:

  1. OneCycle LR (super-convergence, arXiv:1708.07120)
     -> LR warmup + cosine decay = 2-4x KAM epochs
  2. Forgetting-based pruning (arXiv:1812.05159, 2205.09329)
     -> jo examples model already "jaanta hai" unhe drop = 2x kam kaam
  3. Val checkpoint + early stop (insurance)
     -> best weights save, bekar epochs waste nahi

API:
  from train_fast import train_fast, ForgettingPruner, lr_range_test_fast

  report = train_fast(Xt, Yt, Xe, Ye, sizes=[784,128,64,10], ...)
  report = {model, epochs_done, time_s, best_acc, hist, pruned_after, ...}
"""

import time
import numpy as np
from core2 import CoreMLP, CoreTrainer
from onecycle import onecycle_lrs, lr_range_test


class ForgettingPruner:
    """Per-example tracking: drop 'known' examples (2 consecutive correct
    epochs + low loss). Hard/high-loss examples hamesha keep.

    Rule (report se): keep = ~((correct 2 epochs) & (loss < 0.01))
    """

    def __init__(self, n_examples, warm_epochs=3, loss_thresh=0.01):
        self.n = n_examples
        self.warm_epochs = warm_epochs          # pehle 3 epochs tracking
        self.loss_thresh = loss_thresh
        self.loss = np.full(n_examples, np.inf, dtype=np.float64)
        self.prev_correct = np.zeros(n_examples, dtype=bool)
        self.cur_correct = np.zeros(n_examples, dtype=bool)
        self.epoch = 0
        self.last_prune = 0                     # kitne examples gaye

    def reset_epoch(self):
        self.prev_correct = self.cur_correct.copy()
        self.cur_correct[:] = False

    def observe(self, idx, preds, y, losses):
        """Batch ke results record karo. losses = per-example CE."""
        corr = (preds == y)
        self.cur_correct[idx] = corr
        np.minimum(self.loss[idx], losses, out=self.loss[idx])

    def should_prune(self):
        return self.epoch >= self.warm_epochs

    def keep_mask(self):
        """True = train karo, False = drop (redundant example)."""
        known = self.prev_correct & self.cur_correct & (self.loss < self.loss_thresh)
        keep = ~known
        self.last_prune = int(keep.sum())
        return keep

    def end_epoch(self):
        self.epoch += 1


def lr_range_test_fast(trainer, Xt, Yt, batch=512, steps=20,
                       lr_start=1e-5, lr_end=2.0):
    """Best lr dhundo. Returns best_lr (aur model ko WAPAS init karna zaroori,
    kyunki range test model ko mutate karta hai)."""
    best_lr, lrs, losses = lr_range_test(
        trainer, Xt, Yt, steps=steps, lr_start=lr_start, lr_end=lr_end, batch=batch)
    return float(best_lr)


def _eval_acc(model, X, Y):
    h = X
    for i in range(len(model.Ws)):
        h = np.dot(h, model.Ws[i]) + model.bs[i]
        if i < len(model.Ws) - 1:
            h = np.maximum(h, 0)
    return (h.argmax(axis=1) == Y).mean() * 100.0


def train_fast(Xt, Yt, Xe, Ye, sizes, optimizer="adam",
               epochs=10, batch_size=512, warm_frac=0.1,
               lr_max=None, lr_min_ratio=0.01,
               pruner_warm=3, prune_loss_thresh=0.01,
               patience=3, seed=0,
               val_subset=2000, verbose=True):
    """Fast path training.

    Returns dict:
      model, epochs_done, time_s, best_acc, best_epoch,
      train_time_s, range_lr, pruned_frac, final_acc
    """
    n = len(Yt)
    steps_per_epoch = (n + batch_size - 1) // batch_size
    total_steps = epochs * steps_per_epoch

    t_all = time.time()

    # ---- 1) LR range test (agar lr_max nahi diya) ----
    range_lr = lr_max
    if range_lr is None:
        if verbose:
            print(f"[1/4] LR range test ({steps_per_epoch * 2} steps)...")
        probe = CoreMLP(sizes, seed=seed)
        probe_trainer = CoreTrainer(probe, lr=1e-5, optimizer=optimizer)
        range_lr = lr_range_test_fast(probe_trainer, Xt, Yt, batch=batch_size)
        del probe, probe_trainer
        if verbose:
            print(f"      -> best LR = {range_lr:.5f}")

    # ---- 2) model + OneCycle schedule ----
    model = CoreMLP(sizes, seed=seed)
    trainer = CoreTrainer(model, lr=0.001, optimizer=optimizer)
    lr_min = range_lr * lr_min_ratio
    sched = onecycle_lrs(total_steps, range_lr, lr_min=lr_min, warm_frac=warm_frac)

    # ---- 3) pruner + loop ----
    pruner = ForgettingPruner(n, warm_epochs=pruner_warm,
                              loss_thresh=prune_loss_thresh)
    rng = np.random.default_rng(seed)

    best_acc = -1.0
    best_epoch = -1
    best_state = None
    hist = []
    global_step = 0
    no_improve = 0
    train_time = 0.0

    for epoch in range(epochs):
        if pruner.should_prune():
            keep = pruner.keep_mask()
            idx_all = np.nonzero(keep)[0]
        else:
            idx_all = np.arange(n)
        perm = rng.permutation(len(idx_all))
        pruner.reset_epoch()

        t_ep = time.time()
        tot = 0.0
        nb = 0
        for i in range(0, len(idx_all), batch_size):
            if global_step < len(sched):
                trainer.lr = float(sched[global_step])
            ids = idx_all[perm[i:i + batch_size]]
            loss, preds, per_ex = trainer.train_step(Xt[ids], Yt[ids], return_stats=True)
            pruner.observe(ids, preds, Yt[ids], per_ex)
            tot += loss
            nb += 1
            global_step += 1
        train_time += time.time() - t_ep
        pruner.end_epoch()

        # val check
        acc = _eval_acc(model, Xe[:val_subset], Ye[:val_subset])
        hist.append(acc)
        if acc > best_acc:
            best_acc = acc
            best_epoch = epoch
            best_state = ([w.copy() for w in model.Ws], [b.copy() for b in model.bs])
            no_improve = 0
        else:
            no_improve += 1

        if verbose:
            print(f"[epoch {epoch:2d}] loss {tot/nb:.4f} | val {acc:.2f}% | "
                  f"best {best_acc:.2f}% | subset {len(idx_all):,}/{n:,} | {time.time()-t_all:.0f}s")

        # early stop: schedule decay phase me bhi 3+ epochs bekaar -> ruko
        if no_improve >= patience and epoch >= pruner_warm + 2:
            if verbose:
                print(f"      (early stop: {no_improve} epochs no improve)")
            break

    # best weights wapas (checkpoint)
    if best_state is not None:
        model.Ws, model.bs = best_state

    final_acc = _eval_acc(model, Xe, Ye)
    if verbose:
        kept = pruner.last_prune
        print(f"\n[4/4] DONE: {epoch+1} epochs in {time.time()-t_all:.1f}s")
        print(f"      best val {best_acc:.2f}% (epoch {best_epoch}), final test {final_acc:.2f}%")
        print(f"      pruned to {kept:,}/{n:,} ({kept/n*100:.0f}% kept)")

    return {
        "model": model,
        "epochs_done": epoch + 1,
        "time_s": time.time() - t_all,
        "train_time_s": train_time,
        "best_acc": best_acc,
        "best_epoch": best_epoch,
        "final_acc": final_acc,
        "hist": hist,
        "range_lr": range_lr,
        "pruned_frac": 1.0 - pruner.last_prune / n,
    }
