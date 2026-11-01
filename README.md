# convertidor_multi_base_con_entropia

**Convertidor Multi-Base a BigInt con visualización de entropía de Shannon.**

Una herramienta web (HTML + CSS + JS separados) que convierte un número escrito en cualquier base entre 2 y 36, o Base 64, a **todas** las bases del 2 al 36 más Base 64, mostrando para cada resultado su entropía de Shannon, la entropía máxima teórica de esa base y un indicador de eficiencia.

> 🤖 **Hecho con IA.** Este proyecto fue generado íntegramente con asistencia de inteligencia artificial.

---

## ✨ Características

- **Conversión multi-base**: introduce un valor en base 2–36 o 64 y obtén su representación en las 36 bases (2 a 36 y 64).
- **BigInt nativo**: soporta números arbitrariamente grandes sin pérdida de precisión, gracias a `BigInt`.
- **Entropía de Shannon por resultado**: cada tarjeta muestra:
  - `H`: entropía de Shannon de la cadena resultante (bits por símbolo).
  - `máx`: entropía máxima teórica de esa base (`log₂(base)`).
  - `% efic.`: relación entre la entropía real y la máxima posible, con barra visual.
- **Auto-conversión con debounce**: 1 segundo tras dejar de escribir.
- **Sincronización select ↔ input numérico**: elige base desde el desplegable o escríbela; ambos se mantienen coherentes. Si escribes una base que no está en la lista predefinida, el desplegable muestra **"Otra base"**.
- **Ordenación configurable mediante select**:
  - `Sin ordenar` → orden predeterminado (primero las 10 bases principales, luego el resto).
  - `Ordenar por entropía` → por entropía de Shannon.
  - `Ordenar por eficiencia` → por porcentaje de eficiencia.
  - Un botón `↓` / `↑` alterna entre mayor→menor y menor→mayor. Se deshabilita cuando la ordenación está en "Sin ordenar".
- **Bases principales primero**: `2, 3, 8, 10, 16, 23, 30, 32, 36, 64` aparecen al inicio de la cuadrícula en el orden predeterminado.
- **Mayúsculas opcionales** para bases 2–36.
- **Copiar al portapapeles** con un clic en cada tarjeta, con fallback para navegadores sin `navigator.clipboard`.
- **Manejo de errores** con animación de sacudida para caracteres inválidos.
- **Feedback visual**: animación de resaltado en las tarjetas actualizadas, indicador de estado (esperando / actualizado / error).

---

## 🚀 Uso

No requiere instalación ni build. Solo abre `index.html` en un navegador moderno.

```text
convertidor_multi_base_con_entropia/
├── index.html
├── styles.css
└── script.js
```

### Ejemplos

| Entrada | Base origen | Resultado (Base 10) |
|---------|-------------|---------------------|
| `101010` | 2 | `42` |
| `2A` | 16 | `42` |
| `AQAB` | 64 | `1048576` |
| `Z` | 36 | `35` |

Los caracteres válidos para Base 64 son el alfabeto estándar:

```text
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/
```

### Opciones de base de origen

El desplegable incluye atajos a las bases más usadas y una entrada adicional para bases personalizadas:

| Opción del select | Base usada |
|-------------------|------------|
| `2 (Binario)` | 2 |
| `8 (Octal)` | 8 |
| `10 (Decimal)` | 10 |
| `16 (Hexadecimal)` | 16 |
| `36 (Alfanumérico)` | 36 |
| `64 (Base 64)` | 64 |
| `Otra base` | El número escrito en el input |

Si escribes un número en el input que no coincide con ninguna opción (por ejemplo `5`, `7`, `12`, `27`…), el desplegable cambia automáticamente a **"Otra base"**.

---

## 🧠 Cómo funciona la entropía

Para cada cadena resultante se calcula la **entropía de Shannon**:

```text
H = -Σ p(x) · log₂ p(x)
```

Donde `p(x)` es la frecuencia relativa de cada símbolo en la cadena.

- La **entropía máxima** de una base `b` es `log₂(b)` bits por símbolo.
- La **eficiencia** es `H / log₂(b) × 100`.

Una eficiencia alta indica que los símbolos están distribuidos de forma más uniforme; una baja indica repetición o concentración en pocos símbolos. Es una métrica descriptiva del resultado, no un juicio de calidad.

---

## 🛠️ Tecnologías

- HTML5
- CSS3 (grid, animaciones)
- JavaScript (ES2020+): `BigInt`, `async/await`, `navigator.clipboard`, `addEventListener`
- Sin dependencias externas, sin frameworks, sin build step.

---

## 📐 Arquitectura del JS

El código sigue estas reglas deliberadas:

- **Sin variables globales**: en el ámbito global solo existen declaraciones `function`.
- **Sin IIFE**.
- **Sin funciones anidadas**: cada función vive en el nivel superior.
- **Estado centralizado**: `createState()` devuelve un objeto con referencias al DOM, constantes y estado mutable; se pasa por `.bind()` a cada handler.
- **Punto de entrada único**: `programa()` al final, seguido de `programa();`.

Flujo:

```text
programa()
  ├─ createState()
  └─ addEventListener(...)  →  handlers  →  convertAndDisplay(state)
                                             ├─ baseToBigInt()
                                             ├─ buildResults()
                                             ├─ sortResults()
                                             └─ renderCard()
```

### Estado de ordenación

El orden de las tarjetas se controla con dos campos del estado:

| Campo | Valores | Significado |
|-------|---------|-------------|
| `sortMode` | `'none'` \| `'entropy'` \| `'efficiency'` | Criterio de ordenación |
| `sortDirection` | `'desc'` \| `'asc'` | Mayor→menor o menor→mayor |

Cuando `sortMode === 'none'`, `sortResults()` devuelve el array original sin tocar, respetando el orden predeterminado de `TARGET_BASES` (10 principales y luego el resto). En los otros dos modos se ordena con desempate estable por índice original.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Al ser un proyecto de **dominio público**, puedes:

- Forkearlo.
- Modificarlo.
- Redistribuirlo.
- Usarlo comercialmente.
- Sin atribución requerida.

Si quieres proponer una mejora, abre un issue o un pull request.

---

## 📄 Licencia

**Dominio público (CC0 1.0 Universal / Public Domain Dedication).**

Este proyecto se libera al dominio público. Puedes copiarlo, modificarlo, distribuirlo y usarlo sin restricciones, sin necesidad de atribución. Se ofrece **sin garantía de ningún tipo**, expresa o implícita.

Para más detalles, consulta [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

---

## ⚠️ Aviso sobre IA

Este proyecto fue creado con asistencia de inteligencia artificial. Aunque se ha revisado su funcionamiento, no se ofrece ninguna garantía sobre su corrección, seguridad o idoneidad para un propósito concreto. Úsalo bajo tu propio criterio.

---

Hecho con 🤖 e IA.
