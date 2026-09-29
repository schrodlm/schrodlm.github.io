---
layout: note
title: "OpenMP 101"
---

# OpenMP 101

Foundational notes on OpenMP for the NPRG042 lab exam. Each section grew out of one question I tried to answer for myself — they're written so I can re-read them in a year and the *why* is still clear.

Related: [amdahl law](/notes/amdahl-law.html), [cache-aware model](/notes/cache-aware-model.html).

---

## 1. What `#pragma omp parallel for` actually expands to

This is shorthand for **two separate directives**:

```cpp
#pragma omp parallel
{
    #pragma omp for
    for (...) { ... }
}
```

Two distinct things are happening, and they cost different amounts:

- **`parallel`** creates a *team of threads*. This is the expensive part — thread wake-up, stack setup, work-queue init. Happens every time control hits this directive.
- **`for`** is a *work-sharing* construct. It splits the loop's iteration range across the team that already exists. Cheap.

Inside `#pragma omp parallel { ... }`, **every thread executes every statement** by default. Work-sharing constructs (`for`, `sections`, `single`) are how you say "actually divide this part up."

```
                  ┌─ thread 0 (you) ─┐
single thread ──► │                  │  ── team disbands ──► single thread
                  ├─ thread 1 ───────┤
                  ├─ thread 2 ───────┤
                  └─ thread 3 ───────┘
                  ↑                  ↑
              fork here          join here
```

### Why this matters: hoisting `parallel` outside an outer loop

If you do this:

```cpp
for (int d = 0; d < D; d++) {
    setup();
    #pragma omp parallel for          // ← team created/disbanded every iteration
    for (int p = 0; p < n_p; p++) tile_work();
    swaps();
}
```

…you pay team-creation cost `D` times. The hoisted version:

```cpp
#pragma omp parallel                  // ← team created once
{
    for (int d = 0; d < D; d++) {
        #pragma omp single { setup(); }     // ← only one thread does setup
                                            //   barrier at end of `single`

        #pragma omp for
        for (int p = 0; p < n_p; p++) tile_work();
                                            //   barrier at end of `for`

        #pragma omp single { swaps(); }     // ← only one thread does swaps
    }
}
```

`#pragma omp single` means **exactly one thread of the team executes this block; the rest skip it but wait at the implicit barrier at the end** (unless you write `nowait`). Without it, all threads would race on `setup()` and `swaps()`.

**Caveat:** modern OpenMP runtimes (libgomp, libomp) pool threads, so the team is "woken from idle" not "spawned from scratch." Saving is real but usually modest. Useful pattern to recognize; not always a must-do optimization.

Used in: NPRG042 - Paralelní programování Levenshtein assignment — diagonal tile sweep over a 2D DP grid.

---

## 2. Why `reduction(+:x)` works

OpenMP rewrites this:

```cpp
double sum = 0.0;
#pragma omp parallel for reduction(+:sum)
for (int i = 0; i < n; i++) sum += a[i];
```

…to (conceptually) this:

```cpp
double sum = 0.0;
#pragma omp parallel
{
    double sum_local = 0.0;        // (1) each thread gets its own copy, init to op's identity
    #pragma omp for
    for (int i = 0; i < n; i++)
        sum_local += a[i];          // (2) accumulate locally — no race, no sync, full speed
    #pragma omp atomic
    sum += sum_local;               // (3) merge at the end, once per thread
}
```

### Three things to internalize

**(1) Initial value is the operator's identity, not the outside variable's value.**

| Op    | Identity         |
|-------|------------------|
| `+`   | 0                |
| `*`   | 1                |
| `min` | type's max       |
| `max` | type's min       |
| `&`   | all bits 1       |
| `|`   | 0                |
| `^`   | 0                |
| `&&`  | 1                |
| `||`  | 0                |

The original value of `sum` is preserved — it gets folded in at the merge step. So:

```cpp
double sum = 100.0;
#pragma omp parallel for reduction(+:sum)
for (int i = 0; i < n; i++) sum += a[i];
// final sum = 100 + sum_of_a
//             ^^^^   ^^^^^^^^^
//             outside value     threads' partial sums
```

