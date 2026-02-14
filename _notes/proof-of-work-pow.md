---
layout: note
title: "proof of work (PoW)"
---

**Proof of Work (PoW)** je mechanismus, který v masivně distribuovaných systémech nahrazuje důvěru mezi uzly prokazatelným vynaložením výpočetního úsilí. V prostředí, jako je Bitcoin, kde neexistuje centrální autorita, slouží k dosažení globální shody (konsenzu) i v přítomnosti uzlů, které mohou lhát nebo se chovat zákeřně (byzantské chyby).

>[!note] TL;DR
>- **Mechanismus:** Hledání hashe s určitým počtem nul na začátku (brute-force).
> - **Význam:** Nahrazuje lidskou důvěru matematickou jistotou a ekonomickým nákladem.
> - **Vlastnost:** Záměrná pomalost zajišťuje, že se informace stihne rozšířit po celém světě před dalším zápisem.

---
### K čemu Proof of Work slouží?

Hlavním účelem PoW je zabezpečení sítě a vyřešení tří fundamentálních problémů distribuovaných systémů:
**Obrana proti Sybil útoku:** V otevřené síti by útočník mohl vytvořit miliony falešných identit a ovládnout systém . PoW tomu brání tím, že „hlasovací právo“ neváže na identitu (IP adresu), ale na **výpočetní výkon** (hardware a elektřinu), což je pro útočníka extrémně drahé.
**Dosažení konsenzu bez lídra:** Umožňuje uzlům shodnout se na jediné verzi historie (blockchainu), aniž by potřebovaly centrální autoritu.
**Byzantská odolnost (BFT):** PoW je praktickou implementací odolnosti proti byzantským chybám v masivním měřítku, kde se předpokládá, že část uzlů je nespolehlivá nebo úmyslně škodí.

