export function satirMenuPozisyonuHesapla(element) {
    const rect = element.getBoundingClientRect();

    const menuWidth = 220;
    const menuHeight = 180;
    const margin = 12;

    let left = rect.left + rect.width / 2;

    left = Math.max(
        menuWidth / 2 + margin,
        Math.min(left, window.innerWidth - menuWidth / 2 - margin)
    );

    let top = rect.bottom + 8;

    if (top + menuHeight > window.innerHeight - margin) {
        top = rect.top - menuHeight - 8;
    }

    return { top, left };
}

export function satirMenuKapat(setOpenActionRowId, setActionMenuPosition) {
    setOpenActionRowId(null);
    setActionMenuPosition(null);
}