import { getExcelValue, normalizePlate } from "./helpers";

export function buildBaseRowFromExcel(excelRow, currentRow) {
    return {
        id: currentRow.id,
        kaynak: currentRow.kaynak || "Manuel",
        seferNo: getExcelValue(excelRow, ["Sefer No", "seferNo", "sefer_no"]),
        sevkTarihi: getExcelValue(excelRow, ["Sevk Tarihi", "sevkTarihi", "sevk_tarihi"]),
        yukleyenDepo: getExcelValue(excelRow, ["Yükleyen Depo", "yukleyenDepo", "yukleyen_depo"]),
        kalkisYeri: getExcelValue(excelRow, ["Kalkış Yeri", "kalkisYeri", "kalkis_yeri"]),
        aracCinsi: getExcelValue(excelRow, ["Araç Cinsi", "aracCinsi", "arac_cinsi"]),
        cekici: normalizePlate(getExcelValue(excelRow, ["Çekici", "cekici"])),
        dorse: getExcelValue(excelRow, ["Dorse", "dorse"]),
        tc: getExcelValue(excelRow, ["TC", "tc"]),
        surucu: getExcelValue(excelRow, ["Sürücü", "surucu"]),
        telefon: getExcelValue(excelRow, ["Telefon", "telefon"]),
        faturaVkn: getExcelValue(excelRow, ["VKN", "faturaVkn", "fatura_vkn"]),
        varis1: getExcelValue(excelRow, ["Varış 1", "varis1"]),
        varis2: getExcelValue(excelRow, ["Varış 2", "varis2"]),
        varis3: getExcelValue(excelRow, ["Varış 3", "varis3"]),
        varis4: getExcelValue(excelRow, ["Varış 4", "varis4"]),
        palet: getExcelValue(excelRow, ["Palet", "palet"]),
        irsaliyeNo: getExcelValue(excelRow, ["İrsaliye", "irsaliyeNo", "irsaliye_no"]),
        datalogerNo: getExcelValue(excelRow, ["Dataloger", "datalogerNo", "dataloger_no"]),
        navlun: getExcelValue(excelRow, ["Navlun", "navlun"]),
        aracDurumu: getExcelValue(excelRow, ["Durum", "aracDurumu", "arac_durumu"]),
        peronNo: getExcelValue(excelRow, ["Peron", "peronNo", "peron_no"]),
    };
}

