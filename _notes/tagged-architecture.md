> V dnešní době se nepoužívá, v 80. letech byla "testována" v provozu například v lisp machines

Jde o hardwarový mechanismus, který řeší klíčové problémy dynamicky typovaných jazyků, jako je Lisp, přímo na úrovni procesoru a paměti.

## Základní myšlenka
Základní myšlenka spočívá v tom, že každé slovo v paměti není tvořeno jen daty ale i malou sadou speciálních bitů nazývaných **tag**.

**Celkové Slovo (Word)** je pak obvykle širší než konvenčních 32 nebo 64 bitů (např. 36 nebo 40 bitů).


Tag mohl tedy zakódovat informace jako:

| **Tag (Příklad)** | **Typ Dat/Stav**                | **Co říká hardwaru**                                                                   |
| ----------------- | ------------------------------- | -------------------------------------------------------------------------------------- |
| `000`             | Malé celé číslo (Small Integer) | Hodnota je uložena přímo v payloadu.                                                   |
| `001`             | Ukazatel na seznam (Cons Cell)  | Payload je adresa v paměti.                                                            |
| `010`             | Symbol (Atom)                   | Payload je ukazatel na strukturu Symbolu.                                              |
| `111`             | Forwarding Pointer              | Tato adresa je zastaralá; skutečná data jsou na adrese v payloadu (používá se pro GC). |

## Důsledky

1. Rychlá dynamická kontrola typů
	- V konvenčním CPU tato kontrola vyžaduje instrukce navíc
2. Hardwarová podpora pro garbage collection
	- tagy slouží jako metadata, které GC algoritmus potřebuje

## Kde zůstala
Přestože už se dnes nepoužívá, pozůstatky a myšlenky této architektury jsou v mainstreamu stále využíváné v podobě JIT-compilátorů (JVM) nebo např. pointer tagging, který využívá softwarové tagování ukazatelů.

## Proč se dnes nepoužívá
Hlavní nevýhodou taggované architektury jsou systémové náklady (overhead) uložené na každý prvek:
### Režie
- **Ztráta Paměti (Memory Overhead):** Taggované slovo je širší. Pokud má standardní 64-bitový systém 4 bity pro tag, každé paměťové slovo musí být 68-bitové.
    - To znamená, že **4 až 8 bitů z každého slova jsou vyplýtvány** na tag, i když se zrovna ukládají data, která tag nepotřebují (např. pole bajtů, bitmapy, textové řetězce, nebo binární data pro I/O).
    - Paměťové sběrnice a řadiče by musely být složitější a širší, což by zvýšilo náklady a zpoždění.

- **Režie Cache a Sběrnice:** Při přenosu dat mezi pamětí a CPU (včetně Cache) se vždy přenáší i tag. Pro standardní data, která tag nepotřebují, se **zbytečně plýtvá šířkou pásma sběrnice (Bandwidth)**.

### Neefektivita pro statické jazyky
Většina softwaru na světě je napsána v **staticky typovaných jazycích** (jako C, C++, Rust, Go) nebo pracuje s binárními daty, kde je typ znám při kompilaci.

- **Statická Kontrola Typů:** V C++ kompilátor již v době překladu ví, že sčítá dvě celá čísla. Runtime kontrola typů je zbytečná a pouze zpomaluje.
    
- **Nejčastější Operace:** Většina času CPU je věnována operacím, které se v dynamických jazycích nevyskytují: kopírování bloků paměti (`memcpy`), zpracování textu nebo I/O operace. Pro tyto úkoly jsou tagy **zbytečnou zátěží**.
    
- **Univerzálnost:** Mainstreamové procesory jsou navrženy tak, aby byly **efektivní v průměru pro jakýkoliv úkol**. Taggovaná architektura by optimalizovala úzký segment trhu (dynamické jazyky), ale zhoršovala by výkon širokého segmentu (systémový software, hry, databáze).