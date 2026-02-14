Jedná se o vlastnost [rodiny hashovacích funkcí](/notes/rodina-hashovacich-funkci/), která popisuje pravděpodobnost kolize mezi dvěma různými vstupy. 

## Definice
Mějme $\mathcal{H}$ rodinu hashovacích funkcí z univerza $\mathcal{U}$ do $[m]$ (index pole). O rodině $\mathcal{H}$ řekneme, že je c-univerzální pro $c > 0$, pokud $\forall x,y \in \mathcal{U}; x \neq y$ platí
$$ P_{h \in \mathcal{H}}[h(x) = h(y)] \leq \frac{c}{m}$$

>[!note] Co to znamená
> Znamená to, že pokud si vybereme náhodně hashovací funkci $h \in \mathcal{H}$, tak pravděpodobnost, že $x$ a $y$ se hashují na stejné místo je jen o konstantu ($c$) horší než u kompletně náhodné funkce $h_\text{universal}$