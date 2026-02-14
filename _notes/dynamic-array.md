---
layout: note
title: "Dynamic Array"
---

**Dynamické pole** je datová struktura, která se navenek chová jako běžné pole (přístup k prvkům v čase $O(1)$), ale nemá fixní velikost. Dokáže automaticky měnit svou kapacitu podle toho, kolik prvků do něj vkládáme nebo z něj mažeme.

Implementace ve standardních knihovnách:
1. C++ - `std::vector`
2. Java - `ArrayList`
3. Python - `list`


Rozlišujeme dvě důležité hodnoty:
1. velikost - kolik prvků je v poli skutečně uloženo
2. kapacita- kolik paměti je pro pole alokováno
---
## Zvětšování 
Když chceme přidat prvek (operace `push_back` nebo `append`), ale pole je plné (`size == capacity`), musíme ho zvětšit.

**Algoritmus:**
1. Alokujeme **nové pole**, které je větší (typicky **2× větší** než původní).
2. **Zkopírujeme** všechny prvky ze starého pole do nového.
3. Přidáme nový prvek.
4. Staré pole smažeme z paměti.

### Zmenšování 
Když prvky odebíráme (operace `pop`), chceme uvolnit paměť, pokud je pole příliš prázdné.

**Naivní přístup (Chyba):** Pokud bychom pole zmenšili na polovinu okamžitě, jakmile klesne zaplnění pod 50 %, narazíme na problém zvaný **thrashing (kmitání)**.

- Představte si, že jste na hraně kapacity.
- Přidáte prvek -> Pole se zdvojnásobí (drahá operace).
- Smažete prvek -> Pole je pod 50 %, zmenší se na polovinu (drahá operace).
    
- Přidáte prvek -> Znovu se zdvojnásobí... Pokud byste střídavě dělali `push` a `pop` na této hraně, složitost by degradovala na $O(n)$.
    

**Správný přístup (S čtvrtinovou rezervou):** Pole zmenšíme na polovinu (halving) až tehdy, když počet prvků klesne na **$1/4$ kapacity**.

- Po zmenšení bude pole zaplněné z $1/2$.
- Máme tedy "bezpečnou zónu" (buffer), než bychom museli znovu zvětšovat.

---

## Analýza časové složitosti

Složitost jedné operace v nejhorším případě (worst-case) je $O(n)$, protože musíme vše zkopírovat. Ale [amortizovaná](/notes/amortized-analysis/) (průměrná) složitost je $O(1)$.

Použijme tzv. **[Bankéřovu metodu](/notes/bankerova-metoda-accounting-method/):** 
Představme si, že každá operace stojí "peníze" (jednotky času). Kopírování prvku stojí $1. Vložení prvku stojí $1.

- Za každé vložení (append) zaplatíme **$3**:    
    - $1 zaplatí aktuální vložení prvku
    - $2 si "uložíme na spořící účet" k tomuto prvku

Když se pole naplní (má velikost $N$) a musíme ho zdvojnásobit na $2N$:

- Musíme zkopírovat $N$ prvků. To stojí $N$ dolarů.
- Kde je vezmeme? Každý z těch $N$ prvků, které jsme tam vložili od posledního zvětšení, má u sebe naspořené $2 (nebo alespoň $1, záleží na přesné matematice). Tyto úspory použijeme na zaplacení kopírování.
- Díky tomu "drahá" operace kopírování nestojí nic navíc – byla předplacena levnými operacemi předtím.

**Výsledek:** Přidání prvku má amortizovanou složitost $O(1)$.