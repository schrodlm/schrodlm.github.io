---
layout: note
title: "matrix_transpose()"
---

> [!note] Zobecnění
> Pozor tato implementace je zobecněná i na matice, kde $N$ není mocnina $2$. Tedy musí být připravena na nečtvercové podmatice.
> Proto `swapAndTranspose()` nerozděluje rovnou na 4 podproblémy, ale jen na 2
```c++
void transpose() {
	transposeInPlaceRecursive(0, 0, N);
}
void transposeInPlaceRecursive(int row, int col, int size) {
	if (size == 1) {
		return;
}

	int half = size / 2;
	int rem = size - half;
	
	// Transpose four quadrants
	transposeInPlaceRecursive(row, col, half); // A11
	transposeInPlaceRecursive(row + half, col + half, rem); // A22

	// Swap and transpose off-diagonal blocks
	swapAndTranspose(row, col + half, row + half, col, half, rem); // A12,A21
}

	void swapAndTranspose(int r1, int c1, int r2, int c2, int rows, int cols) {
	if (rows <= 1 && cols <= 1) {
		// Base case: naive swap and transpose
		swap(r1,c1,r2,c2);
		return;
	}
	// Divide along longer dimension
	if (rows >= cols) {
		int mid = rows / 2;
		swapAndTranspose(r1, c1, r2, c2, mid, cols);
		swapAndTranspose(r1 + mid, c1, r2, c2 + mid, rows - mid, cols);
	} else {
		int mid = cols / 2;
		swapAndTranspose(r1, c1, r2, c2, rows, mid);
		swapAndTranspose(r1, c1 + mid, r2 + mid, c2, rows, cols - mid);
	}
}
```