Dvojice instrukcí používaných k dosažení synchronizace

- `LL` (Load Linked): Atomické čtení, při kterém si procesor zapamatuje adresu a sleduje ji.
	- To sledování většinou funguje na nějaké bázi sledování cache line (s použitím [MESI protokolu])
- `SC` (Store Conditional): Zápis na adresu, který uspěje **pouze tehdy**, pokud na danou adresu nikdo jiný nezapsal od momentu provedení `LL`. Jinak hlásí chybu .

_Poznámka:_ [CAS](/notes/cas/) lze simulovat pomocí [LLSC](/notes/llsc/), ale naopak to obvykle nejde (kvůli [ABA problému](/notes/aba-problem/)).