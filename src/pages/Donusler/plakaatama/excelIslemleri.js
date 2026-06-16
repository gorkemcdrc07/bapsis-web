import { columnsData } from "./constants";
import { getExcelValue, normalizePlate } from "./helpers";

export function buildBaseRowFromExcel(excelRow, currentRow = {}) {
    return {
        id: currentRow.id,
        kaynak: currentRow.kaynak || "Manuel",

        seferNo: getExcelValue(excelRow, [
            "Sefer No",
            "SeferNo",
            "seferNo",
            "sefer_no",
        ]),

        sevkTarihi: getExcelValue(excelRow, [
            "Sevk Tarih",
            "Sevk Tarihi",
            "sevkTarihi",
            "sevk_tarihi",
        ]),

        yukleyenDepo: getExcelValue(excelRow, [
            "Yükleyen",
            "Yükleyen Depo",
            "Yukleyen Depo",
            "yukleyenDepo",
            "yukleyen_depo",
        ]),

        kalkisYeri: getExcelValue(excelRow, [
            "Kalkış Yeri",
            "Kalkis Yeri",
            "kalkisYeri",
            "kalkis_yeri",
        ]),

        aracCinsi: getExcelValue(excelRow, [
            "Araç Cinsi",
            "Arac Cinsi",
            "aracCinsi",
            "arac_cinsi",
        ]),

        cekici: normalizePlate(
            getExcelValue(excelRow, [
                "Çekici",
                "Cekici",
                "cekici",
            ])
        ),

        dorse: getExcelValue(excelRow, [
            "Dorse",
            "dorse",
        ]),

        tc: getExcelValue(excelRow, [
            "TC",
            "Tc",
            "tc",
        ]),

        surucu: getExcelValue(excelRow, [
            "Sürücü",
            "Surucu",
            "surucu",
        ]),

        telefon: getExcelValue(excelRow, [
            "Telefon",
            "telefon",
        ]),

        faturaVkn: getExcelValue(excelRow, [
            "VKN",
            "Fatura VKN",
            "faturaVkn",
            "fatura_vkn",
            "vkn",
        ]),

        vkn: getExcelValue(excelRow, [
            "VKN",
            "Fatura VKN",
            "faturaVkn",
            "fatura_vkn",
            "vkn",
        ]),

        varis1: getExcelValue(excelRow, [
            "Varış 1",
            "Varis 1",
            "Varış1",
            "Varis1",
            "varis1",
        ]),

        varis2: getExcelValue(excelRow, [
            "Varış 2",
            "Varis 2",
            "Varış2",
            "Varis2",
            "varis2",
        ]),

        varis3: getExcelValue(excelRow, [
            "Varış 3",
            "Varis 3",
            "Varış3",
            "Varis3",
            "varis3",
        ]),

        varis4: getExcelValue(excelRow, [
            "Varış 4",
            "Varis 4",
            "Varış4",
            "Varis4",
            "varis4",
        ]),

        palet: getExcelValue(excelRow, [
            "Palet",
            "palet",
        ]),

        irsaliyeNo: getExcelValue(excelRow, [
            "İrsaliye",
            "Irsaliye",
            "İrsaliye No",
            "Irsaliye No",
            "irsaliyeNo",
            "irsaliye_no",
        ]),

        irsaliye: getExcelValue(excelRow, [
            "İrsaliye",
            "Irsaliye",
            "İrsaliye No",
            "Irsaliye No",
            "irsaliye",
            "irsaliyeNo",
            "irsaliye_no",
        ]),

        datalogerNo: getExcelValue(excelRow, [
            "Dataloger",
            "Dataloger No",
            "datalogerNo",
            "dataloger_no",
        ]),

        navlun: getExcelValue(excelRow, [
            "Navlun",
            "navlun",
        ]),

        aracDurumu: getExcelValue(excelRow, [
            "Araç Duru",
            "Araç Durumu",
            "Arac Duru",
            "Arac Durumu",
            "Durum",
            "aracDurumu",
            "arac_durumu",
        ]),

        peronNo: getExcelValue(excelRow, [
            "Peron",
            "peronNo",
            "peron_no",
        ]),

        peron: getExcelValue(excelRow, [
            "Peron",
            "peron",
            "peronNo",
            "peron_no",
        ]),
    };
}

export async function exportPlakaAtamaExcel(rows) {
    const XLSX = await import("xlsx");

    const exportColumns = columnsData.filter((column) => column.key !== "actions");

    const data = rows.map((row) => {
        const item = {};

        exportColumns.forEach((column) => {
            item[column.label] = row[column.key] ?? "";
        });

        return item;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Dönüş Plaka Atama");
    XLSX.writeFile(workbook, "donus-plaka-atama.xlsx");
}