**(2) Zero contention in the hot loop.** This is the whole point. Each thread writes only to its own register/stack slot. No `atomic`, no `critical`, no cache-line bouncing.

**(3) Merge cost is `O(threads)`, not `O(n)`.** One atomic add per thread, not per iteration.

### Floating-point reductions are non-deterministic

`(a+b)+c ≠ a+(b+c)` in floating point (rounding). Threads accumulate in independent orders → last few bits of the final sum can differ run-to-run. Graders use epsilon comparisons (`|a - b| < 1e-9`) for this reason. Integer reductions match bit-for-bit; float reductions don't.

### Two patterns I want to recognize on sight

```cpp
// "Are all elements positive?"
bool all_ok = true;
#pragma omp parallel for reduction(&&:all_ok)
for (int i = 0; i < n; i++) all_ok = all_ok && (a[i] > 0);

// "What's the max?"
double m = -INFINITY;
#pragma omp parallel for reduction(max:m)
for (int i = 0; i < n; i++) m = std::max(m, a[i]);
```

---

## 3. Array-section reductions

Same idea as scalar reduction, but the "thing being reduced" is an array slice.

### The motivating problem: histogram

```cpp
int hist[256] = {0};
for (int i = 0; i < n; i++) {
    int b = bucket(a[i]);   // 0..255, depends on data
    hist[b]++;
}
```

`hist[b]++` is a read-modify-write into a *data-dependent* slot. Scalar reduction doesn't fit (the slot changes per iteration).

### Wrong approaches (recognize them so you don't write them)

```cpp
// Wrong #1 — critical: every iteration through a mutex. Probably slower than serial.
#pragma omp parallel for
for (...) { #pragma omp critical hist[b]++; }

// Wrong #2 — atomic: faster than critical, but hot bins (e.g. bin 128 gets 30% of hits)
// cause cache-line bouncing. Speedup tops out at 2-3× then plateaus.
#pragma omp parallel for
for (...) { #pragma omp atomic hist[b]++; }
```

### Right approach: array-section reduction (OpenMP 4.5+)

```cpp
int hist[256] = {0};

#pragma omp parallel for reduction(+:hist[:256])
for (int i = 0; i < n; i++) hist[bucket(a[i])]++;
```

`hist[:256]` reads as "the slice of `hist` from index 0 of length 256." Generalized: `arr[start:length]`. The shortcut `[:N]` = `[0:N]`.

OpenMP gives each thread its own 256-int array, accumulates without contention, merges at the end. Identical mental model to scalar reduction.

### Syntax variants

```cpp
reduction(+:hist[:256])              // length form (start defaults to 0)
reduction(+:hist[0:256])             // explicit start and length — same thing
reduction(+:hist[10:50])             // elements 10..59
reduction(max:hist[:256])            // any operator
reduction(+:matrix[0:R][0:C])        // multi-dimensional, element-wise
reduction(+:sum, hist[:256])         // multiple operands sharing an operator
reduction(+:sum) reduction(+:hist[:256])  // OR: separate clauses (more readable)
```

### When this breaks down

Each thread allocates its own copy of the slice. If the slice is huge (10M elements × 16 threads → 160M extra elements + a 10M-element merge step), the overhead can outweigh the parallelism win.

**Rule of thumb:**
- ≤ a few thousand slots → use `reduction(+:arr[:N])`. Cleanest.
- Huge target → manual thread-private buffer pattern (below).

### Manual fallback pattern (also works on older compilers)

```cpp
int hist[256] = {0};
int nth = omp_get_max_threads();
std::vector<std::array<int, 256>> local(nth);   // one per thread

#pragma omp parallel
{
    int t = omp_get_thread_num();
    auto& my = local[t];
    my.fill(0);

    #pragma omp for nowait
    for (int i = 0; i < n; i++) my[bucket(a[i])]++;
}

// serial merge — 256 × nth additions, trivial
for (int t = 0; t < nth; t++)
    for (int b = 0; b < 256; b++)
        hist[b] += local[t][b];
```

