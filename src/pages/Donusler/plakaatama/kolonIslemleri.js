export function kolonBoyutlandir(event, key, columns, setColumns) {
    event.preventDefault();

    const startX = event.clientX;

    const column = columns.find((item) => item.key === key);

    const startWidth = column?.width || 140;
    const minWidth = column?.minWidth || 130;
    const maxWidth = column?.maxWidth || 800;

    const onMouseMove = (moveEvent) => {
        const diff = moveEvent.clientX - startX;

        const newWidth = Math.min(
            maxWidth,
            Math.max(minWidth, startWidth + diff)
        );

        setColumns((prev) =>
            prev.map((item) =>
                item.key === key
                    ? {
                        ...item,
                        width: newWidth,
                    }
                    : item
            )
        );
    };

    const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
}

export function kolonSurukleBirak(draggedKey, targetKey, setColumns) {
    if (!draggedKey || draggedKey === targetKey) return;

    setColumns((prev) => {
        const dragged = prev.find((column) => column.key === draggedKey);

        if (!dragged || dragged.fixed) return prev;

        const next = prev.filter(
            (column) => column.key !== draggedKey
        );

        const targetIndex = next.findIndex(
            (column) => column.key === targetKey
        );

        if (targetIndex < 0) return prev;

        next.splice(targetIndex, 0, dragged);

        return next;
    });
}

export function kolonSuruklemeBaslat(
    event,
    key,
    setDraggingColumnKey
) {
    setDraggingColumnKey(key);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("columnKey", key);
}

export function kolonSuruklemeBitir(
    setDraggingColumnKey,
    setDropTargetColumnKey
) {
    setDraggingColumnKey(null);
    setDropTargetColumnKey(null);
}

export function kolonUzerineSurukle(
    event,
    targetKey,
    setDropTargetColumnKey
) {
    const draggedKey = event.dataTransfer.getData("columnKey");

    if (!draggedKey || draggedKey === targetKey) return;

    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    setDropTargetColumnKey(targetKey);
}

export function kolonBirak(
    event,
    targetKey,
    setDraggingColumnKey,
    setDropTargetColumnKey,
    setColumns
) {
    event.preventDefault();
    event.stopPropagation();

    const draggedKey =
        event.dataTransfer.getData("columnKey");

    setDraggingColumnKey(null);
    setDropTargetColumnKey(null);

    kolonSurukleBirak(
        draggedKey,
        targetKey,
        setColumns
    );
}

export function sutunGorunurlukDegistir(
    key,
    setHiddenColumns
) {
    setHiddenColumns((prev) =>
        prev.includes(key)
            ? prev.filter((item) => item !== key)
            : [...prev, key]
    );
}