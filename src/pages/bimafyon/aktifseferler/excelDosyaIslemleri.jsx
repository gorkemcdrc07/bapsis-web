export async function excelDosyasiSecildi(event, processExcelFile) {
    const file = event.target.files?.[0];

    if (!file) return;

    await processExcelFile(file);

    event.target.value = "";
}