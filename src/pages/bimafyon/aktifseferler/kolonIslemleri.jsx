export function kolonBoyutlandir(event, key, columns, setColumns) {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const column = columns.find((item) => item.key === key);
    const startWidth = column?.width || 120;

    const onMouseMove = (moveEvent) => {
        const newWidth = Math.max(80, startWidth + moveEvent.clientX - startX);

        setColumns((prev) =>
            prev.map((item) =>
                item.key === key ? { ...item, width: newWidth } : item
            )
        );
    };

    const onMouseUp = () => {
        document.body.classList.remove("column-resizing");
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    };

    document.body.classList.add("column-resizing");
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
}

export function kolonSurukleBirak(draggedKey, targetKey, setColumns) {
    if (!draggedKey || !targetKey || draggedKey === targetKey) return;

    setColumns((prev) => {
        const dragged = prev.find((column) => column.key === draggedKey);
        const target = prev.find((column) => column.key === targetKey);

        if (!dragged || !target) return prev;
        if (dragged.fixed || dragged.key === "actions") return prev;
        if (target.fixed || target.key === "actions") return prev;

        const next = prev.filter((column) => column.key !== draggedKey);
        const targetIndex = next.findIndex((column) => column.key === targetKey);

        if (targetIndex < 0) return prev;

        next.splice(targetIndex, 0, dragged);
        return next;
    });
}

export function kolonSuruklemeBaslat(event, key, setDraggingColumnKey) {
    setDraggingColumnKey(key);

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("columnKey", key);
    event.dataTransfer.setData("text/plain", key);
}

export function kolonSuruklemeBitir(setDraggingColumnKey, setDropTargetColumnKey) {
    setDraggingColumnKey(null);
    setDropTargetColumnKey(null);
}

export function kolonUzerineSurukle(event, targetKey, setDropTargetColumnKey) {
    const draggedKey =
        event.dataTransfer.getData("columnKey") ||
        event.dataTransfer.getData("text/plain");

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
        event.dataTransfer.getData("columnKey") ||
        event.dataTransfer.getData("text/plain");

    setDraggingColumnKey(null);
    setDropTargetColumnKey(null);

    kolonSurukleBirak(draggedKey, targetKey, setColumns);
}