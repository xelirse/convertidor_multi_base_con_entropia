// ─────────────────────────────────────────────────────────────────────────────
// Funciones puras (sin estado)
// ─────────────────────────────────────────────────────────────────────────────

function calculateShannonEntropy(str) {
    if (!str || str.length === 0) return 0;
    const freq = {};
    for (const char of str) {
        freq[char] = (freq[char] || 0) + 1;
    }
    const len = str.length;
    let entropy = 0;
    for (const count of Object.values(freq)) {
        const p = count / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

function baseToBigInt(str, baseNum, alphabet) {
    if (!str || str.trim() === '') return null;
    if ((baseNum < 2 || baseNum > 36) && baseNum !== 64) {
        throw new Error("Solo se permiten bases del 2 al 36, o la Base 64.");
    }
    let result = 0n;
    const base = BigInt(baseNum);
    let cleanStr = str.trim();
    if (baseNum === 64) {
        cleanStr = cleanStr.replace(/=+$/, '');
    } else {
        cleanStr = cleanStr.toLowerCase();
    }
    for (let i = 0; i < cleanStr.length; i++) {
        const char = cleanStr[i];
        let charValue;
        if (baseNum === 64) {
            charValue = alphabet.indexOf(char);
            if (charValue === -1) {
                throw new Error(`El carácter '${char}' no es válido en Base 64.`);
            }
        } else {
            charValue = parseInt(char, baseNum);
            if (isNaN(charValue)) {
                throw new Error(`El carácter '${char}' no es válido para la base ${baseNum}.`);
            }
        }
        result = (result * base) + BigInt(charValue);
    }
    return result;
}

function bigIntToBase64(bigNum, alphabet) {
    if (bigNum === 0n) return "A";
    let result = "";
    let num = bigNum < 0n ? -bigNum : bigNum;
    const base = 64n;
    while (num > 0n) {
        const remainder = Number(num % base);
        result = alphabet[remainder] + result;
        num = num / base;
    }
    return bigNum < 0n ? "-" + result : result;
}

function bigIntToTargetBase(bigNum, targetBase, alphabet) {
    if (targetBase === 64) {
        return bigIntToBase64(bigNum, alphabet);
    }
    return bigNum.toString(targetBase);
}

function buildResults(state, bigIntValue, useUppercase) {
    const results = [];
    for (let i = 0; i < state.TARGET_BASES.length; i++) {
        const base = state.TARGET_BASES[i];
        let convertedValue = bigIntToTargetBase(bigIntValue, base, state.BASE64_ALPHABET);
        if (useUppercase && base !== 64) {
            convertedValue = convertedValue.toUpperCase();
        }
        const entropy = calculateShannonEntropy(convertedValue);
        const maxEntropy = Math.log2(base);
        const efficiency = maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
        results.push({
            base: base,
            value: convertedValue,
            entropy: entropy,
            maxEntropy: maxEntropy,
            efficiency: efficiency,
            order: i
        });
    }
    return results;
}

function sortResults(state, results) {
    if (!state.sortByEntropy) return results;
    const sorted = results.slice();
    sorted.sort(function (a, b) {
        const diff = state.sortDirection === 'asc'
            ? a.entropy - b.entropy
            : b.entropy - a.entropy;
        if (diff !== 0) return diff;
        return a.order - b.order;
    });
    return sorted;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de UI (reciben state como parámetro)
// ─────────────────────────────────────────────────────────────────────────────

function syncSelectToInput(state) {
    const val = state.baseInput.value;
    const options = Array.from(state.baseSelect.options);
    let match = null;
    for (const opt of options) {
        if (opt.value === val) {
            match = opt;
            break;
        }
    }
    if (match) {
        state.baseSelect.value = val;
    } else {
        let numVal = parseInt(val, 10);
        if (isNaN(numVal) || numVal < 2) numVal = 2;
        if (numVal > 64) numVal = 64;
        state.baseInput.value = numVal;
        let matchAfter = null;
        for (const opt of Array.from(state.baseSelect.options)) {
            if (opt.value === String(numVal)) {
                matchAfter = opt;
                break;
            }
        }
        state.baseSelect.value = matchAfter ? String(numVal) : 'otra';
    }
}

function syncInputToSelect(state) {
    const val = parseInt(state.baseSelect.value, 10);
    if (!isNaN(val) && val >= 2 && val <= 64) {
        state.baseInput.value = val;
    }
}

function resetStatus(state) {
    state.statusIndicator.classList.remove('updated');
    state.statusText.textContent = 'Listo';
}

function setStatus(state, statusState, message) {
    state.statusIndicator.classList.remove('waiting', 'updated');
    if (statusState === 'waiting') {
        state.statusIndicator.classList.add('waiting');
    } else if (statusState === 'updated') {
        state.statusIndicator.classList.add('updated');
        setTimeout(resetStatus.bind(null, state), 2000);
    }
    state.statusText.textContent = message;
}

function clearProcessing(state) {
    state.mainContainer.classList.remove('processing');
}

function clearErrorMessage(state, errorMessage) {
    if (state.errorMsg.innerText === errorMessage) {
        state.errorMsg.style.display = "none";
    }
}

function restoreCopyButton(btnElement, originalText) {
    btnElement.innerText = originalText;
    btnElement.style.background = "#e2e8f0";
    btnElement.style.color = "#333";
}

function showCopiedFeedback(btnElement) {
    const originalText = btnElement.innerText;
    btnElement.innerText = "¡Copiado!";
    btnElement.style.background = "#28a745";
    btnElement.style.color = "white";
    btnElement.style.transition = "all 0.2s";
    setTimeout(restoreCopyButton.bind(null, btnElement, originalText), 1200);
}

async function copyToClipboard(text, btnElement) {
    try {
        await navigator.clipboard.writeText(text);
        showCopiedFeedback(btnElement);
    } catch {
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showCopiedFeedback(btnElement);
    }
}

function updateSortDirectionButton(state) {
    state.sortDirectionBtn.textContent = state.sortDirection === 'asc' ? '↑' : '↓';
    state.sortDirectionBtn.title = state.sortDirection === 'asc'
        ? 'Menor a mayor'
        : 'Mayor a menor';
    state.sortDirectionBtn.disabled = !state.sortByEntropy;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────

function handleAutoConvertTimer(state) {
    state.debounceTimer = null;
    convertAndDisplay(state, true);
}

function scheduleAutoConvert(state) {
    if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
    }
    setStatus(state, 'waiting', 'Esperando cambios...');
    state.debounceTimer = setTimeout(handleAutoConvertTimer.bind(null, state), state.DEBOUNCE_DELAY);
}

function handleBaseSelectChange(state) {
    syncInputToSelect(state);
    scheduleAutoConvert(state);
}

function handleBaseInputInput(state) {
    syncSelectToInput(state);
    scheduleAutoConvert(state);
}

function handleBaseInputBlur(state) {
    let val = parseInt(state.baseInput.value, 10);
    if (isNaN(val) || val < 2) val = 2;
    if (val > 64) val = 64;
    state.baseInput.value = val;
    syncSelectToInput(state);
}

function handleTextInputInput(state) {
    scheduleAutoConvert(state);
}

function handleUppercaseCheckChange(state) {
    scheduleAutoConvert(state);
}

function handleSortEntropyChange(state) {
    state.sortByEntropy = state.sortEntropyCheck.checked;
    updateSortDirectionButton(state);
    convertAndDisplay(state, false, true);
}

function handleSortDirectionClick(state) {
    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    updateSortDirectionButton(state);
    convertAndDisplay(state, false, true);
}

function handleConvertBtnClick(state) {
    if (state.debounceTimer) {
        clearTimeout(state.debounceTimer);
        state.debounceTimer = null;
    }
    convertAndDisplay(state, false);
}

function handleKeyPress(state, event) {
    if (event.key === "Enter") {
        if (state.debounceTimer) {
            clearTimeout(state.debounceTimer);
            state.debounceTimer = null;
        }
        convertAndDisplay(state, false);
    }
}

function handleGridClick(event) {
    const btn = event.target.closest('.copy-btn');
    if (!btn) return;
    event.stopPropagation();
    copyToClipboard(btn.dataset.value, btn);
}

function removeJustUpdatedAnimation(card) {
    card.classList.remove('just-updated');
}

function addJustUpdatedAnimation(card) {
    card.classList.add('just-updated');
    card.addEventListener('animationend', removeJustUpdatedAnimation.bind(null, card), { once: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────────────────────

function renderCard(state, base, value, entropy, maxEntropy, efficiency) {
    const card = document.createElement("div");
    card.className = "result-card";

    const entropyFormatted = entropy.toFixed(3);
    const maxEntropyFormatted = maxEntropy.toFixed(3);
    const efficiencyFormatted = efficiency.toFixed(1);

    card.innerHTML = `
        <div class="result-header">
            <span class="result-title">BASE ${base}</span>
            <button class="copy-btn" data-value="${value}">Copiar</button>
        </div>
        <div class="result-value">${value}</div>
        <div class="entropy-section">
            <div class="entropy-row">
                <span class="entropy-label">H:</span>
                <span class="entropy-value">${entropyFormatted} bits</span>
            </div>
            <div class="entropy-row entropy-max">
                <span>máx ${maxEntropyFormatted} bits</span>
                <span>${efficiencyFormatted}% efic.</span>
            </div>
            <div class="entropy-bar-bg">
                <div class="entropy-bar-fill" style="width: ${Math.min(efficiency, 100)}%;"></div>
            </div>
        </div>
    `;

    state.resultsGrid.appendChild(card);
}

// ─────────────────────────────────────────────────────────────────────────────
// Núcleo
// ─────────────────────────────────────────────────────────────────────────────

function convertAndDisplay(state, isAuto = false, force = false) {
    const inputStr = state.textInput.value;
    const currentBase = parseInt(state.baseInput.value, 10);

    if (!inputStr.trim()) {
        state.errorMsg.style.display = "none";
        state.resultsGrid.innerHTML = "";
        state.lastConvertedInput = '';
        setStatus(state, 'updated', 'Sin datos');
        state.mainContainer.classList.remove('processing');
        return;
    }

    const currentUppercase = state.uppercaseCheck.checked;
    if (!force &&
        inputStr === state.lastConvertedInput &&
        currentBase === state.lastConvertedBase &&
        currentUppercase === state.lastUppercaseState &&
        state.sortByEntropy === state.lastSortByEntropy &&
        state.sortDirection === state.lastSortDirection &&
        state.resultsGrid.children.length > 0) {
        setStatus(state, 'updated', 'Sin cambios');
        state.mainContainer.classList.remove('processing');
        return;
    }

    state.mainContainer.classList.add('processing');

    try {
        const bigIntValue = baseToBigInt(inputStr, currentBase, state.BASE64_ALPHABET);

        if (bigIntValue === null) {
            state.resultsGrid.innerHTML = "";
            state.errorMsg.style.display = "none";
            setStatus(state, 'updated', 'Vacío');
            state.mainContainer.classList.remove('processing');
            return;
        }

        const useUppercase = currentUppercase;

        state.lastConvertedInput = inputStr;
        state.lastConvertedBase = currentBase;
        state.lastUppercaseState = useUppercase;
        state.lastSortByEntropy = state.sortByEntropy;
        state.lastSortDirection = state.sortDirection;

        state.errorMsg.style.display = "none";
        state.resultsGrid.innerHTML = "";

        const results = buildResults(state, bigIntValue, useUppercase);
        const ordered = sortResults(state, results);

        for (const r of ordered) {
            renderCard(state, r.base, r.value, r.entropy, r.maxEntropy, r.efficiency);
        }

        const allCards = state.resultsGrid.querySelectorAll('.result-card');
        for (const card of allCards) {
            addJustUpdatedAnimation(card);
        }

        const origen = isAuto ? 'Auto' : 'Manual';
        setStatus(state, 'updated', `✅ Actualizado (${origen})`);

        state.mainContainer.classList.add('processing');
        setTimeout(clearProcessing.bind(null, state), 400);

    } catch (error) {
        state.errorMsg.innerText = error.message;
        state.errorMsg.style.display = "block";
        state.resultsGrid.innerHTML = "";
        setStatus(state, 'updated', '❌ Error');
        state.mainContainer.classList.remove('processing');

        setTimeout(clearErrorMessage.bind(null, state, error.message), 4000);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────────────────────────────────────

function createState() {
    // Bases principales primero, en el orden indicado
    const principales = [2, 3, 8, 10, 16, 23, 30, 32, 36, 64];
    const targetBases = [];
    for (const b of principales) {
        targetBases.push(b);
    }
    // Después el resto de bases del 2 al 36 que no estén ya incluidas
    for (let i = 2; i <= 36; i++) {
        if (!principales.includes(i)) {
            targetBases.push(i);
        }
    }

    return {
        baseSelect: document.getElementById("baseSelect"),
        baseInput: document.getElementById("baseInput"),
        textInput: document.getElementById("textInput"),
        resultsGrid: document.getElementById("resultsGrid"),
        errorMsg: document.getElementById("errorMsg"),
        uppercaseCheck: document.getElementById("uppercaseCheck"),
        sortEntropyCheck: document.getElementById("sortEntropyCheck"),
        sortDirectionBtn: document.getElementById("sortDirectionBtn"),
        convertBtn: document.getElementById("convertBtn"),
        statusIndicator: document.getElementById("statusIndicator"),
        statusText: document.getElementById("statusText"),
        mainContainer: document.getElementById("mainContainer"),

        BASE64_ALPHABET: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
        TARGET_BASES: targetBases,
        DEBOUNCE_DELAY: 1000,

        debounceTimer: null,
        lastConvertedInput: '',
        lastConvertedBase: 64,
        lastUppercaseState: false,

        sortByEntropy: false,
        sortDirection: 'desc',
        lastSortByEntropy: false,
        lastSortDirection: 'desc'
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada
// ─────────────────────────────────────────────────────────────────────────────

function programa() {
    const state = createState();

    state.baseSelect.addEventListener('change', handleBaseSelectChange.bind(null, state));
    state.baseInput.addEventListener('input', handleBaseInputInput.bind(null, state));
    state.baseInput.addEventListener('blur', handleBaseInputBlur.bind(null, state));
    state.textInput.addEventListener('input', handleTextInputInput.bind(null, state));
    state.uppercaseCheck.addEventListener('change', handleUppercaseCheckChange.bind(null, state));
    state.sortEntropyCheck.addEventListener('change', handleSortEntropyChange.bind(null, state));
    state.sortDirectionBtn.addEventListener('click', handleSortDirectionClick.bind(null, state));
    state.textInput.addEventListener('keypress', handleKeyPress.bind(null, state));
    state.baseInput.addEventListener('keypress', handleKeyPress.bind(null, state));
    state.convertBtn.addEventListener('click', handleConvertBtnClick.bind(null, state));
    state.resultsGrid.addEventListener('click', handleGridClick);

    updateSortDirectionButton(state);

    if (state.textInput.value.trim()) {
        convertAndDisplay(state, false);
    }

    console.log('✅ Convertidor Multi-Base con Entropía listo – Auto-conversión en 1 segundo.');
}

programa();