Generalizes to **any structured accumulator** — vector, map, set — give each thread its own and merge at the end.

### Works with `std::vector` too

The slice notation operates on the underlying buffer, so `reduction(+:vec[:N])` works as long as the vector is sized to ≥ N *before* entering the parallel region.

```cpp
std::vector<uint64_t> hist(256, 0);
double sum = 0.0;
#pragma omp parallel for reduction(+:sum) reduction(+:hist[:256])
for (int i = 0; i < n; i++) {
    sum += a[i];
    hist[bucket(a[i])]++;
}
```

One line of pragma, two reductions, full speedup. This is the target pattern for the `01_reduction` practice problem.

---

---

## 4. Data sharing: `private`, `firstprivate`, `shared`, and friends

Default rules when you enter a parallel region:
- Variables **declared outside** the parallel region → automatically `shared`.
- Variables **declared inside** the loop body → automatically `private` (own copy per thread).
- The loop counter of a `for` directive → automatically `private`.

### The clause vocabulary

| Clause             | Visible from outside? | Initialized?            | Outside value updated? |
|--------------------|------------------------|--------------------------|-------------------------|
| `shared(x)`        | Same memory            | Yes (the outside value)  | Yes (race risk if written) |
| `private(x)`       | Own copy               | **No** — undefined       | No                      |
| `firstprivate(x)`  | Own copy               | Yes (copy of outside)    | No                      |
| `lastprivate(x)`   | Own copy               | No                       | **Yes** — value from the last (serial-order) iteration |
| `reduction(op:x)`  | Own copy               | Yes (op's identity)      | Yes — merged via `op`   |

### Common confusion: `private` does NOT merge

Plain `private` discards the thread-local copy at the end of the region. The outside value is untouched. **Merging at the end is what `reduction` does** — `private` does not.

```cpp
int x = 42;
#pragma omp parallel private(x)
{
    x = omp_get_thread_num();   // each thread sets its own copy
    // ... uses x ...
}
printf("%d\n", x);              // prints 42 — outside x untouched
```

Also: inside the parallel region, `x` is **uninitialized** with plain `private`. To carry the outside value in, use `firstprivate`.

### When to reach for `firstprivate`

For carrying **read-only context** into the region: loop bounds, base offsets, a config struct, anything each thread needs to read but no thread should modify globally.

```cpp
const Config cfg = load_config();
#pragma omp parallel for firstprivate(cfg)
for (int i = 0; i < n; i++) process(a[i], cfg);
```

### The lazy default everyone should use: declare inside

Variables declared **inside** the parallel loop body are automatically thread-local. No clause needed.

```cpp
#pragma omp parallel for
for (int i = 0; i < n; i++) {
    double tmp = a[i] * 2.0;        // ← per-iteration, thread-local automatically
    int j = compute(tmp);            // ← same
    out[i] = j;
}
```

Versus the clause-based equivalent, which is more code, more risk (forget a variable = silent race), and the variables start uninitialized:

```cpp
double tmp; int j;
#pragma omp parallel for private(tmp, j)  // ← avoid this style when possible
for (int i = 0; i < n; i++) {
    tmp = a[i] * 2.0;
    j = compute(tmp);
    out[i] = j;
}
```

**Rule of thumb:** if you're writing `private(tmp)` for a temporary, move `tmp`'s declaration inside the loop body instead.

### Pointers into shared arrays — still safe with partitioning

A pointer declared local can still write into shared memory — that's fine *if each thread's slice is disjoint*:

```cpp
#pragma omp parallel for
for (std::size_t p = 0; p < diag_len; p++) {
    DIST* my_right = &rgt_curr[p * TILE_SIZE];  // local pointer, shared target,
    // ... writes via my_right[i] ...           //   but per-p slice = no overlap
}
```

This is the workhorse pattern for "work on a shared array in parallel without races."

### When you can't declare inside

If you need to **carry state across iterations within a single thread**, declare-inside resets the state every iteration. But that's usually a sign the iterations aren't independent, which means a `parallel for` is the wrong tool. Switch to the explicit form:

```cpp
#pragma omp parallel
{
    int running = 0;        // per-thread, persists across this thread's iterations
    #pragma omp for nowait
    for (int i = 0; i < n; i++) { running += f(a[i]); }
    #pragma omp atomic
    global_total += running;
}
```

---

## 5. `default(none)` — the safety clause

A *defensive* clause: changes nothing about runtime behavior, but forces the compiler to refuse to guess data-sharing for any variable.

```cpp
#pragma omp parallel for default(none) shared(a, n) reduction(+:sum)
for (int i = 0; i < n; i++) sum += a[i];
```

If you forget a variable, you get a compile error instead of a silent race:
```
error: 'b' not specified in enclosing 'parallel'
```

### The bug it catches

```cpp
double tmp;                                  // ← was inside the loop yesterday
#pragma omp parallel for                     // ← no default(none)
for (int i = 0; i < n; i++) {
    tmp = expensive_calc(a[i]);              // ← every thread writes shared tmp — race!
    out[i] = tmp * tmp;
}
```

Compiles. Produces correct-looking output most of the time. Hours of debugging.

With `default(none)`, the compiler refuses, you choose `private(tmp)` (or move the declaration inside), bug averted.

### Multi-line pragmas

When the `shared(...)` list gets long, use backslash-newline continuation:

```cpp
#pragma omp parallel for schedule(dynamic) if(diag_len > 1) \
        default(none) \
        shared(s1, s2, n, m, bot_curr, bot_prev, rgt_curr, rgt_prev, \
               crn_curr, crn_prev2, tr_start, tr_start_p1, tr_start_p2, \
               d, diag_len)
for (std::size_t p = 0; p < diag_len; p++) { ... }
```

A long list isn't a problem — it's a *map* of every shared variable. Reviewing it once catches things you missed.

### Companion rule: declare-inside reduces the list

`default(none)` only asks about variables from outer scopes. Variables declared inside the loop body aren't subject to it. So the two patterns together:

- **`default(none)`** — forces you to specify every external variable.
- **Declare locals inside** — eliminates the variables you'd otherwise have to specify.

…shrinks the cognitive load to "what does this loop touch from outside, and is each access safe?" That's the question that actually matters.

### Per-thread vs per-iteration prints (a debugging aside)

`#pragma omp critical` protects `std::cout`, but if you put it inside a parallel `for` body you print once per iteration — usually too many. To print once per thread, decompose:

```cpp
#pragma omp parallel if(diag_len > 1)
{
    #pragma omp critical
    std::cout << "thread " << omp_get_thread_num() << " entering d=" << d << "\n";

    #pragma omp for schedule(dynamic)
    for (std::size_t p = 0; p < diag_len; p++) { ... }
}
```

To print once per diagonal (regardless of thread count), use `#pragma omp single`. The N-question to ask:
- N = once total → outside parallel region, or `single` / `master` inside.
- N = once per thread → between `parallel` and `for`.
- N = once per iteration → inside the `for` body.

This is one reason to write `parallel { ... for ... }` expanded rather than `parallel for` — you need something to live between the team-spawn and the work-share.

---

---

## 7. Synchronization: `atomic` vs `critical` vs `omp_lock_t`

All three serialize access. They differ in **what they protect**, **how cheap they are**, and **how flexible they are**.

### The three tools at a glance

| Tool        | Scope                              | Mechanism                                              |
|-------------|-------------------------------------|--------------------------------------------------------|
| `atomic`    | One scalar op (`x++`, `x += y`)     | Hardware atomic — `LOCK`-prefixed instruction on x86  |
| `critical`  | Arbitrary code block                | OS mutex                                               |
| `omp_lock_t`| Manually-fenced scope               | OS mutex, but explicit `init/set/unset/destroy`        |

### Performance, ballpark (single increment)

- `x++` (race, no protection) — ~1 ns
- `#pragma omp atomic; x++` uncontended — ~5–20 ns
- `#pragma omp atomic; x++` contended — ~100 ns+ (cache-line bouncing)
- `#pragma omp critical; x++` — ~100–500 ns uncontended, much worse contended

**Headline: `atomic` is roughly 10–100× faster than `critical` when both apply.** When you have a choice, choose `atomic`.

### What `atomic` accepts (and what it doesn't)

```cpp
#pragma omp atomic
x++;                    // ✓ ++, --, prefix or postfix
#pragma omp atomic
x += expr;              // ✓ all compound assignments: +=, -=, *=, /=, &=, |=, ^=, <<=, >>=
#pragma omp atomic
x = x + expr;           // ✓ also valid

// ❌ not valid as atomic:
#pragma omp atomic
{ x++; y++; }                  // multiple ops
#pragma omp atomic
v.push_back(x);                // not a scalar op
#pragma omp atomic
if (x > best) best = x;        // read-then-conditional-write
```

For the read-then-write pattern, there are specialized flavors (`atomic read`, `atomic write`, `atomic update`, `atomic capture`) but they're rarely needed in coursework.

**Default rule: `atomic` works for single-scalar arithmetic; anything else → `critical`.**

### Picking the right tool — decision flow

```
Need to update shared state from inside a parallel loop?
│
├── Can it be a reduction? ── YES ──► reduction(...)
│   (best — zero sync in hot loop)
│
├── Can each thread write to a disjoint index/slice? ── YES ──► just write — no sync
│   (workhorse pattern — see Levenshtein bot_curr[p * TILE_SIZE] writes)
│
├── Single scalar op (x++, x += y)? ── YES ──► #pragma omp atomic
│
├── Multiple statements / container modification? ──► #pragma omp critical
│
└── Lock scope that doesn't fit a {} block, or multiple independent locks? ──► omp_lock_t
```

**Reach for reduction or disjoint partitioning first.** Reaching for `critical` inside a hot loop usually means you've missed a better structure.

### Named critical sections — a common-bug landmine

By default, **all unnamed `#pragma omp critical` sections share one global lock**, even when they protect unrelated things:

```cpp
// Bad — these block each other for no reason
#pragma omp critical
counter_a++;
#pragma omp critical
buffer_b.push_back(x);
```

Give each critical a name to make them independent:
```cpp
#pragma omp critical(counter)
counter_a++;
#pragma omp critical(buffer)
buffer_b.push_back(x);
```

Now `(counter)` and `(buffer)` only block within their own name.

### The killer pattern: `critical` inside a hot loop

```cpp
#pragma omp parallel for
for (int i = 0; i < n; i++) {
    auto r = expensive(a[i]);
    #pragma omp critical
    results.push_back(r);              // every iteration serializes → slower than serial
}
```

Two fixes:

**Fix A — thread-private vectors, merge at end:**
```cpp
int nth = omp_get_max_threads();
std::vector<std::vector<Result>> local(nth);
#pragma omp parallel
{
    auto& my = local[omp_get_thread_num()];
    #pragma omp for nowait
    for (int i = 0; i < n; i++) my.push_back(expensive(a[i]));
}
for (auto& v : local) results.insert(results.end(), v.begin(), v.end());
```

**Fix B — pre-size the output, write by index:**
```cpp
std::vector<Result> results(n);
#pragma omp parallel for
for (int i = 0; i < n; i++) results[i] = expensive(a[i]);
```

Fix B is cleanest when the output size is known up front. Fix A is the fallback when it isn't (filtering, variable output per input).

### When to use `omp_lock_t`

Honestly, almost never in coursework. Reach for it only when:
- The lock scope can't fit in a `{ }` block (acquire in one function, release in another).
- You need multiple independent locks.
- You need `omp_test_lock` (non-blocking try-lock).

If you're reaching for explicit locks, step back and check whether reduction, array-section reduction, or thread-private + merge fits instead.

### How Levenshtein dodges all three

The tile loop never uses `atomic`, `critical`, or any lock. Each thread writes to a disjoint slice (`&bot_curr[p * TILE_SIZE]`, `&rgt_curr[p * TILE_SIZE]`, `crn_curr[p]`) — `p` is unique per iteration so the slices don't overlap. **The goal is to structure work so synchronization isn't needed**, not to find the cheapest synchronization primitive.

---

## Updated quick reference card

| Need                                  | Use                                       |
|---------------------------------------|-------------------------------------------|
| Parallel loop, no shared state        | `#pragma omp parallel for`                |
| Accumulate scalar across iterations   | `reduction(op:x)`                         |
| Accumulate into array slots           | `reduction(op:arr[:N])` (OpenMP 4.5+)     |
| Multiple reductions, same op          | `reduction(+:a, b, c[:N])`                |
| Multiple reductions, different ops    | Stack separate `reduction(...)` clauses   |
| Per-iteration scratch variable        | Declare it *inside* the loop body         |
| Carry outside value in, read-only     | `firstprivate(x)`                         |
| Each thread has independent state     | `private(x)` or declare-inside (preferred) |
| Force explicit data-sharing           | `default(none)` + matching `shared(...)`  |
| One-time work inside a parallel team  | `#pragma omp single { ... }`              |
| Avoid spawning team on every outer it | Hoist `parallel` out, use `single`+`for`  |
| Single scalar update, no reduction fit | `#pragma omp atomic`                     |
| Multi-statement / container update     | `#pragma omp critical(name)`              |
| Independent locks                      | Named criticals, or `omp_lock_t`          |
| Filter into a shared vector            | Thread-private vectors + merge at end     |

---

## 8. Manual reduction (thread-local accumulator + combine)

The pattern that `reduction(...)` is sugar for. Useful when the clause doesn't fit.

### The shape

```cpp
double sum = 0.0;

#pragma omp parallel
{
    double local = 0.0;                      // (1) per-thread accumulator (declared inside!)

    #pragma omp for nowait                   // (2) divide iterations, no barrier at end
    for (int i = 0; i < n; i++)
        local += a[i];                        //     pure thread-local — no contention

    #pragma omp atomic                       // (3) one merge per thread
    sum += local;
}                                            // barrier here guarantees sum is final
```

Three pieces, same as `reduction`: per-thread scratch → loop using scratch only → merge at end.

### Why `nowait` here

Without `nowait`, the `omp for` has an implicit barrier at its end — threads wait there before the `atomic`. With `nowait`, a thread can do its `atomic` merge as soon as it's done its iterations. Throughput is usually the same; cleaner conceptually, and avoids one pointless synchronization point.

The end-of-`parallel` barrier still guarantees `sum` is fully computed before later code reads it.

### When to reach for manual instead of the clause

| Case | Why manual |
|---|---|
| Custom op on a non-trivial type (struct, map, vector) | Built-in reduction ops don't cover it (alternative: `#pragma omp declare reduction`) |
| Want to observe per-thread results during merge | Reduction clause hides the per-thread values |
| Large per-thread state where you want to control the merge strategy | Reduction clause picks the merge for you |
| Container append (e.g. each thread builds a vector) | Reduction clause doesn't apply; manual + critical merge is idiomatic |

### Worked example: per-thread vector with merge

```cpp
std::vector<Result> final;

#pragma omp parallel
{
    std::vector<Result> local;

    #pragma omp for nowait
    for (int i = 0; i < n; i++)
        if (keep(a[i])) local.push_back(expensive(a[i]));

    #pragma omp critical
    final.insert(final.end(), local.begin(), local.end());
}
```

No sync in the hot loop. One per-thread merge step. This is the standard "filter into a shared vector" pattern.

### The anti-pattern to recognize

```cpp
#pragma omp parallel for
for (int i = 0; i < n; i++) {
    Result r = expensive(a[i]);
    #pragma omp critical
    final.push_back(r);                 // ❌ critical inside hot loop — kills speedup
}
```

If your "manual reduction" merges with `critical` *inside* the hot loop, it isn't a manual reduction. It's the killer pattern from §7. The whole point is to confine sync to one merge per thread.

### TBB cross-reference

OpenMP's `reduction(+:sum)` is implicitly what TBB's `parallel_reduce(range, identity, body, combine)` makes explicit. The OpenMP manual pattern is the same three pieces, made explicit — which is why this feels familiar coming from TBB.

(More to come — false sharing, `collapse`, scheduling, tasks, etc.)
