export function isFileDrag(event) {
    return Array.from(event.dataTransfer?.types || []).includes("Files");
}

export function isAllowedExcelFile(file) {
    if (!file?.name) return false;
    return /\.(xlsx|xls|csv)$/i.test(file.name);
}

export function sayfaDragEnter(event, fileDragDepthRef, setIsDragActive) {
    if (!isFileDrag(event)) return;

    event.preventDefault();
    fileDragDepthRef.current += 1;
    setIsDragActive(true);
}

export function sayfaDragOver(event, setIsDragActive) {
    if (!isFileDrag(event)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
}

export function sayfaDragLeave(event, fileDragDepthRef, setIsDragActive) {
    if (!isFileDrag(event)) return;

    event.preventDefault();
    fileDragDepthRef.current = Math.max(0, fileDragDepthRef.current - 1);

    if (fileDragDepthRef.current === 0) {
        setIsDragActive(false);
    }
}

export async function sayfaDrop(event, fileDragDepthRef, setIsDragActive, processExcelFile) {
    if (!isFileDrag(event)) return;

    event.preventDefault();
    event.stopPropagation();

    fileDragDepthRef.current = 0;
    setIsDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    if (!isAllowedExcelFile(file)) {
        alert("Lütfen .xlsx, .xls veya .csv dosyasý yükleyin.");
        return;
    }

    await processExcelFile(file);
}