export async function exportAktifSeferExcel(rows, araclar = []) {
    const ExcelJS = (await import("exceljs")).default;

    const exportColumns = [
        { key: "id", label: "ID" },
        { key: "kaynak", label: "Kaynak" },
        { key: "seferNo", label: "Sefer No" },
        { key: "sevkTarihi", label: "Sevk Tarihi" },
        { key: "yukleyenDepo", label: "Yükleyen Depo" },
        { key: "kalkisYeri", label: "Kalkış Yeri" },
        { key: "aracCinsi", label: "Araç Cinsi" },
        { key: "cekici", label: "Çekici" },
        { key: "dorse", label: "Dorse" },
        { key: "tc", label: "TC" },
        { key: "surucu", label: "Sürücü" },
        { key: "telefon", label: "Telefon" },
        { key: "faturaVkn", label: "VKN" },
        { key: "varis1", label: "Varış 1" },
        { key: "varis2", label: "Varış 2" },
        { key: "varis3", label: "Varış 3" },
        { key: "varis4", label: "Varış 4" },
        { key: "palet", label: "Palet" },
        { key: "irsaliyeNo", label: "İrsaliye" },
        { key: "datalogerNo", label: "Dataloger" },
        { key: "navlun", label: "Navlun" },
        { key: "aracDurumu", label: "Durum" },
        { key: "peronNo", label: "Peron" },
    ];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Aktif Seferler";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Aktif Seferler");
    const araclarSheet = workbook.addWorksheet("Araclar");

    worksheet.columns = exportColumns.map((column) => ({
        header: column.label,
        key: column.key,
        width: Math.max(12, String(column.label).length + 4),
    }));

    araclarSheet.columns = [
        { header: "Çekici", key: "cekici", width: 18 },
        { header: "Dorse", key: "dorse", width: 18 },
        { header: "Sürücü", key: "surucu", width: 24 },
        { header: "TC", key: "tc", width: 16 },
        { header: "Telefon", key: "telefon", width: 18 },
        { header: "VKN", key: "vkn", width: 18 },
    ];

    araclar.forEach((arac) => {
        araclarSheet.addRow({
            cekici: normalizePlate(arac.cekici ?? ""),
            dorse: arac.dorse ?? "",
            surucu: arac.surucu ?? "",
            tc: arac.tc ?? "",
            telefon: arac.telefon ?? "",
            vkn: arac.vkn ?? arac.faturaVkn ?? "",
        });
    });

    araclarSheet.state = "veryHidden";

    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    rows.forEach((row) => {
        worksheet.addRow(
            exportColumns.reduce((acc, column) => {
                acc[column.key] = row[column.key] ?? "";
                return acc;
            }, {})
        );
    });

    const getColNumber = (key) =>
        exportColumns.findIndex((column) => column.key === key) + 1;

    const idColumnIndex = getColNumber("id");
    const cekiciColumnIndex = getColNumber("cekici");
    const dorseColumnIndex = getColNumber("dorse");
    const surucuColumnIndex = getColNumber("surucu");
    const tcColumnIndex = getColNumber("tc");
    const telefonColumnIndex = getColNumber("telefon");
    const vknColumnIndex = getColNumber("faturaVkn");

    const formulaColumns = {
        [dorseColumnIndex]: 2,
        [surucuColumnIndex]: 3,
        [tcColumnIndex]: 4,
        [telefonColumnIndex]: 5,
        [vknColumnIndex]: 6,
    };

    for (let rowNumber = 2; rowNumber <= rows.length + 1; rowNumber++) {
        Object.entries(formulaColumns).forEach(([targetCol, sourceCol]) => {
            const cell = worksheet.getCell(rowNumber, Number(targetCol));

            if (cell.value !== null && cell.value !== undefined && cell.value !== "") {
                return;
            }

            const cekiciCell = worksheet.getCell(rowNumber, cekiciColumnIndex).address;
            const sourceColumnLetter = String.fromCharCode(64 + sourceCol);

            cell.value = {
                formula: `IFERROR(XLOOKUP(${cekiciCell},Araclar!$A:$A,Araclar!$${sourceColumnLetter}:$${sourceColumnLetter},""),"")`,
                result: "",
            };
        });
    }

    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: exportColumns.length },
    };

    worksheet.getRow(1).height = 26;

    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell, colNumber) => {
            const isHeader = rowNumber === 1;
            const isIdColumn = colNumber === idColumnIndex;
            const isFormulaColumn = Object.keys(formulaColumns).includes(String(colNumber));

            cell.protection = {
                locked: isHeader || isIdColumn,
            };

            cell.alignment = {
                vertical: "middle",
                horizontal: isHeader ? "center" : "left",
                wrapText: true,
            };

            cell.border = {
                top: { style: "thin", color: { argb: "FFD9E2EC" } },
                left: { style: "thin", color: { argb: "FFD9E2EC" } },
                bottom: { style: "thin", color: { argb: "FFD9E2EC" } },
                right: { style: "thin", color: { argb: "FFD9E2EC" } },
            };

            if (isHeader) {
                cell.font = { bold: true, color: { argb: "FF111827" } };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE5E7EB" },
                };
            } else {
                cell.font = {
                    color: { argb: "FF111827" },
                    bold: isIdColumn,
                    italic: isFormulaColumn,
                };

                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: rowNumber % 2 === 0 ? "FFFFFFFF" : "FFF9FAFB",
                    },
                };
            }

            if (isIdColumn) {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF3F4F6" },
                };
            }

            if (isFormulaColumn && !isHeader) {
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFF8FAFC" },
                };
            }
        });
    });

    worksheet.columns.forEach((column) => {
        let maxLength = 0;

        column.eachCell({ includeEmpty: true }, (cell) => {
            const value = cell.value?.formula ? cell.value.result ?? "" : cell.value ?? "";
            maxLength = Math.max(maxLength, String(value).length);
        });

        column.width = Math.min(Math.max(maxLength + 3, 12), 32);
    });

    worksheet.getColumn(idColumnIndex).width = 10;

    await worksheet.protect("id-kilitli", {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: true,
        formatColumns: true,
        formatRows: true,
        insertRows: false,
        insertColumns: false,
        deleteRows: false,
        deleteColumns: false,
        sort: true,
        autoFilter: true,
    });

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "aktif-seferler-revize.xlsx";
    link.click();

    window.URL.revokeObjectURL(url);
}