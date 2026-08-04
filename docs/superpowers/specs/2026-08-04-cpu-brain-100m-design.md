# CPU Brain - 100M Core Model Design

Date: 2026-08-04
Status: Approved (user: "ok start karo")

## Goal

Ek apna khud ka 100M parameter transformer language model jo CPU pe (Intel i3-7020U, 2 cores, 4 threads) train hota hai, **30 minute** me, bina GPU ke. Model "sochne wala dimag" hai - heavy knowledge nahi rakhta, sirf reasoning, logic, language, tool/skill selection aur research/verification karta hai. Heavy knowledge skills/tools me jaati hai.

## Non-Goals

- Heavy coding/frontend/backend/medical/legal knowledge model ke andar nahi
- GPU support nahi
- Fine-tuning kisi open model ka nahi (apna model scratch se)

## Architecture

### Model: GPT-style transformer, 100M params
- d_model = 768, layers = 12, heads = 12, vocab ~8-12K (Hindi + English word-level tokenizer)
- Numba fused kernels (cpu_ml/core.py se extend)
- Word-level tokenizer (char-level nahi, wo 4x slow)

### Training: Stage-wise (curriculum learning)
Ek hi model, 5 stages. Har stage sirf us category ke relevant params train karta hai (baaki freeze):

| Stage | Category | Params % | Params | Examples |
|-------|----------|----------|--------|----------|
| 1 | Reasoning | 30% | ~30M | 500 |
| 2 | Logic | 25% | ~25M | 500 |
| 3 | Language | 20% | ~20M | 500 |
| 4 | Tool/Skill | 15% | ~15M | 500 |
| 5 | Research | 10% | ~10M | 500 |

Total: 2500 high-quality examples, target ~22-25 min training (3 epochs/stage).

Techniques: OneCycle LR (super-convergence), checkpoint/resume, gradient check, layer freezing.

## Data Pipeline

- **Source:** Nemotron 3 Ultra Free via OpenCode Zen API (tested working)
  - Base URL: `https://opencode.ai/zen/v1`
  - Model: `nemotron-3-ultra-free`
- **2500 examples** = 5 categories × 500, high quality
- **Format C:** `Sawaal → Reasoning → Plan → [USE SKILL: x] → Verify → Final jawab`
- **Languages:** Hindi + English mix (sawaal ki language me jawab)
- Parallel API calls (data generation 1.5 hr → ~20 min), resume + retry ke saath

## Run System (Agent Loop)

- Model text generate karta hai
- `[USE SKILL: name]` dikhe → system skill chalata hai → result model ko wapas → model final jawab
- Pehle 3-5 simple skills: calculator, time, search placeholder, memory

## Testing

1. Tokenizer test
2. Model overfit test (1 batch)
3. Stage smoke test (har stage ke baad 1-2 example generate)
4. Agent E2E test (20-30 sawaal)
5. Har cheez verify ho kar hi "done"

## Deliverables

- `data/` - 2500 examples (5 category JSON files)
- `tokenizer.json` + vocab
- `model_100m.json` (trained, stage-wise ckpts)
- `run.py` (agent loop) + skills
- Benchmark report (real time, params trained, accuracy)

## Timeline

1. Data generation (background, ~20 min)
2. Tokenizer build + test
3. Model scaffold + overfit test
4. Stage-wise training (30 min target)
5. Run system + skills
6. E2E test
